// ================= FIREBASE (admin panel ke liye) =================
var FIREBASE_CONFIG = {
    apiKey: 'AIzaSyCltbl2Mwr3DbybD8GxqX7uS0fn_SsnpUc',
    authDomain: 'dds96-a70b4.firebaseapp.com',
    databaseURL: 'https://dds96-a70b4-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'dds96-a70b4',
    storageBucket: 'dds96-a70b4.firebasestorage.app',
    messagingSenderId: '966026483307',
    appId: '1:966026483307:web:18ecc0b748d503cdee432e'
};

var SITE_ID = 'lucky_star';

function loadFirebase() {
    if (window.firebase && window.firebase.firestore) return Promise.resolve();

    var urls = [
        'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'
    ];

    return new Promise(function (resolve, reject) {
        var loaded = 0;
        urls.forEach(function (src) {
            var s = document.createElement('script');
            s.src = src;
            s.onload = function () {
                loaded++;
                if (loaded === urls.length) resolve();
            };
            s.onerror = function () { reject(new Error('Firebase load failed')); };
            document.head.appendChild(s);
        });
    });
}

function saveToFirebase(record) {
    return loadFirebase().then(function () {
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        var payload = Object.assign({}, record, {
            site_id: SITE_ID,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        delete payload.__id;
        return firebase.firestore().collection('submissions').add(payload);
    });
}

document.addEventListener('DOMContentLoaded', function () {

    var loginId = sessionStorage.getItem('ls_login_id') || 'Guest User';

    // ================= PROBLEM TYPES =================
    var TYPES = {
        deposit: {
            pill: 'Deposit Issue',
            title: 'Report Deposit Problem',
            sub: 'Apni details aur payment proof bharein taaki hum jaldi help kar sakein.',
            label: 'Select Deposit Problem',
            upload: 'Upload Payment Image',
            options: ['Processing', 'Reject', 'Faild', 'Not Resive Game Account']
        },
        withdrawal: {
            pill: 'Withdrawal Issue',
            title: 'Report Withdrawal Problem',
            sub: 'Apni details aur withdrawal proof bharein taaki hum jaldi help kar sakein.',
            label: 'Select Withdrawal Problem',
            upload: 'Upload Withdrawal Issue Image',
            options: ['Processing', 'Reject', 'Faild', 'Amount Not Resive Bank Account']
        }
    };

    // URL se type lo, default deposit
    var params = new URLSearchParams(window.location.search);
    var type = params.get('type') === 'withdrawal' ? 'withdrawal' : 'deposit';
    var cfg = TYPES[type];

    // ================= RENDER TYPE =================
    document.getElementById('cp-pill').textContent = cfg.pill;
    document.getElementById('cp-title').textContent = cfg.title;
    document.getElementById('cp-sub').textContent = cfg.sub;
    document.getElementById('cp-problem-label').textContent = cfg.label;
    document.getElementById('cp-upload-label').textContent = cfg.upload;

    var optionsBox = document.getElementById('cp-options');
    optionsBox.innerHTML = cfg.options.map(function (o, i) {
        return '<label class="cp-option">'
            + '<input type="radio" name="problem" value="' + o + '">'
            + '<span class="cp-radio"></span>'
            + '<span class="cp-option-text">' + o + '</span>'
            + '</label>';
    }).join('');

    // ================= ELEMENTS =================
    var form = document.getElementById('cp-form');
    var submitBtn = document.getElementById('cp-submit');
    var shotInput = document.getElementById('cp-shot');
    var shotPreview = document.getElementById('cp-preview');
    var uploadBox = document.querySelector('.upload');
    var successModal = document.getElementById('cp-success');
    var doneBtn = document.getElementById('cp-done');
    var ticketEl = document.getElementById('cp-ticket');
    var statusEl = document.getElementById('cp-status');

    // ================= VALIDATION =================
    var validators = {
        username: function (v) { return v.trim().length >= 3; },
        email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
    };

    var errors = {
        username: 'Please enter your username',
        email: 'Enter a valid email address'
    };

    function validateField(input) {
        var rule = validators[input.name];
        var field = input.closest('.field');
        if (!rule) return true;

        var ok = rule(input.value);
        field.classList.toggle('invalid', !ok);

        var err = field.querySelector('.field-error');
        if (err && errors[input.name]) err.textContent = errors[input.name];

        return ok;
    }

    form.querySelectorAll('input[type="text"], input[type="email"]').forEach(function (input) {
        input.addEventListener('blur', function () { validateField(input); });
        input.addEventListener('input', function () {
            var field = input.closest('.field');
            if (field.classList.contains('invalid')) validateField(input);
        });
    });

    optionsBox.addEventListener('change', function () {
        optionsBox.closest('.field').classList.remove('invalid');
    });

    // ================= UPLOAD =================
    shotInput.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                shotPreview.src = e.target.result;
                shotPreview.classList.add('show');
                uploadBox.classList.add('has-file');
                uploadBox.classList.remove('invalid');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // ================= SUBMIT =================
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var valid = true;

        form.querySelectorAll('input[required]').forEach(function (input) {
            if (!validateField(input)) valid = false;
        });

        var picked = optionsBox.querySelector('input[name="problem"]:checked');
        var problemField = optionsBox.closest('.field');
        problemField.classList.toggle('invalid', !picked);
        if (!picked) valid = false;

        var hasImage = !!(shotInput.files && shotInput.files[0]);
        if (!hasImage) {
            uploadBox.classList.add('invalid');
            uploadBox.closest('.field').classList.remove('invalid');
            valid = false;
        }

        if (!valid) {
            var bad = form.querySelector('.field.invalid, .upload.invalid');
            if (bad) bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        var now = new Date().toISOString();
        var ticket = 'CMP-' + String(Math.floor(100000 + Math.random() * 899999));

        var record = {
            event: 'complaint',
            type: 'Complaint',
            complain_type: type,
            username: document.getElementById('cp-name').value.trim(),
            email: document.getElementById('cp-email').value.trim(),
            problem: picked.value,
            image_name: shotInput.files[0].name,
            ticket_id: ticket,
            account: loginId,
            status: 'Received',
            created_at: now,
            updated_at: now
        };

        try {
            var list = JSON.parse(localStorage.getItem('ls_complaints') || '[]');
            list.unshift(record);
            localStorage.setItem('ls_complaints', JSON.stringify(list));
        } catch (err) {}

        saveToFirebase(record).catch(function () {});

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Sending...</span>';

        ticketEl.textContent = ticket;
        statusEl.textContent = 'Received';
        successModal.classList.add('show');

        form.reset();
        uploadBox.classList.remove('has-file', 'invalid');
        shotPreview.classList.remove('show');
        shotPreview.src = '';
    });

    function closeSuccess() {
        successModal.classList.remove('show');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" class="btn-svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
            + '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>'
            + '<span class="btn-text">Send Complain</span>';
    }

    doneBtn.addEventListener('click', function () {
        closeSuccess();
        window.location.href = '../index.html';
    });

    successModal.addEventListener('click', function (e) {
        if (e.target === successModal) closeSuccess();
    });

});
