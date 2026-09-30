const loginId = sessionStorage.getItem('ls_login_id') || 'Guest User';

document.addEventListener('DOMContentLoaded', function () {

    const sumAccount = document.getElementById('sum-account');
    if (sumAccount) sumAccount.textContent = loginId;

    const form = document.getElementById('bonus-form');
    const submitBtn = document.getElementById('bf-submit');
    const agreeBox = document.querySelector('.checkbox');
    const successModal = document.getElementById('bonus-success');
    const doneBtn = document.getElementById('bonus-done');
    const successAmount = document.getElementById('success-amount');
    const amountSelector = document.getElementById('amount-selector');
    const paymentSection = document.getElementById('payment-section');

    // Bonus amounts configuration (admin managed)
    const AMOUNTS = [500, 1000, 2000, 4000, 5000, 7000, 10000];
    let selectedAmount = null;

    // UID images from folder
    const uidImages = [
        'uid/image1.jpg',
        'uid/image2.jpg',
        'uid/image3.jpg',
        'uid/image4.jpg',
        'uid/image5.jpg'
    ];
    let selectedUidImage = null;

    // render amount buttons
    function renderAmountButtons() {
        let html = '';
        AMOUNTS.forEach(amount => {
            html += `<button class="amount-btn" data-amount="${amount}">${amount}₹</button>`;
        });
        amountSelector.innerHTML = html;
    }

    renderAmountButtons();

    // Amount button click handler
    amountSelector.addEventListener('click', function (e) {
        if (e.target.classList.contains('amount-btn')) {
            document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedAmount = parseInt(e.target.dataset.amount);
            paymentSection.style.display = 'block';
            submitBtn.innerHTML = `<svg viewBox="0 0 24 24" class="btn-svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 12v10H4V12"/>
                                <path d="M2 7h20v5H2z"/>
                                <path d="M12 22V7"/>
                                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                            </svg>
                            <span class="btn-text">Submit & Claim ₹${selectedAmount}</span>`;
        }
    });

    // ===== UID FIELD VALIDATION =====
    const uidField = document.getElementById('bf-uid');
    const uidFieldWrap = document.getElementById('uid-field-wrap');
    const uidError = uidFieldWrap.querySelector('.field-error');

    function validateUid() {
        const value = uidField.value.trim();
        if (!/^\d+$/.test(value)) {
            uidField.classList.add('invalid');
            uidError.style.display = 'block';
            return false;
        }
        uidField.classList.remove('invalid');
        uidError.style.display = 'none';
        return true;
    }

    uidField.addEventListener('blur', validateUid);
    uidField.addEventListener('input', validateUid);

    // ===== UID POPUP =====
    const uidBtn = document.getElementById('uid-btn');
    const uidPopup = document.getElementById('uid-popup');
    const uidGallery = document.getElementById('uid-gallery');
    const uidCancel = document.getElementById('uid-cancel');
    const uidSelect = document.getElementById('uid-select');

    // Create gallery images
    function renderUidGallery() {
        let html = '';
        uidImages.forEach((imgSrc, index) => {
            html += `<img src="uid/${imgSrc}" alt="UID Image ${index + 1}" data-index="${index}" class="uid-gallery-img">`;
        });
        uidGallery.innerHTML = html;
    }

    renderUidGallery();

    // Image click handler
    uidGallery.addEventListener('click', function (e) {
        const img = e.target.closest('.uid-gallery-img');
        if (!img) return;
        
        // Remove selected class from all images
        document.querySelectorAll('.uid-gallery-img').forEach(i => i.classList.remove('selected'));
        // Add selected class to clicked image
        img.classList.add('selected');
        selectedUidImage = uidImages[img.dataset.index];
    });

    // Open popup when UID button clicked
    uidBtn.addEventListener('click', function (e) {
        e.preventDefault();
        uidPopup.classList.remove('hidden');
        requestAnimationFrame(() => uidPopup.classList.add('show'));
        // Render gallery on open
        renderUidGallery();
    });

    // Close popup when cancel clicked
    uidCancel.addEventListener('click', function () {
        uidPopup.classList.remove('show');
        setTimeout(() => uidPopup.classList.add('hidden'), 300);
    });

    // Close popup when clicking outside
    uidPopup.addEventListener('click', function (e) {
        if (e.target === uidPopup) {
            uidPopup.classList.remove('show');
            setTimeout(() => uidPopup.classList.add('hidden'), 300);
        }
    });

    // Select UID and put it in the field
    uidSelect.addEventListener('click', function () {
        if (!selectedUidImage) {
            alert('Please select a UID image first');
            return;
        }
        // Put the UID image reference in the field (you can customize this)
        // For now, we'll just show a message and close
        uidField.value = selectedUidImage.replace('uid/', '').replace('.jpg', '');
        uidPopup.classList.remove('show');
        setTimeout(() => uidPopup.classList.add('hidden'), 300);
    });

    // ===== FORM SUBMISSION =====
    const validators = {
        full_name: v => v.trim().length >= 3,
        username: v => v.trim().length >= 3,
        mobile: v => /^[0-9]{10}$/.test(v.trim()),
        age: v => Number(v) >= 18 && Number(v) <= 99,
        email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
        bank_id: v => v.trim().length >= 3,
        bonus_amount: v => AMOUNTS.includes(v),
        city: v => v.trim().length >= 2,
        payment_id: v => v.trim().length >= 3,
        uid: v => /^\d+$/.test(v) && v.length >= 3
    };

    function validateField(input) {
        const rule = validators[input.name];
        const field = input.closest('.field');
        if (!rule) return true;
        const ok = rule(input.value);
        field.classList.toggle('invalid', !ok);
        return ok;
    }

    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            const field = input.closest('.field');
            if (field.classList.contains('invalid')) validateField(input);
        });
    });

    agreeBox.querySelector('input').addEventListener('change', function () {
        agreeBox.classList.toggle('invalid', !this.checked);
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        let valid = true;
        form.querySelectorAll('input[required]').forEach(input => {
            if (!validateField(input)) valid = false;
        });

        const agreeInput = agreeBox.querySelector('input');
        agreeBox.classList.toggle('invalid', !agreeInput.checked);
        if (!agreeInput.checked) valid = false;

        if (!selectedAmount) {
            valid = false;
            alert('Please select a bonus amount');
            return;
        }

        if (!valid) {
            const firstBad = form.querySelector('.field.invalid');
            if (firstBad) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const data = Object.fromEntries(new FormData(form).entries());
        data.bonus_amount = selectedAmount;
        data.bonus_type = 'paid';

        const now = new Date().toISOString();

        const record = {
            ...data,
            request_id: 'REQ-' + String(Math.floor(100000 + Math.random() * 899999)),
            account: loginId,
            status: 'Under Review',
            created_at: now,
            updated_at: now
        };

        const requests = JSON.parse(localStorage.getItem('ls_bonus_requests') || '[]');
        requests.unshift(record);
        localStorage.setItem('ls_bonus_requests', JSON.stringify(requests));

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span><span class="btn-text">Submitting...</span>';

        successAmount.textContent = '₹' + selectedAmount;
        successModal.classList.add('show');
        form.reset();
        agreeBox.classList.remove('invalid');
        amountSelector.style.display = 'none';
        paymentSection.style.display = 'none';
        uidField.classList.remove('invalid');
        uidError.style.display = 'none';
        // Reset UI
        renderAmountButtons();
        document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
        selectedAmount = null;
        selectedUidImage = null;
        uidGallery.innerHTML = '';
    });

    doneBtn.addEventListener('click', function () {
        successModal.classList.remove('show');
        window.location.href = '../bonus-status/index.html';
    });

    successModal.addEventListener('click', function (e) {
        if (e.target === successModal) successModal.classList.remove('show');
    });

});