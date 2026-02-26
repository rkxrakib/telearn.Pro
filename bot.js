const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// ১. ফায়ারবেস এডমিন সেটআপ (আপনার সার্ভিস একাউন্ট কি লাগবে)
// Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key
const serviceAccount = require("./serviceAccountKey.json"); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fynora-81313-default-rtdb.firebaseio.com"
});

const db = admin.database();

// ২. বট টোকেন দিন
const token = '8786683482:AAGKMomIN7RpTvmGB1UT8PZqd156Qdoqb4g';
const bot = new TelegramBot(token, {polling: true});

// ৩. ওয়েব অ্যাপের লিঙ্ক (যেখানে আপনার index.html হোস্ট করা আছে)
const webAppUrl = "https://telearnpro.vercel.app/"; 

// ৪. /start কমান্ড
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name;

    // ডাটাবেসে ইউজার চেক করা
    const userRef = db.ref('users/' + userId);
    const snapshot = await userRef.once('value');
    let userData = snapshot.val();

    if (!userData) {
        // নতুন ইউজার হলে ডাটাবেসে সেভ করা
        userData = {
            id: userId,
            name: firstName,
            balance: 0,
            status: 'inactive',
            referral_count: 0,
            joined: new Date().toISOString()
        };
        await userRef.set(userData);
    }

    // বটের মেনু বাটন (Keyboard)
    const opts = {
        reply_markup: {
            keyboard: [
                [{ text: "🚀 Open Web App", web_app: { url: webAppUrl } }],
                ['👤 Profile', '💰 Balance'],
                ['📊 Stats', '👥 Refer'],
                ['💳 Withdraw', '📞 Support']
            ],
            resize_keyboard: true
        }
    };

    bot.sendMessage(chatId, `স্বাগতম ${firstName}! \nTele-Earn Pro তে আপনাকে স্বাগতম। নিচের বাটনগুলো ব্যবহার করুন।`, opts);
});

// ৫. বাটন ক্লিক হ্যান্ডেল করা
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    const userRef = db.ref('users/' + userId);
    const snapshot = await userRef.once('value');
    const user = snapshot.val();

    if (!user) return;

    switch (text) {
        case '👤 Profile':
            bot.sendMessage(chatId, `👤 *ইউজার প্রোফাইল*\n\nনাম: ${user.name}\nআইডি: ${user.id}\nঅবস্থা: ${user.status.toUpperCase()}`, {parse_mode: 'Markdown'});
            break;

        case '💰 Balance':
            bot.sendMessage(chatId, `💰 *আপনার ব্যালেন্স*\n\nমোট ইনকাম: ৳ ${user.balance.toFixed(2)}`, {parse_mode: 'Markdown'});
            break;

        case '👥 Refer':
            const refLink = `https://t.me/your_bot_username?start=${userId}`;
            bot.sendMessage(chatId, `👥 *রেফারেল সিস্টেম*\n\nআপনার রেফারেল লিঙ্ক:\n${refLink}\n\nপ্রতিটি সফল রেফারে পাবেন বোনাস!`, {parse_mode: 'Markdown'});
            break;

        case '📊 Stats':
            bot.sendMessage(chatId, `📊 *সার্ভার স্ট্যাটাস*\n\nমোট মেম্বার: ৫,০০০+\nমোট পেমেন্ট: ৳ ২,১২,০০০+`);
            break;

        case '💳 Withdraw':
            bot.sendMessage(chatId, `💳 উইথড্র করার জন্য আমাদের ওয়েব অ্যাপ ওপেন করুন।`, {
                reply_markup: { inline_keyboard: [[{ text: "Open App", web_app: { url: webAppUrl } }]] }
            });
            break;

        case '📞 Support':
            bot.sendMessage(chatId, `যেকোনো প্রয়োজনে যোগাযোগ করুন: @admin_username`);
            break;
    }
});

console.log("বট চালু হয়েছে...");
