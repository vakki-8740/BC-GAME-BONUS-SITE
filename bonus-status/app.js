document.addEventListener('DOMContentLoaded', function () {

    var STORE_KEY = 'ls_bonus_requests';
    var RUPEE = '₹';
    var DASH = '—';
    var DOT = '·';

    var FIELDS = [
        { key: 'full_name', label: 'Full Name' },
        { key: 'uid', label: 'Game UID' },
        { key: 'email', label: 'Email ID' },
        { key: 'plan_name', label: 'Plan' },
        { key: 'plan_type', label: 'Plan Type', upper: true },
        { key: 'bonus_amount', label: 'Bonus Amount', prefix: RUPEE },
        { key: 'payment_amount', label: 'Payment Amount', prefix: RUPEE },
        { key: 'discount_amount', label: 'Discount', suffix: '%' },
        { key: 'utr', label: 'UTR Number' },
        { key: 'has_screenshot', label: 'Screenshot', bool: true }
    ];

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function fmtCell(raw, f) {
        if (raw === undefined || raw === null || raw === '') return DASH;
        if (f.bool) return raw ? 'Uploaded' : 'Not uploaded';
        var s = String(raw);
        if (f.upper) s = s.toUpperCase();
        return (f.prefix || '') + s + (f.suffix || '');
    }

    function formatFull(d) {
        return d.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    }

    function formatTime(d) {
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    var requests = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    var latest = requests[0];

    if (!latest) {
        document.getElementById('empty-state').hidden = false;
        return;
    }

    document.getElementById('status-content').hidden = false;

    var submitted = new Date(latest.created_at);
    var updated = new Date(latest.updated_at || latest.created_at);

    setText('status-id', latest.request_id);
    setText('status-datetime', formatFull(submitted) + ' ' + DOT + ' ' + formatTime(submitted));
    setText('status-value', latest.status);
    setText('status-updated', 'Last updated ' + formatFull(updated));
    setText('detail-amount', RUPEE + latest.bonus_amount);
    setText('amount-status', latest.status);

    setText('meta-date', submitted.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
    setText('meta-time', formatTime(submitted));
    setText('meta-updated', formatFull(updated));
    setText('meta-account', latest.account || DASH);

    var grid = document.getElementById('detail-grid');
    FIELDS.forEach(function (f) {
        var cell = document.createElement('div');
        cell.className = 'detail-cell';

        var label = document.createElement('span');
        label.className = 'cell-label';
        label.textContent = f.label;

        var value = document.createElement('span');
        value.className = 'cell-value';
        value.textContent = fmtCell(latest[f.key], f);

        cell.appendChild(label);
        cell.appendChild(value);
        grid.appendChild(cell);
    });

    if (latest.note) {
        document.getElementById('note-block').hidden = false;
        setText('detail-note', latest.note);
    }

    var STAGE = {
        'Under Review': 1,
        'Approved': 2,
        'Credited': 3
    };
    var stage = STAGE[latest.status] || 1;
    var steps = document.querySelectorAll('.step');

    for (var i = 0; i < stage; i++) {
        steps[i].classList.add('done');
        steps[i].classList.remove('active');
    }
    if (stage < 3) {
        steps[stage].classList.remove('done');
        steps[stage].classList.add('active');
    }
    if (stage >= 1) document.getElementById('line-approve').classList.add('done');
    if (stage >= 2) document.getElementById('line-credit').classList.add('done');

    if (stage >= 2) {
        var badge = document.querySelector('.status-badge');
        var amountStatus = document.getElementById('amount-status');
        badge.style.background = 'rgba(0,230,118,.12)';
        badge.style.borderColor = 'rgba(0,230,118,.3)';
        badge.style.color = '#00E676';
        amountStatus.style.background = 'rgba(0,230,118,.12)';
        amountStatus.style.borderColor = 'rgba(0,230,118,.3)';
        amountStatus.style.color = '#00E676';
    }

});
