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

    // Render amount buttons
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
            // Remove selected class from all buttons
            document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
            // Add selected class to clicked button
            e.target.classList.add('selected');
            selectedAmount = parseInt(e.target.dataset.amount);

            // Show payment section
            paymentSection.style.display = 'block';

            // Update submit button to show selected amount
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

    const validators = {
        full_name: v => v.trim().length >= 3,
        username: v => v.trim().length >= 3,
        mobile: v => /^[0-9]{10}$/.test(v.trim()),
        age: v => Number(v) >= 18 && Number(v) <= 99,
        email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
        bank_id: v => v.trim().length >= 3,
        bonus_amount: v => AMOUNTS.includes(v),
        city: v => v.trim().length >= 2,
        payment_id: v => v.trim().length >= 3
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

        // Also validate amount was selected
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
        data.bonus_type = 'paid'; // since they selected an amount

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
        // Reset submit button text
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" class="btn-svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg><span class="btn-text">Submit & Claim Bonus</span>';
    });

    doneBtn.addEventListener('click', function () {
        successModal.classList.remove('show');
        window.location.href = '../bonus-status/index.html';
    });

    successModal.addEventListener('click', function (e) {
        if (e.target === successModal) successModal.classList.remove('show');
    });

});