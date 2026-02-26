// Firebase Config
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

async function startApp() {
    tg.expand();
    
    // ১. VPN চেক
    const isVpn = await checkVPN();
    if(isVpn) {
        showScreen('vpn-blocked');
        return;
    }

    if (!user) {
        document.body.innerHTML = "<h1>Please open from Telegram</h1>";
        return;
    }

    // ২. ডিভাইস লগইন প্রটেকশন
    const deviceFingerprint = btoa(navigator.userAgent + screen.width);
    const userRef = db.ref('users/' + user.id);

    userRef.once('value', (snapshot) => {
        const userData = snapshot.val();
        
        if (userData) {
            // ডিভাইস চেক (এক ডিভাইসে এক আইডি)
            if (userData.device_id !== deviceFingerprint) {
                showScreen('device-blocked');
                return;
            }
            loadDashboard(userData);
        } else {
            // নতুন ইউজার রেজিস্টার
            const newUser = {
                id: user.id,
                name: user.first_name,
                balance: 0,
                status: 'inactive',
                device_id: deviceFingerprint,
                joined: Date.now()
            };
            userRef.set(newUser);
            loadDashboard(newUser);
        }
    });
}

async function checkVPN() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        // VPN/Hosting চেক
        const proxyKeywords = ["Hosting", "VPN", "Proxy", "Data Center"];
        return proxyKeywords.some(k => (data.org || "").includes(k));
    } catch (e) { return false; }
}

function loadDashboard(data) {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    document.getElementById('u-name').innerText = data.name;
    document.getElementById('u-balance').innerText = "৳ " + data.balance.toFixed(2);
    document.getElementById('u-status').innerText = data.status.toUpperCase();
    
    if(data.status === 'active') {
        document.getElementById('u-status').style.color = '#2ed573';
    }
    
    route('dashboard');
}

// রাউটিং ফাংশন
function route(page) {
    const content = document.getElementById('page-content');
    
    // সিকিউরিটি চেক: একাউন্ট একটিভ না থাকলে টাস্ক ব্লক
    if (page === 'task' || page === 'withdraw') {
        db.ref('users/' + user.id + '/status').once('value', s => {
            if(s.val() !== 'active') {
                content.innerHTML = `
                    <div class="lock-box">
                        <h3>Account Inactive!</h3>
                        <p>এই কাজটি করতে ১০০ টাকা দিয়ে অ্যাকাউন্ট একটিভ করুন।</p>
                        <button onclick="activateAccount()">Activate Now</button>
                    </div>`;
            } else {
                renderPage(page);
            }
        });
    } else {
        renderPage(page);
    }
}

function renderPage(page) {
    const content = document.getElementById('page-content');
    if (page === 'dashboard') {
        content.innerHTML = `<h2>Welcome Home</h2><p>আজকের ইনকাম লক্ষ্য করুন।</p>`;
    } else if (page === 'withdraw') {
        content.innerHTML = `<h2>Withdraw</h2><input type="number" placeholder="Amount"><button>Cashout</button>`;
    }
    // অন্যান্য পেজ এভাবে যোগ করুন...
}

function showScreen(id) {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById(id).classList.remove('hidden');
}

startApp();
