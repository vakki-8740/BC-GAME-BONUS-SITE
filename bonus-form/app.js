const loginId = sessionStorage.getItem('ls_login_id') || 'Guest User';

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
    var PLANS = [
        { id: 1, name: 'Starter',    bonus: 500,   tag: '' },
        { id: 2, name: 'Silver',     bonus: 1000,  tag: 'Popular' },
        { id: 3, name: 'Gold',       bonus: 2000,  tag: '' },
        { id: 4, name: 'Platinum',   bonus: 4000,  tag: 'Best Value' },
        { id: 5, name: 'Diamond',    bonus: 5000,  tag: '' },
        { id: 6, name: 'Ultra',      bonus: 7000,  tag: '' },
        { id: 7, name: 'Legend',     bonus: 10000, tag: '' }
    ];

    var PAY_RATE = 0.3;

    PLANS.forEach(function (p) {
        p.payment = Math.round(p.bonus * PAY_RATE);
        p.discount = Math.round((1 - PAY_RATE) * 100);
    });

    var selectedPlan = null;

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

        amountValue.textContent = selectedPlan.name + ' — Bonus ₹' + selectedPlan.bonus + ' (Pay ₹' + selectedPlan.payment + ')';
        amountValue.classList.add('filled');

        closePlans();
    });

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
        email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
    };

    var errors = {
        full_name: 'Please enter your name',
        uid: 'UID me sirf 9 digit number hona chahiye',
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
            bonus_amount: selectedPlan.bonus,
            payment_amount: selectedPlan.payment,
            discount_amount: selectedPlan.discount,
            account: loginId,
            status: 'Under Review',
            created_at: now,
            updated_at: now
        };

        var requests = JSON.parse(localStorage.getItem('ls_bonus_requests') || '[]');
        requests.unshift(record);
        localStorage.setItem('ls_bonus_requests', JSON.stringify(requests));

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span><span class="btn-text">Submitting...</span>';

        successAmount.textContent = '₹' + selectedPlan.bonus;
        successModal.classList.add('show');

        form.reset();
        agreeBox.classList.remove('invalid');
        selectedPlan = null;
        amountValue.textContent = 'Tap to choose bonus plan';
        amountValue.classList.remove('filled');
    });

    doneBtn.addEventListener('click', function () {
        successModal.classList.remove('show');
        window.location.href = '../bonus-status/index.html';
    });

    successModal.addEventListener('click', function (e) {
        if (e.target === successModal) successModal.classList.remove('show');
    });

});
