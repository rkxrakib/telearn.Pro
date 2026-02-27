// ১. ফায়ারবেস কনফিগারেশন (আপনার দেওয়া ডাটা)
const firebaseConfig = {
    apiKey: "AIzaSyDvtZJhIN850tU7cETuiqRyCyjCBdlFt-Y",
    authDomain: "fynora-81313.firebaseapp.com",
    databaseURL: "https://fynora-81313-default-rtdb.firebaseio.com",
    projectId: "fynora-81313",
    storageBucket: "fynora-81313.firebasestorage.app",
    messagingSenderId: "593306264446",
    appId: "1:593306264446:web:da476d4c77ae4ede6b492f"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// টেলিগ্রাম ওয়েব অ্যাপ ইনিশিয়ালাইজেশন
const tg = window.Telegram.WebApp;
tg.expand(); // অ্যাপ ফুল স্ক্রিন করার জন্য
tg.ready();  // টেলিগ্রামকে জানানো যে অ্যাপ রেডি

const user = tg.initDataUnsafe.user;

// ২. মেইন অ্যাপ ফাংশন
async function startApp() {
    
    // ভিপিএন চেক (এটি দ্রুত করার জন্য try-catch ব্যবহার করা হয়েছে)
    let vpnDetected = false;
    try {
        const res = await fetch('https://ipapi.co/json/').then(r => r.json());
        if (res.country !== 'BD') { vpnDetected = true; } // বাংলাদেশ না হলে ব্লক
    } catch (e) {
        console.log("Security check skipped due to network error");
    }

    if (vpnDetected) {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('vpn-blocked').classList.remove('hidden');
        return;
    }

    // ইউজার চেক: যদি টেলিগ্রাম থেকে ওপেন না করা হয়
    if (!user || !user.id) {
        document.getElementById('loader').innerHTML = "<h1>Please open from Telegram!</h1>";
        return;
    }

    // ডিভাইস এবং অ্যাকাউন্ট চেক (Device Lock)
    const deviceFingerprint = btoa(navigator.userAgent + screen.width);
    const userRef = db.ref('users/' + user.id);

    userRef.once('value', snapshot => {
        const data = snapshot.val();
        
        if (data) {
            // যদি ডিভাইসের ফিঙ্গারপ্রিন্ট না মিলে তবে ব্লক (এক ডিভাইসে এক আইডি)
            if (data.device && data.device !== deviceFingerprint) {
                document.getElementById('loader').classList.add('hidden');
                document.getElementById('device-blocked').classList.remove('hidden');
                return;
            }
            loadUser(data);
        } else {
            // নতুন অ্যাকাউন্ট তৈরি এবং ডাটাবেসে সেভ
            const newUser = {
                id: user.id,
                name: user.first_name || "User",
                balance: 0,
                status: 'inactive',
                device: deviceFingerprint,
                joined: Date.now()
            };
            userRef.set(newUser).then(() => loadUser(newUser));
        }
    });
}

// ৩. ইউজার ডাটা স্ক্রিনে দেখানো
function loadUser(data) {
    // লোডার লুকানো এবং মেইন অ্যাপ দেখানো
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    document.getElementById('u-name').innerText = data.name;
    document.getElementById('u-balance').innerText = "৳ " + parseFloat(data.balance).toFixed(2);
    
    // ইউজার ফটো (যদি থাকে)
    const photoUrl = user.photo_url || "https://ui-avatars.com/api/?name=" + data.name;
    document.getElementById('u-photo').src = photoUrl;
    
    const statusEl = document.getElementById('u-status');
    statusEl.innerText = data.status.toUpperCase();
    if(data.status === 'active') {
        statusEl.style.background = '#2ed573';
        statusEl.style.color = '#fff';
    }
}

// ৪. পেজ রাউটিং (নিচের বাটনগুলো কাজ করার জন্য)
function showPage(pageId) {
    // সব পেজ হাইড করা
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    // নির্দিষ্ট পেজ দেখানো
    document.getElementById(pageId).classList.remove('hidden');
}

// ৫. টাস্ক করার সিকিউরিটি চেক
function startTask() {
    db.ref('users/' + user.id + '/status').once('value', s => {
        if(s.val() !== 'active') {
            alert("আপনার অ্যাকাউন্টটি একটিভ নেই। দয়া করে একটিভ করুন।");
            showPage('support');
        } else {
            alert("টাস্ক শুরু হচ্ছে... (এখানে আপনার টাস্কের কোড দিন)");
        }
    });
}

// অ্যাপ রান করা
startApp();
