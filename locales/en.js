module.exports = {
  welcome: {
    title: '🌐 Welcome to PLAKA!',
    message: '🇬🇧 Welcome! Please select your preferred language.\n🇷🇺 Добро пожаловать! Пожалуйста, выберите язык.\n\n🚀 <b>PLAKA</b> - Professional RPC infrastructure for blockchain projects\n💎 Enterprise-grade reliability and performance\n₿ Cryptocurrency payments only',
    selectLanguage: 'Select Language'
  },
  menu: {
    main: '🏠 Main Menu',
    selectOption: 'Please select an option:',
    rpcServers: '🖥 RPC Plans',
    myServers: '📊 My Servers',
    wallet: '💰 Wallet',
    settings: '⚙️ Settings',
    back: '⬅️ Back'
  },
  wallet: {
    title: '💰 Your Wallet',
    balance: 'Balance: ${amount} USDT',
    deposit: '💳 Deposit USDT',
    transactions: '📜 Transaction History',
    noTransactions: 'No transactions yet',
    depositInfo: '💳 USDT TRC20 Deposit\n\n⚠️ IMPORTANT: Only send USDT on TRC20 network!\n\n📍 Deposit Address:\n{address}\n\n⏱ Complete your transaction within 59 minutes\n💵 Minimum: $100 USDT\n\n📝 After sending, paste your transaction hash below to verify.',
    depositInstructions: '📝 Deposit Instructions:\n\n1. Copy the USDT TRC20 address above\n2. Send USDT from your wallet (TRC20 network only)\n3. Wait for transaction confirmation\n4. Paste transaction hash to verify\n5. Funds credited automatically after verification\n\n⚠️ Send only USDT TRC20! Other tokens will be lost.',
    verifyTransaction: '🔍 Verify Transaction',
    enterTxHash: '📝 Please send your transaction hash (TxID) to verify the payment.\n\nYou can find it in your wallet after sending USDT.\n\nExample: a1b2c3d4e5f6...',
    verifying: '🔄 Verifying transaction...\n\nPlease wait while we check the blockchain.',
    verificationSuccess: '✅ Payment Verified!\n\nAmount: ${amount} USDT\nStatus: Confirmed\n\nYour balance has been updated. You can now purchase RPC plans!',
    verificationFailed: '❌ Verification Failed\n\nReason: {reason}\n\nPlease check:\n• Transaction hash is correct\n• You sent to the correct address\n• Transaction is confirmed on blockchain\n\nContact support if the issue persists.',
    invalidTxHash: '❌ Invalid transaction hash format.\n\nPlease provide a valid TRC20 transaction hash.'
  },
  rpcServers: {
    title: '🖥 Premium RPC Server Plans',
    selectPlan: 'Select a plan that fits your needs:',
    starter: {
      name: '⚡ Starter Plan',
      price: '$1,499/year',
      features: '• 100K requests/day\n• 5 dedicated endpoints\n• 99.9% uptime SLA\n• WebSocket support\n• Archive node access\n• Elastic scaling\n• DDoS protection\n• SSL/TLS encryption\n• Basic analytics dashboard\n• JSON-RPC 2.0 compliant\n• Batch request support'
    },
    professional: {
      name: '🚀 Professional Plan',
      price: '$2,999/year',
      features: '• 500K requests/day\n• 15 dedicated endpoints\n• 99.95% uptime SLA\n• WebSocket & GraphQL support\n• Full archive node access\n• Elastic auto-scaling\n• Advanced DDoS protection\n• Rate limiting control\n• Custom domain support\n• Load balancing & failover\n• Real-time metrics\n• Atomic transaction batching\n• Debug & trace APIs\n• MEV protection available'
    },
    enterprise: {
      name: '💎 Enterprise Plan',
      price: '$5,000/year',
      features: '• Unlimited requests/day\n• Unlimited endpoints\n• 99.99% uptime SLA\n• WebSocket, GraphQL & gRPC\n• Full archive + pruned nodes\n• Enterprise elastic scaling\n• Multi-region redundancy\n• Custom rate limits\n• White-label infrastructure\n• Advanced load balancing\n• Real-time analytics suite\n• Atomic transaction routing\n• Full debug & trace suite\n• MEV protection + flashbots\n• Priority gas optimization\n• Dedicated infrastructure\n• 24/7 DevOps support'
    },
    buyNow: '🛒 Purchase Plan'
  },
  myServers: {
    title: '📊 My Active Servers',
    noServers: 'You don\'t have any active servers yet.\n\n💡 Choose a plan from "RPC Plans" to get started with premium RPC infrastructure.',
    serverInfo: '━━━━━━━━━━━━━━━━━\n📡 <b>{name}</b>\n\n💳 Plan: {plan}\n📅 Expires: {expires}\n\n🔗 <b>RPC Endpoint:</b>\n<code>{endpoint}</code>\n\n🖥 <b>SSH:</b> <code>ssh root@{sshHost}</code>\n🔑 <b>Pass:</b> <tg-spoiler>{sshPassword}</tg-spoiler> <i>(tap)</i>\n\n📈 Usage: {usage}\n✅ Status: <b>Active</b>'
  },
  support: {
    title: '💬 Support Center',
    message: 'How can we assist you?',
    faq: '❓ Frequently Asked Questions',
    contactSupport: '👤 Contact Support Team',
    documentation: '📚 API Documentation',
    faqContent: '❓ Frequently Asked Questions\n\n1️⃣ How do I deposit funds?\nContact support for your unique crypto wallet address.\n\n2️⃣ Which cryptocurrencies do you accept?\nBTC, ETH, USDT (TRC20/ERC20)\n\n3️⃣ When will my server be activated?\nWithin 1-2 hours after payment confirmation.\n\n4️⃣ What is your uptime guarantee?\nWe guarantee 99.9%-99.99% uptime depending on your plan.\n\n5️⃣ Can I upgrade my plan?\nYes, contact support for seamless plan upgrades.',
    contactInfo: '👤 Support Team\n\n📧 Email: support@rpcservers.com\n💬 Telegram: @rpc_support\n🕐 Response time: Based on your plan tier\n\n⚡ We\'re here to help 24/7!',
    docsInfo: '📚 Documentation & API Guides\n\n🔗 API Documentation:\nhttps://docs.rpcservers.com\n\n📖 Quick Start Guide:\nhttps://docs.rpcservers.com/quickstart\n\n🛠 Integration Examples:\nhttps://docs.rpcservers.com/examples\n\n💡 Best Practices:\nhttps://docs.rpcservers.com/best-practices'
  },
  settings: {
    title: '⚙️ Settings',
    language: '🌐 Change Language',
    notifications: '🔔 Notification Preferences',
    account: '👤 Account Information',
    notificationSettings: '🔔 Notification Preferences\n\n✅ Server status alerts\n✅ Payment confirmations\n✅ Expiration reminders\n✅ Maintenance notifications\n\nNotifications are sent via Telegram.',
    accountInfo: '👤 Account Information\n\nUser ID: {userId}\nLanguage: {language}\nActive Servers: {serverCount}\nWallet Balance: ${balance} USDT\nMember Since: {joinDate}'
  },
  purchase: {
    confirm: '✅ Confirm Purchase',
    success: '🎉 Purchase Successful!\n\n✅ Your RPC server is ready!\n\n📡 <b>Server Credentials</b>\n━━━━━━━━━━━━━━━━━\n\n🖥 <b>SSH Access:</b>\n<code>ssh root@31.97.45.213</code>\n\n🔑 <b>Password:</b> <tg-spoiler>{password}</tg-spoiler>\n<i>👆 Tap to reveal</i>\n\n🔗 <b>RPC Endpoint:</b>\n<code>https://rpc.{serverId}.nodes.pro</code>\n\n━━━━━━━━━━━━━━━━━\n\n💡 Server is active and ready to use!\n📊 View details in "My Servers" section\n\nThank you for choosing our services! 🚀',
    insufficientFunds: '❌ Insufficient Balance\n\nYour current balance: ${currentBalance} USDT\nRequired amount: ${requiredAmount} USDT\nNeeded: ${difference} USDT\n\n💡 Please deposit cryptocurrency to continue.\nClick "Deposit Crypto" in the Wallet section.',
    planDetails: '📋 Plan Details:\n\n{planName}\n💰 Price: {price}\n\n{features}\n\n⚠️ This will deduct ${amount} USDT from your wallet.\n\nProceed with purchase?'
  },
  common: {
    yes: 'Yes, Purchase',
    no: 'No, Cancel',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    backToMain: 'Back to Main Menu'
  }
};
