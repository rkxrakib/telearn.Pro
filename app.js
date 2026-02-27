/**
 * Tele-Earn Pro | Strategic Infrastructure Engine
 * Developer Version: 2.0.1
 * Security Protocol: High-Frequency Infrastructure
 */

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDvtZJhIN850tU7cETuiqRyCyjCBdlFt-Y",
    authDomain: "fynora-81313.firebaseapp.com",
    databaseURL: "https://fynora-81313-default-rtdb.firebaseio.com",
    projectId: "fynora-81313",
    storageBucket: "fynora-81313.firebasestorage.app",
    messagingSenderId: "593306264446",
    appId: "1:593306264446:web:da476d4c77ae4ede6b492f"
};

// Initialize Backend
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Telegram WebApp Integration
const telegram = window.Telegram.WebApp;
telegram.expand(); // Full screen deployment
telegram.ready();

// Global User Object (With fallback for browser testing)
const webAppUser = telegram.initDataUnsafe.user || {
    id: 12345678,
    first_name: "Developer",
    photo_url: "https://i.ibb.co/vz6mD79/user.png"
};

/**
 * APPLICATION CORE LOGIC
 */
async function initializeTeleEarn() {
    console.log("Strategic Execution Started...");

    // ১. প্রবেশ করান (লোডারকে তৎক্ষণাৎ হাইড করুন)
    document.getElementById('loader').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');

    // ২. সিকিউরিটি চেক (ব্যাকগ্রাউন্ডে চলবে, ডিরেক্ট অ্যাপ বন্ধ করবে না)
    validateSecurityProtocols();

    // ৩. ইউজারের ডাটাবেস ডাটা লোড করা
    const userRef = database.ref('users/' + webAppUser.id);
    
    userRef.on('value', async (snapshot) => {
        const userData = snapshot.val();
        
        if (userData) {
            // যদি ইউজার অলরেডি থাকে, তার ডাটা সিঙ্ক করুন
            syncUserInterface(userData);
            
            // ডিভাইস ডিটেকশন প্রোটোকল
            const currentDevice = btoa(navigator.userAgent + screen.width);
            if (userData.device_hash && userData.device_hash !== currentDevice) {
                // শুধু যদি ডিভাইসের অমিল হয় তবেই ব্লক স্ক্রিন দেখাবে
                triggerBlockingScreen('device-blocked');
            }
        } else {
            // নতুন ইউজার রেজিস্টার করা
            createNewUserNode(webAppUser.id, webAppUser.first_name);
        }
    });
}

/**
 * ডাটাবেসে নতুন ইউজার তৈরি
 */
function createNewUserNode(uid, name) {
    const fingerprint = btoa(navigator.userAgent + screen.width);
    const initialSchema = {
        id: uid,
        name: name,
        balance: 0,
        referrals: 0,
        status: 'inactive',
        device_hash: fingerprint,
        created_at: Date.now(),
        payouts: 0
    };
    
    database.ref('users/' + uid).set(initialSchema);
}

/**
 * ইউজার ইন্টারফেস সিঙ্কিং
 */
function syncUserInterface(data) {
    // ড্যাশবোর্ড আপডেট
    document.getElementById('u-name').innerText = data.name;
    document.getElementById('u-balance').innerText = "৳ " + parseFloat(data.balance).toFixed(2);
    document.getElementById('u-status').innerText = data.status.toUpperCase();
    document.getElementById('u-photo').src = webAppUser.photo_url || 'https://i.ibb.co/vz6mD79/user.png';

    // স্ট্যাটাস কালার চেঞ্জ
    const statusBadge = document.getElementById('u-status');
    if (data.status === 'active') {
        statusBadge.classList.add('active-now');
        statusBadge.style.backgroundColor = "#2ed573";
    } else {
        statusBadge.style.backgroundColor = "#ff4757";
    }

    // স্যালারি প্রোগ্রেস বার আপডেট
    const refTarget = 20;
    const currentRef = data.referrals || 0;
    const percentage = (currentRef / refTarget) * 100;
    const fillBar = document.querySelector('.fill');
    if (fillBar) fillBar.style.width = Math.min(percentage, 100) + "%";
}

/**
 * পেজ রাউটিং সিস্টেম
 */
function showPage(pageId, element = null) {
    // সব পেজ হাইড
    const allPages = document.querySelectorAll('.page-view');
    allPages.forEach(p => p.classList.remove('active'));
    allPages.forEach(p => p.classList.add('hidden'));

    // টার্গেট পেজ শো
    const targetPage = document.getElementById(pageId);
    targetPage.classList.remove('hidden');
    targetPage.classList.add('active');

    // নেভিগেশন হাইলাইট
    if (element) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        element.classList.add('active');
    }
}

/**
 * টাস্ক হ্যান্ডলিং
 */
async function handleTask(taskType) {
    const snapshot = await database.ref('users/' + webAppUser.id + '/status').once('value');
    const status = snapshot.val();

    if (status !== 'active') {
        alert("আপনার অ্যাকাউন্টটি একটিভ নেই। টাস্ক শুরু করতে অ্যাকাউন্ট একটিভ করুন।");
        showPage('support');
    } else {
        alert(taskType + " টাস্ক শুরু হচ্ছে... দয়া করে অপেক্ষা করুন।");
        // এখানে টাস্ক কমপ্লিশন লজিক থাকবে
    }
}

/**
 * সিকিউরিটি ভ্যালিডেশন (VPN/IP)
 */
async function validateSecurityProtocols() {
    try {
        const securityCheck = await fetch('https://ipapi.co/json/').then(r => r.json());
        
        // যদি বাংলাদেশ না হয় (VPN ব্যবহার করলে এটি অন্য দেশ দেখাবে)
        if (securityCheck.country !== 'BD') {
            triggerBlockingScreen('vpn-blocked');
        }
    } catch (error) {
        console.warn("Security Gateway Timeout. Proceeding with caution.");
    }
}

/**
 * ব্লক স্ক্রিন ট্রিগার
 */
function triggerBlockingScreen(id) {
    document.getElementById('app').style.display = 'none';
    const err = document.getElementById(id);
    err.classList.remove('hidden');
    err.style.display = 'flex';
}

/**
 * উইথড্র প্রসেস (ডেমো)
 */
function processWithdrawal() {
    const amount = document.getElementById('w-amount').value;
    if (amount < 55) {
        alert("সর্বনিম্ন উত্তোলন ৳৫৫");
    } else {
        alert("অনুরোধ গ্রহণ করা হয়েছে। ২৪ ঘণ্টার মধ্যে পেমেন্ট পাবেন।");
    }
}

// অ্যাপ স্টার্ট করুন
window.onload = initializeTeleEarn;
