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

    const validators = {
        full_name: v => v.trim().length >= 3,
        username: v => v.trim().length >= 3,
        mobile: v => /^[0-9]{10}$/.test(v.trim()),
        age: v => Number(v) >= 18 && Number(v) <= 99,
        email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
        bank_id: v => v.trim().length >= 3,
        bonus_amount: v => Number(v) > 0,
        city: v => v.trim().length >= 2
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

        if (!valid) {
            const firstBad = form.querySelector('.field.invalid');
            if (firstBad) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const data = Object.fromEntries(new FormData(form).entries());
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

        const originalHTML = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span><span class="btn-text">Submitting...</span>';

        successAmount.textContent = '₹' + data.bonus_amount;
        successModal.classList.add('show');
        form.reset();
        agreeBox.classList.remove('invalid');
    });

    doneBtn.addEventListener('click', function () {
        successModal.classList.remove('show');
        window.location.href = '../bonus-status/index.html';
    });

    successModal.addEventListener('click', function (e) {
        if (e.target === successModal) successModal.classList.remove('show');
    });

});