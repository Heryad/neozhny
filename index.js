require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const bs58Module = require('bs58');
const bs58 = bs58Module.default || bs58Module;
const crypto = require('crypto');

const token = process.env.TELEGRAM_BOT_TOKEN;
const usdtAddress = process.env.USDT_TRC20_ADDRESS;

if (!token) {
  console.error('Error: TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

if (!usdtAddress || usdtAddress === 'YOUR_USDT_TRC20_ADDRESS_HERE') {
  console.warn('Warning: USDT_TRC20_ADDRESS is not set. Please update .env file');
}

const bot = new TelegramBot(token, { polling: true });

// Load translations
const translations = {
  en: require('./locales/en'),
  ru: require('./locales/ru')
};

// In-memory user storage (use database in production)
const users = {};
const pendingDeposits = {}; // Track users waiting to submit transaction hash

// Initialize or get user data
function getUser(userId) {
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      language: null,
      balance: 0,
      servers: [],
      transactions: [],
      joinDate: new Date().toLocaleDateString()
    };
  }
  return users[userId];
}

// Get translation for user
function t(userId, path) {
  const user = getUser(userId);
  const lang = user.language || 'en';
  const keys = path.split('.');
  let value = translations[lang];

  for (const key of keys) {
    value = value[key];
    if (!value) return path;
  }

  return value;
}

// Helper function to convert Tron hex address to base58
function hexToBase58(hexAddress) {
  try {
    const addressBytes = Buffer.from(hexAddress, 'hex');
    const hash1 = crypto.createHash('sha256').update(addressBytes).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    const checksum = hash2.slice(0, 4);
    const addressWithChecksum = Buffer.concat([addressBytes, checksum]);
    return bs58.encode(addressWithChecksum);
  } catch (error) {
    console.error('Error converting address:', error.message);
    return null;
  }
}

// Verify TRC20 USDT transaction using Trongrid API
async function verifyTRC20Transaction(txHash, expectedAddress) {
  try {
    console.log('🔍 Verifying transaction:', txHash);

    // Get transaction info from Trongrid (correct endpoint)
    const response = await axios.post('https://api.trongrid.io/wallet/gettransactionbyid', {
      value: txHash
    });

    if (!response.data || !response.data.ret) {
      console.log('❌ No transaction data returned');
      return { success: false, reason: 'Transaction not found' };
    }

    if (response.data.ret[0].contractRet !== 'SUCCESS') {
      console.log('❌ Transaction failed on blockchain');
      return { success: false, reason: 'Transaction failed on blockchain' };
    }

    const txData = response.data;
    const contract = txData.raw_data.contract[0];

    // Check if it's a TRC20 transfer
    if (contract.type !== 'TriggerSmartContract') {
      console.log('❌ Not a smart contract transaction');
      return { success: false, reason: 'Not a TRC20 transaction' };
    }

    // USDT TRC20 contract address on Tron
    const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

    // Decode the transfer data
    const parameter = contract.parameter.value;
    const contractAddressHex = parameter.contract_address;

    // Convert contract address to base58 (hex already includes '41' prefix)
    const contractAddressBase58 = hexToBase58(contractAddressHex);

    console.log('📝 Contract:', contractAddressBase58);
    console.log('💵 Expected USDT Contract:', USDT_CONTRACT);

    // Verify it's USDT contract
    if (contractAddressBase58 !== USDT_CONTRACT) {
      console.log('❌ Not a USDT contract');
      return { success: false, reason: 'Not a USDT transaction. Please send USDT only.' };
    }

    // Decode the data to get recipient and amount
    const data = parameter.data;

    // First 8 characters are method signature (a9059cbb for transfer)
    // Next 64 characters are the recipient address (padded)
    // Next 64 characters are the amount in hex

    if (!data || data.length < 136) {
      console.log('❌ Invalid data length');
      return { success: false, reason: 'Invalid transaction data' };
    }

    const methodSig = data.substring(0, 8);
    if (methodSig !== 'a9059cbb') {
      console.log('❌ Not a transfer method');
      return { success: false, reason: 'Not a transfer transaction' };
    }

    const recipientHex = data.substring(32, 72); // Get recipient (40 chars)
    const amountHex = data.substring(72, 136); // Get amount (64 chars)

    // Convert recipient to base58 (need to add '41' prefix for recipient)
    const recipientAddress = hexToBase58('41' + recipientHex);

    console.log('👤 Recipient:', recipientAddress);
    console.log('📍 Expected:', expectedAddress);

    // Check if transaction was sent to our address
    if (recipientAddress !== expectedAddress) {
      console.log('❌ Wrong recipient address');
      return { success: false, reason: 'Transaction sent to wrong address. Please send to the correct deposit address.' };
    }

    // Convert amount from hex (USDT has 6 decimals)
    const amount = parseInt(amountHex, 16) / 1000000; // USDT has 6 decimals

    console.log('💰 Amount:', amount, 'USDT');

    // Verify minimum amount
    if (amount < 100) {
      return { success: false, reason: `Amount too low: $${amount} USDT (minimum $100)` };
    }

    console.log('✅ Transaction verified successfully!');

    return {
      success: true,
      amount: amount,
      txHash: txHash
    };

  } catch (error) {
    console.error('❌ Error verifying transaction:', error.message);
    if (error.response) {
      console.error('Response error:', error.response.data);
      return { success: false, reason: 'Transaction not found on blockchain' };
    }
    return { success: false, reason: 'Error connecting to blockchain API. Please try again.' };
  }
}

// Language selection keyboard
function getLanguageKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🇬🇧 English', callback_data: 'lang_en' },
        { text: '🇷🇺 Русский', callback_data: 'lang_ru' }
      ]
    ]
  };
}

// Main menu keyboard
function getMainMenuKeyboard(userId) {
  return {
    inline_keyboard: [
      [
        { text: t(userId, 'menu.rpcServers'), callback_data: 'menu_rpc' },
        { text: t(userId, 'menu.myServers'), callback_data: 'menu_myservers' }
      ],
      [
        { text: t(userId, 'menu.wallet'), callback_data: 'menu_wallet' },
        { text: t(userId, 'menu.settings'), callback_data: 'menu_settings' }
      ]
    ]
  };
}

// RPC Plans keyboard
function getRPCPlansKeyboard(userId) {
  return {
    inline_keyboard: [
      [{ text: t(userId, 'rpcServers.starter.name'), callback_data: 'plan_starter' }],
      [{ text: t(userId, 'rpcServers.professional.name'), callback_data: 'plan_professional' }],
      [{ text: t(userId, 'rpcServers.enterprise.name'), callback_data: 'plan_enterprise' }],
      [{ text: t(userId, 'menu.back'), callback_data: 'menu_main' }]
    ]
  };
}

// Wallet keyboard
function getWalletKeyboard(userId) {
  return {
    inline_keyboard: [
      [{ text: t(userId, 'wallet.deposit'), callback_data: 'wallet_deposit' }],
      [{ text: t(userId, 'wallet.transactions'), callback_data: 'wallet_transactions' }],
      [{ text: t(userId, 'menu.back'), callback_data: 'menu_main' }]
    ]
  };
}


// Settings keyboard
function getSettingsKeyboard(userId) {
  return {
    inline_keyboard: [
      [{ text: t(userId, 'settings.language'), callback_data: 'settings_language' }],
      [{ text: t(userId, 'settings.notifications'), callback_data: 'settings_notifications' }],
      [{ text: t(userId, 'settings.account'), callback_data: 'settings_account' }],
      [{ text: t(userId, 'menu.back'), callback_data: 'menu_main' }]
    ]
  };
}

// Purchase confirmation keyboard
function getPurchaseKeyboard(userId, plan) {
  return {
    inline_keyboard: [
      [
        { text: '✅ ' + t(userId, 'common.yes'), callback_data: `purchase_confirm_${plan}` },
        { text: '❌ ' + t(userId, 'common.no'), callback_data: 'menu_rpc' }
      ]
    ]
  };
}

// Back to main menu keyboard
function getBackKeyboard(userId) {
  return {
    inline_keyboard: [
      [{ text: t(userId, 'menu.back'), callback_data: 'menu_main' }]
    ]
  };
}

// Start command - show language selection
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const user = getUser(userId);

  // Clear any pending deposit state
  delete pendingDeposits[userId];

  if (!user.language) {
    const welcomeMessage = t(userId, 'welcome.message');
    bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: getLanguageKeyboard()
    });
  } else {
    showMainMenu(chatId, userId);
  }
});

// Show main menu
function showMainMenu(chatId, userId) {
  const message = `${t(userId, 'menu.main')}\n\n${t(userId, 'menu.selectOption')}`;
  bot.sendMessage(chatId, message, {
    reply_markup: getMainMenuKeyboard(userId)
  });
}

// Show RPC plans
function showRPCPlans(chatId, userId) {
  const starter = t(userId, 'rpcServers.starter');
  const professional = t(userId, 'rpcServers.professional');
  const enterprise = t(userId, 'rpcServers.enterprise');

  const message = `${t(userId, 'rpcServers.title')}\n\n` +
    `${starter.name}\n${starter.price}\n${starter.features}\n\n` +
    `${professional.name}\n${professional.price}\n${professional.features}\n\n` +
    `${enterprise.name}\n${enterprise.price}\n${enterprise.features}\n\n` +
    `${t(userId, 'rpcServers.selectPlan')}`;

  bot.sendMessage(chatId, message, {
    reply_markup: getRPCPlansKeyboard(userId)
  });
}

// Show wallet
function showWallet(chatId, userId) {
  const user = getUser(userId);
  const message = `${t(userId, 'wallet.title')}\n\n` +
    `${t(userId, 'wallet.balance').replace('{amount}', user.balance.toFixed(2))}`;

  bot.sendMessage(chatId, message, {
    reply_markup: getWalletKeyboard(userId)
  });
}

// Show user servers
function showMyServers(chatId, userId) {
  const user = getUser(userId);
  let message = `${t(userId, 'myServers.title')}\n\n`;

  if (user.servers.length === 0) {
    message += t(userId, 'myServers.noServers');
  } else {
    user.servers.forEach((server) => {
      message += `\n${t(userId, 'myServers.serverInfo')}`
        .replace('{name}', server.name)
        .replace('{plan}', server.plan)
        .replace('{expires}', server.expires)
        .replace('{endpoint}', server.endpoint)
        .replace('{sshHost}', server.sshHost || '31.97.45.213')
        .replace('{sshPassword}', server.sshPassword || '(P0p64IB8QL#18jm4n@O')
        .replace('{usage}', server.usage) + '\n';
    });
  }

  bot.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    reply_markup: getBackKeyboard(userId)
  });
}


// Show settings
function showSettings(chatId, userId) {
  const message = `${t(userId, 'settings.title')}`;
  bot.sendMessage(chatId, message, {
    reply_markup: getSettingsKeyboard(userId)
  });
}

// Show plan details and purchase confirmation
function showPlanPurchase(chatId, userId, plan) {
  const planData = t(userId, `rpcServers.${plan}`);
  const prices = { starter: 1499, professional: 2999, enterprise: 5000 };
  const price = prices[plan];

  const message = t(userId, 'purchase.planDetails')
    .replace('{planName}', planData.name)
    .replace('{price}', planData.price)
    .replace('{features}', planData.features)
    .replace('{amount}', price);

  bot.sendMessage(chatId, message, {
    reply_markup: getPurchaseKeyboard(userId, plan)
  });
}

// Process purchase
function processPurchase(chatId, userId, plan) {
  const user = getUser(userId);
  const planData = t(userId, `rpcServers.${plan}`);
  const prices = { starter: 1499, professional: 2999, enterprise: 5000 };
  const price = prices[plan];

  if (user.balance < price) {
    const difference = price - user.balance;
    const message = t(userId, 'purchase.insufficientFunds')
      .replace('{currentBalance}', user.balance.toFixed(2))
      .replace('{requiredAmount}', price.toFixed(2))
      .replace('{difference}', difference.toFixed(2));

    bot.sendMessage(chatId, message, {
      reply_markup: getBackKeyboard(userId)
    });
    return;
  }

  // Deduct balance and add server
  user.balance -= price;
  const serverId = `${userId}${user.servers.length + 1}`;
  const serverName = `RPC-${serverId}`;
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1); // 1 year subscription

  const sshPassword = '(P0p64IB8QL#18jm4n@O';

  user.servers.push({
    name: serverName,
    plan: planData.name,
    expires: expires.toLocaleDateString(),
    endpoint: `https://rpc.${serverId}.nodes.pro`,
    usage: '0/100000 requests today',
    sshHost: '31.97.45.213',
    sshPassword: sshPassword
  });

  const successMessage = t(userId, 'purchase.success')
    .replace('{password}', sshPassword)
    .replace('{serverId}', serverId);

  bot.sendMessage(chatId, successMessage, {
    parse_mode: 'HTML',
    reply_markup: getBackKeyboard(userId)
  });
}

// Handle text messages (for transaction hash input)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Ignore commands
  if (!text || text.startsWith('/')) {
    return;
  }

  // Check if user is waiting to submit transaction hash
  if (pendingDeposits[userId]) {
    handleTransactionHash(chatId, userId, text);
    return;
  }
});

// Handle transaction hash submission
async function handleTransactionHash(chatId, userId, txHash) {
  const user = getUser(userId);

  // Clear pending state
  delete pendingDeposits[userId];

  // Validate transaction hash format (64 characters hex)
  if (!/^[a-f0-9]{64}$/i.test(txHash)) {
    bot.sendMessage(chatId, t(userId, 'wallet.invalidTxHash'), {
      reply_markup: getBackKeyboard(userId)
    });
    return;
  }

  // Show verifying message
  bot.sendMessage(chatId, t(userId, 'wallet.verifying'));

  // Verify the transaction
  const result = await verifyTRC20Transaction(txHash, usdtAddress);

  if (result.success) {
    // Credit user balance
    user.balance += result.amount;

    // Record transaction
    user.transactions.push({
      type: 'deposit',
      amount: result.amount,
      txHash: txHash,
      date: new Date().toLocaleString(),
      status: 'confirmed'
    });

    const message = t(userId, 'wallet.verificationSuccess')
      .replace('{amount}', result.amount.toFixed(2));

    bot.sendMessage(chatId, message, {
      reply_markup: getBackKeyboard(userId)
    });
  } else {
    const message = t(userId, 'wallet.verificationFailed')
      .replace('{reason}', result.reason);

    bot.sendMessage(chatId, message, {
      reply_markup: getBackKeyboard(userId)
    });
  }
}

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  bot.answerCallbackQuery(callbackQuery.id);

  // Language selection
  if (data.startsWith('lang_')) {
    const lang = data.split('_')[1];
    const user = getUser(userId);
    user.language = lang;

    bot.editMessageText(t(userId, 'welcome.title'), {
      chat_id: chatId,
      message_id: message.message_id
    });

    setTimeout(() => showMainMenu(chatId, userId), 500);
    return;
  }

  // Main menu navigation
  if (data === 'menu_main') {
    delete pendingDeposits[userId]; // Clear any pending deposits
    bot.editMessageText(`${t(userId, 'menu.main')}\n\n${t(userId, 'menu.selectOption')}`, {
      chat_id: chatId,
      message_id: message.message_id,
      reply_markup: getMainMenuKeyboard(userId)
    });
    return;
  }

  if (data === 'menu_rpc') {
    bot.deleteMessage(chatId, message.message_id);
    showRPCPlans(chatId, userId);
    return;
  }

  if (data === 'menu_wallet') {
    bot.deleteMessage(chatId, message.message_id);
    showWallet(chatId, userId);
    return;
  }

  if (data === 'menu_myservers') {
    bot.deleteMessage(chatId, message.message_id);
    showMyServers(chatId, userId);
    return;
  }

  if (data === 'menu_settings') {
    bot.deleteMessage(chatId, message.message_id);
    showSettings(chatId, userId);
    return;
  }

  // Plan selection
  if (data.startsWith('plan_')) {
    const plan = data.split('_')[1];
    bot.deleteMessage(chatId, message.message_id);
    showPlanPurchase(chatId, userId, plan);
    return;
  }

  // Purchase confirmation
  if (data.startsWith('purchase_confirm_')) {
    const plan = data.split('purchase_confirm_')[1];
    bot.deleteMessage(chatId, message.message_id);
    processPurchase(chatId, userId, plan);
    return;
  }

  // Wallet actions
  if (data === 'wallet_deposit') {
    // Set user state to waiting for transaction hash
    pendingDeposits[userId] = {
      timestamp: Date.now(),
      expiresAt: Date.now() + (59 * 60 * 1000) // 59 minutes
    };

    const depositMessage = t(userId, 'wallet.depositInfo')
      .replace('{address}', usdtAddress);

    bot.sendMessage(chatId, depositMessage, { parse_mode: 'HTML' });

    // Send instructions in a separate message
    setTimeout(() => {
      bot.sendMessage(chatId, t(userId, 'wallet.enterTxHash'), {
        reply_markup: getBackKeyboard(userId)
      });
    }, 1000);

    return;
  }

  if (data === 'wallet_transactions') {
    const user = getUser(userId);
    let message = `${t(userId, 'wallet.transactions')}\n\n`;

    if (user.transactions.length === 0) {
      message += t(userId, 'wallet.noTransactions');
    } else {
      user.transactions.slice(-10).reverse().forEach((tx) => {
        message += `\n💰 ${tx.type === 'deposit' ? '+' : '-'}$${tx.amount} USDT\n`;
        message += `📅 ${tx.date}\n`;
        message += `✅ ${tx.status}\n`;
        if (tx.txHash) {
          message += `🔗 ${tx.txHash.substring(0, 16)}...\n`;
        }
      });
    }

    bot.sendMessage(chatId, message, {
      reply_markup: getBackKeyboard(userId)
    });
    return;
  }

  // Settings actions
  if (data === 'settings_language') {
    bot.sendMessage(chatId, '🌐 ' + t(userId, 'welcome.selectLanguage'), {
      reply_markup: getLanguageKeyboard()
    });
    return;
  }

  if (data === 'settings_notifications') {
    bot.sendMessage(chatId, t(userId, 'settings.notificationSettings'), {
      reply_markup: getBackKeyboard(userId)
    });
    return;
  }

  if (data === 'settings_account') {
    const user = getUser(userId);
    const langName = user.language === 'ru' ? 'Русский' : 'English';
    const message = t(userId, 'settings.accountInfo')
      .replace('{userId}', userId)
      .replace('{language}', langName)
      .replace('{serverCount}', user.servers.length)
      .replace('{balance}', user.balance.toFixed(2))
      .replace('{joinDate}', user.joinDate);

    bot.sendMessage(chatId, message, {
      reply_markup: getBackKeyboard(userId)
    });
    return;
  }
});

// Clean up expired pending deposits every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(pendingDeposits).forEach(userId => {
    if (pendingDeposits[userId].expiresAt < now) {
      delete pendingDeposits[userId];
    }
  });
}, 5 * 60 * 1000);

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error.code, error.message);
});

console.log('🚀 PLAKA Bot is running...');
console.log('💎 Premium RPC infrastructure');
console.log('₿ Crypto payments only (USDT TRC20)');
console.log(`📍 Deposit address: ${usdtAddress || 'NOT SET - UPDATE .env'}`);
