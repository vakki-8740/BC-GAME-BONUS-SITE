const loginId = sessionStorage.getItem('ls_login_id') || 'Guest User';

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

// Admin panel se saved plans load karo
function loadPlansFromAdmin(fallback) {
    return loadFirebase().then(function () {
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        return firebase.firestore().collection('config').doc('bonus_plans').get();
    }).then(function (d) {
        if (d.exists) return d.data();
        return { plans: fallback, pay_rate: 30, qr_image: '' };
    }).catch(function () {
        return { plans: fallback, pay_rate: 30, qr_image: '' };
    });
}

document.addEventListener('DOMContentLoaded', function () {

    var sumAccount = document.getElementById('sum-account');
    if (sumAccount) sumAccount.textContent = loginId;

    var form = document.getElementById('bonus-form');
    var submitBtn = document.getElementById('bf-submit');
    var agreeBox = document.querySelector('.checkbox');
    var successModal = document.getElementById('bonus-success');
    var doneBtn = document.getElementById('bonus-done');
    var successAmount = document.getElementById('success-amount');

    // ============ ADMIN MANAGED PLANS ============
    // payment = 30% of bonus value, so user pays 30% and gets full bonus
    var DEFAULT_PLANS = [
        { id: 1, name: 'Starter',    bonus: 500,   tag: '', type: 'free' },
        { id: 2, name: 'Silver',     bonus: 1000,  tag: 'Popular',    type: 'free' },
        { id: 3, name: 'Gold',       bonus: 2000,  tag: '',           type: 'paid' },
        { id: 4, name: 'Platinum',   bonus: 4000,  tag: 'Best Value', type: 'paid' },
        { id: 5, name: 'Diamond',    bonus: 5000,  tag: '',           type: 'paid' },
        { id: 6, name: 'Ultra',      bonus: 7000,  tag: '',           type: 'paid' },
        { id: 7, name: 'Legend',     bonus: 10000, tag: '',           type: 'paid' }
    ];

    var PLANS = DEFAULT_PLANS.slice();

    var PAY_RATE = 0.3;

    function computePlans(plans, rate) {
        plans.forEach(function (p) {
            p.payment = Math.round(Number(p.bonus) * rate);
            p.discount = Math.round((1 - rate) * 100);
        });
    }

    computePlans(PLANS, PAY_RATE);

    var selectedPlan = null;
    var qrImage = '';

    // Purane config docs me naye fields na ho to default se merge karo
    function normalizePlans(remote) {
        var base = {};
        DEFAULT_PLANS.forEach(function (p) { base[p.id] = p; });

        return remote.map(function (p) {
            var d = base[p.id] || {};
            return {
                id: p.id,
                name: p.name || d.name || 'Plan',
                bonus: Number(p.bonus || d.bonus || 0),
                tag: p.tag !== undefined ? p.tag : (d.tag || ''),
                type: (p.type === 'paid' || p.type === 'free') ? p.type : (d.type || 'free')
            };
        });
    }

    // Admin panel ke saved plans yahan se aate hain
    loadPlansFromAdmin(DEFAULT_PLANS).then(function (cfg) {
        if (Array.isArray(cfg.plans) && cfg.plans.length) {
            PLANS = normalizePlans(cfg.plans);
        }
        PAY_RATE = (Number(cfg.pay_rate) || 30) / 100;
        qrImage = cfg.qr_image || '';
        computePlans(PLANS, PAY_RATE);
    });

    // ============ PLANS POPUP ============
    var plansPopup = document.getElementById('plans-popup');
    var plansList = document.getElementById('plans-list');
    var plansClose = document.getElementById('plans-close');
    var amountTrigger = document.getElementById('amount-trigger');
    var amountValue = document.getElementById('amount-value');

    var GIFT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
        + '<path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/>'
        + '<path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>'
        + '<path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>';

    var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">'
        + '<path d="M20 6 9 17l-5-5"/></svg>';

    function renderPlans() {
        var html = '';

        PLANS.forEach(function (p, i) {
            var tagHtml = p.tag ? '<span class="plan-tag">' + p.tag + '</span>' : '';
            var isSel = selectedPlan && selectedPlan.id === p.id ? ' selected' : '';

            html += '<button type="button" class="plan-card' + isSel + '" data-id="' + p.id + '">'
                + '<span class="plan-gift">' + GIFT_SVG + '</span>'
                + '<span class="plan-mid">'
                + '<span class="plan-name">' + p.name + tagHtml + '</span>'
                + '<span class="plan-amounts">'
                + '<span class="plan-bonus">₹' + p.bonus + '</span>'
                + '<span class="plan-pay">Pay ₹' + p.payment + '</span>'
                + '</span>'
                + '</span>'
                + '<span class="plan-right">'
                + '<span class="plan-discount">' + p.discount + '%</span>'
                + '<span class="plan-save">off</span>'
                + '</span>'
                + '<span class="plan-check">' + CHECK_SVG + '</span>'
                + '</button>';
        });

        plansList.innerHTML = html;

        // stagger entrance
        Array.prototype.forEach.call(plansList.children, function (card, i) {
            card.style.transitionDelay = (i * 0.04) + 's';
        });

        requestAnimationFrame(function () {
            Array.prototype.forEach.call(plansList.children, function (card) {
                card.classList.add('in');
            });
        });
    }

    function openPlans() {
        renderPlans();
        plansPopup.classList.remove('hidden');
        requestAnimationFrame(function () { plansPopup.classList.add('open'); });
    }

    function closePlans() {
        plansPopup.classList.remove('open');
        setTimeout(function () { plansPopup.classList.add('hidden'); }, 280);
    }

    amountTrigger.addEventListener('click', openPlans);
    plansClose.addEventListener('click', closePlans);

    plansPopup.addEventListener('click', function (e) {
        if (e.target === plansPopup) closePlans();
    });

    plansList.addEventListener('click', function (e) {
        var card = e.target.closest('.plan-card');
        if (!card) return;

        var id = Number(card.dataset.id);
        selectedPlan = PLANS.filter(function (p) { return p.id === id; })[0];
        if (!selectedPlan) return;

        Array.prototype.forEach.call(plansList.querySelectorAll('.plan-card'), function (c) {
            c.classList.remove('selected');
        });
        card.classList.add('selected');

        var isPaid = selectedPlan.type === 'paid';
        var tag = isPaid ? 'Paid' : 'Free';

        amountValue.textContent = selectedPlan.name + ' — Bonus ₹' + selectedPlan.bonus
            + ' (' + tag + ', Pay ₹' + selectedPlan.payment + ')';
        amountValue.classList.add('filled');

        togglePayBlock(isPaid);
        closePlans();
    });

    // ===== PAID: QR + UTR + SCREENSHOT =====
    var payBlock = document.getElementById('pay-block');
    var qrImageEl = document.getElementById('qr-image');
    var qrAmount = document.getElementById('qr-amount');
    var utrInput = document.getElementById('bf-utr');
    var shotInput = document.getElementById('bf-shot');
    var shotPreview = document.getElementById('shot-preview');
    var uploadBox = document.querySelector('.upload');

    function togglePayBlock(show) {
        payBlock.hidden = !show;
        if (!show) resetPayFields();
    }

    function resetPayFields() {
        if (utrInput) { utrInput.value = ''; var f = utrInput.closest('.field'); if (f) f.classList.remove('invalid'); }
        if (shotInput) { shotInput.value = ''; }
        if (shotPreview) { shotPreview.src = ''; shotPreview.classList.remove('show'); }
        if (uploadBox) { uploadBox.classList.remove('has-file', 'invalid'); }
    }

    function paintQr() {
        if (!qrImageEl) return;
        if (qrImage) {
            qrImageEl.src = qrImage;
            qrImageEl.classList.add('show');
            qrImageEl.onerror = function () {
                qrImageEl.classList.remove('show');
                qrImageEl.removeAttribute('src');
            };
        } else {
            qrImageEl.classList.remove('show');
            qrImageEl.removeAttribute('src');
        }
    }

    // UTR: numbers only
    if (utrInput) {
        utrInput.addEventListener('input', function () {
            var cleaned = utrInput.value.replace(/[^0-9]/g, '');
            if (utrInput.value !== cleaned) utrInput.value = cleaned;
            if (utrInput.closest('.field').classList.contains('invalid')) validateField(utrInput);
        });
    }

    // Screenshot preview
    if (shotInput) {
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
    }

    paintQr();

    // ============ UID IMAGE POPUP ============
    var uidBtn = document.getElementById('uid-btn');
    var uidPopup = document.getElementById('uid-popup');
    var uidClose = document.getElementById('uid-close');
    var uidX = document.getElementById('uid-x');
    var uidInput = document.getElementById('bf-uid');

    function openUid() {
        uidPopup.classList.remove('hidden');
        requestAnimationFrame(function () { uidPopup.classList.add('show'); });
    }

    function closeUid() {
        uidPopup.classList.remove('show');
        setTimeout(function () { uidPopup.classList.add('hidden'); }, 300);
    }

    uidBtn.addEventListener('click', openUid);
    uidClose.addEventListener('click', closeUid);
    uidX.addEventListener('click', closeUid);

    uidPopup.addEventListener('click', function (e) {
        if (e.target === uidPopup) closeUid();
    });

    // UID: numbers only, exactly 9 digits
    uidInput.addEventListener('input', function () {
        var cleaned = uidInput.value.replace(/[^0-9]/g, '').slice(0, 9);
        if (uidInput.value !== cleaned) uidInput.value = cleaned;
        if (uidInput.closest('.field').classList.contains('invalid')) validateField(uidInput);
    });

    // ============ VALIDATION ============
    var validators = {
        full_name: function (v) { return v.trim().length >= 3; },
        uid: function (v) { return /^[0-9]{9}$/.test(v); },
        email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
        utr: function (v) { return /^[0-9]+$/.test(v.trim()) && v.trim().length >= 6; }
    };

    var errors = {
        full_name: 'Please enter your name',
        uid: 'UID me sirf 9 digit number hona chahiye',
        email: 'Enter a valid email address',
        utr: 'UTR me sirf number allowed hai'
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

    form.querySelectorAll('input').forEach(function (input) {
        input.addEventListener('blur', function () { validateField(input); });
        input.addEventListener('input', function () {
            var field = input.closest('.field');
            if (field.classList.contains('invalid')) validateField(input);
        });
    });

    agreeBox.querySelector('input').addEventListener('change', function () {
        agreeBox.classList.toggle('invalid', !this.checked);
    });

    // ============ SUBMIT ============
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var valid = true;
        form.querySelectorAll('input[required]').forEach(function (input) {
            if (!validateField(input)) valid = false;
        });

        var agreeInput = agreeBox.querySelector('input');
        agreeBox.classList.toggle('invalid', !agreeInput.checked);
        if (!agreeInput.checked) valid = false;

        if (!selectedPlan) {
            alert('Please select a bonus plan');
            return;
        }

        // Paid plan: UTR + screenshot required
        var isPaid = selectedPlan.type === 'paid';
        var hasShot = !!(shotInput.files && shotInput.files[0]);

        if (isPaid) {
            if (!validateField(utrInput)) valid = false;
            if (!hasShot) {
                uploadBox.classList.add('invalid');
                valid = false;
            }
        }

        if (!valid) {
            var firstBad = form.querySelector('.field.invalid');
            if (firstBad) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        var data = Object.fromEntries(new FormData(form).entries());
        var now = new Date().toISOString();

        var record = {
            full_name: data.full_name,
            uid: data.uid,
            email: data.email,
            plan_id: selectedPlan.id,
            plan_name: selectedPlan.name,
            plan_type: isPaid ? 'paid' : 'free',
            bonus_amount: selectedPlan.bonus,
            payment_amount: selectedPlan.payment,
            discount_amount: selectedPlan.discount,
            utr: isPaid ? data.utr : '',
            has_screenshot: isPaid ? hasShot : false,
            account: loginId,
            status: 'Under Review',
            event: 'bonus',
            type: 'Bonus Claim',
            created_at: now,
            updated_at: now
        };

        var requests = JSON.parse(localStorage.getItem('ls_bonus_requests') || '[]');
        requests.unshift(record);
        localStorage.setItem('ls_bonus_requests', JSON.stringify(requests));

        // Admin panel ke liye Firebase me save
        saveToFirebase(record).catch(function () {});

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span><span class="btn-text">Submitting...</span>';

        successAmount.textContent = '₹' + selectedPlan.bonus;
        successModal.classList.add('show');

        form.reset();
        agreeBox.classList.remove('invalid');
        selectedPlan = null;
        togglePayBlock(false);
        amountValue.textContent = 'Tap to choose bonus plan';
        amountValue.classList.remove('filled');
    });

    function closeSuccess() {
        successModal.classList.remove('show');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" class="btn-svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
            + '<path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/>'
            + '<path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>'
            + '<path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>'
            + '<span class="btn-text">Submit &amp; Claim Bonus</span>';
    }

    doneBtn.addEventListener('click', function () {
        closeSuccess();
        window.location.href = '../bonus-status/index.html';
    });

    successModal.addEventListener('click', function (e) {
        if (e.target === successModal) closeSuccess();
    });

});
