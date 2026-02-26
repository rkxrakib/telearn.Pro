// ১. ফায়ারবেস কনফিগারেশন
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
const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;

// ২. মেইন ফাংশন
async function startApp() {
    tg.expand();
    
    // ভিপিএন চেক
    const vpn = await checkVPN();
    if (vpn) {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('vpn-blocked').classList.remove('hidden');
        return;
    }

    if (!user) {
        document.body.innerHTML = "<h3>Please Open from Telegram!</h3>";
        return;
    }

    // ডিভাইস এবং অ্যাকাউন্ট চেক (Device Lock)
    const deviceFingerprint = btoa(navigator.userAgent + screen.width);
    const userRef = db.ref('users/' + user.id);

    userRef.once('value', snapshot => {
        const data = snapshot.val();
        if (data) {
            // যদি ডিভাইসের ফিঙ্গারপ্রিন্ট না মিলে তবে ব্লক
            if (data.device !== deviceFingerprint) {
                document.getElementById('loader').classList.add('hidden');
                document.getElementById('device-blocked').classList.remove('hidden');
                return;
            }
            loadUser(data);
        } else {
            // নতুন অ্যাকাউন্ট তৈরি
            const newUser = {
                id: user.id,
                name: user.first_name,
                balance: 0,
                status: 'inactive',
                device: deviceFingerprint
            };
            userRef.set(newUser);
            loadUser(newUser);
        }
    });
}

// ৩. ইউজার ডাটা লোড করা
function loadUser(data) {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    document.getElementById('u-name').innerText = data.name;
    document.getElementById('u-balance').innerText = "৳ " + data.balance.toFixed(2);
    document.getElementById('u-photo').src = user.photo_url || "https://ui-avatars.com/api/?name=" + data.name;
    
    const statusEl = document.getElementById('u-status');
    statusEl.innerText = data.status.toUpperCase();
    if(data.status === 'active') statusEl.style.color = 'green';
}

// ৪. পেজ রাউটিং ফাংশন
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}

// ৫. টাস্ক করার আগে অ্যাকাউন্ট চেক
function startTask() {
    db.ref('users/' + user.id + '/status').once('value', s => {
        if(s.val() !== 'active') {
            alert("আপনার অ্যাকাউন্টটি একটিভ নেই। কাজ করতে ১০০ টাকা দিয়ে একটিভ করুন।");
            showPage('support');
        } else {
            alert("টাস্ক শুরু হচ্ছে...");
            // এখানে টাস্ক কমপ্লিট হওয়ার লজিক দিন
        }
    });
}

// ভিপিএন চেক করার সিম্পল ফাংশন
async function checkVPN() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        return data.country !== 'BD'; // বাংলাদেশ না হলে ট্রু (ব্লক)
    } catch (e) { return false; }
}

startApp();
