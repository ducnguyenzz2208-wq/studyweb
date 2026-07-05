    // ============================================================
    // PAYMENTS
    // ============================================================
    var payTab = 'list'; // 'list' | 'debt'

    function switchPayTab(tab) {
      payTab = tab;
      var tl = document.getElementById('payTabList');
      var td = document.getElementById('payTabDebt');
      if (tl) tl.classList.toggle('active', tab === 'list');
      if (td) td.classList.toggle('active', tab === 'debt');
      renderPayments();
    }

    function renderPayments() {
      var iAmAdmin = currentUser && currentUser.role === 'Admin';
      var addBtn = document.getElementById('payAddBtn');
      if (addBtn) addBtn.style.display = iAmAdmin ? '' : 'none';
      var remindBtn = document.getElementById('payRemindBtn');
      if (remindBtn) remindBtn.style.display = iAmAdmin ? '' : 'none';
      var tabBar = document.getElementById('payTabBar');
      var kpi = document.getElementById('payKpiGrid');
      var fb = document.getElementById('payFilterBar');
      var card = document.getElementById('payTableCard');
      var own = document.getElementById('payOwnView');
      var debt = document.getElementById('payDebtView');

      if (!iAmAdmin) {
        // Người dùng thường: KHÔNG thấy bảng quản lý, chỉ xem khoản của mình
        if (tabBar) tabBar.style.display = 'none';
        if (kpi) kpi.style.display = 'none';
        if (fb) fb.style.display = 'none';
        if (card) card.style.display = 'none';
        if (debt) debt.style.display = 'none';
        if (own) { own.style.display = ''; own.innerHTML = _ownPaymentsHtml(); }
        return;
      }
      if (tabBar) tabBar.style.display = '';
      if (kpi) kpi.style.display = '';
      if (own) own.style.display = 'none';

      // KPI thật từ dữ liệu
      var sum = { Paid: 0, Pending: 0, Overdue: 0 };
      var cnt = { Paid: 0, Pending: 0, Overdue: 0 };
      payments.forEach(function (p) {
        if (sum[p.status] === undefined) return;
        sum[p.status] += p.amount; cnt[p.status]++;
      });
      function _money(v) { return '$' + (Math.round(v * 100) / 100).toLocaleString('en-US'); }
      var e;
      e = document.getElementById('payKpiPaid'); if (e) e.textContent = _money(sum.Paid);
      e = document.getElementById('payKpiPaidSub'); if (e) e.textContent = cnt.Paid + ' khoản';
      e = document.getElementById('payKpiPending'); if (e) e.textContent = _money(sum.Pending);
      e = document.getElementById('payKpiPendingSub'); if (e) e.textContent = cnt.Pending + ' khoản';
      e = document.getElementById('payKpiOverdue'); if (e) e.textContent = _money(sum.Overdue);
      e = document.getElementById('payKpiOverdueSub'); if (e) e.textContent = cnt.Overdue + ' khoản';

      // Tab công nợ
      if (payTab === 'debt') {
        if (fb) fb.style.display = 'none';
        if (card) card.style.display = 'none';
        if (debt) { debt.style.display = ''; debt.innerHTML = _renderDebtView(); }
        return;
      }
      if (fb) fb.style.display = '';
      if (card) card.style.display = '';
      if (debt) debt.style.display = 'none';

      var filter = document.getElementById('paymentFilter').value;
      var list = payments.filter(function (p) { return !filter || p.status === filter; });
      var badge = { 'Paid': 'badge-success', 'Pending': 'badge-warning', 'Overdue': 'badge-danger' };
      var body = document.getElementById('paymentTableBody');
      if (_dbError && _dbError.payments && !payments.length) {
        body.innerHTML = '<tr><td colspan="6" class="state-cell">' + errorBlock(_dbError.payments, 'retryLoad()') + '</td></tr>';
        return;
      }
      if (_dbLoading && !payments.length) { body.innerHTML = skelTableRows(5, 6); return; }
      if (!list.length) { body.innerHTML = '<tr><td colspan="6" class="empty">Chưa có khoản thu.</td></tr>'; return; }
      body.innerHTML = list.map(function (p) {
        var act = '';
        if (p.status !== 'Paid' && /-/.test(String(p.id))) {
          act += '<button class="btn btn-sm btn-ghost" onclick="markPaid(' + qid(p.id) + ')" style="margin-right:6px;">Đã thu</button>';
        }
        // Xuất hóa đơn
        act += '<button class="btn btn-sm btn-ghost" onclick="exportInvoice(' + qid(p.id) + ')" title="Xuất hóa đơn PDF" style="margin-right:6px;">📄 Xuất</button>';
        // Nhắc đóng
        if (p.status !== 'Paid' && iAmAdmin) {
          act += '<button class="btn btn-sm btn-ghost" onclick="sendPaymentReminder(' + qid(p.id) + ')" title="Gửi nhắc đóng học phí">🔔 Nhắc đóng</button>';
        }

        return '<tr>' +
          '<td data-label="Student">' + escHtml(p.student) + (p.note ? '<div style="font-size:11px;color:var(--text-muted);">' + escHtml(p.note) + '</div>' : '') + '</td>' +
          '<td data-label="Amount"><strong>$' + p.amount + '</strong></td>' +
          '<td data-label="Due Date">' + escHtml(p.due) + '</td>' +
          '<td data-label="Paid On">' + (p.paid || '—') + '</td>' +
          '<td data-label="Status"><span class="badge ' + (badge[p.status] || '') + '">' + escHtml(p.status) + '</span></td>' +
          '<td data-label="Actions">' + act + '</td>' +
          '</tr>';
      }).join('');
    }

    // Trang công nợ (admin): gom theo học viên — đã đóng / chưa đóng / quá hạn
    function _renderDebtView() {
      if (!payments.length) {
        return '<div class="card" style="padding:24px;text-align:center;color:var(--text-muted);">Chưa có khoản thu nào. Bấm "+ Tạo khoản thu" để bắt đầu.</div>';
      }
      var byUser = {};
      payments.forEach(function (p) {
        var key = p.userId || p.student;
        if (!byUser[key]) byUser[key] = { name: p.student, paid: 0, pending: 0, overdue: 0, count: 0 };
        var u = byUser[key];
        u.count++;
        if (p.status === 'Paid') u.paid += p.amount;
        else if (p.status === 'Overdue') u.overdue += p.amount;
        else u.pending += p.amount;
      });
      var rows = Object.keys(byUser).map(function (k) {
        var u = byUser[k]; u.debt = u.pending + u.overdue; return u;
      });
      // Quá hạn trước, rồi nợ nhiều trước
      rows.sort(function (a, b) { return (b.overdue - a.overdue) || (b.debt - a.debt); });
      var totDebt = rows.reduce(function (a, u) { return a + u.debt; }, 0);
      var totOver = rows.reduce(function (a, u) { return a + u.overdue; }, 0);
      var owing = rows.filter(function (u) { return u.debt > 0; }).length;
      function _m(v) { return '$' + (Math.round(v * 100) / 100).toLocaleString('en-US'); }

      var summary = '<div class="card" style="padding:16px;margin-bottom:14px;border-left:4px solid ' + (totDebt > 0 ? 'var(--danger)' : 'var(--success)') + ';">' +
        (totDebt > 0
          ? '<strong>' + owing + ' học viên còn nợ — tổng ' + _m(totDebt) + '</strong>' +
            (totOver > 0 ? '<span style="color:var(--danger);font-size:13px;margin-left:8px;">(quá hạn ' + _m(totOver) + ')</span>' : '')
          : '<strong>✅ Không còn công nợ.</strong>') +
        '</div>';

      var table = '<div class="card"><div style="overflow-x:auto;"><table>' +
        '<thead><tr><th>Học viên</th><th>Đã đóng</th><th>Chưa đóng</th><th>Quá hạn</th><th>Tổng nợ</th><th>Trạng thái</th></tr></thead><tbody>' +
        rows.map(function (u) {
          var st = u.overdue > 0
            ? '<span class="badge badge-danger">🚨 Quá hạn</span>'
            : (u.debt > 0 ? '<span class="badge badge-warning">⚠️ Còn nợ</span>' : '<span class="badge badge-success">✅ Đủ</span>');
          return '<tr>' +
            '<td><strong>' + escHtml(u.name) + '</strong><div style="font-size:11px;color:var(--text-muted);">' + u.count + ' khoản</div></td>' +
            '<td style="color:var(--success)">' + _m(u.paid) + '</td>' +
            '<td style="color:var(--warning)">' + _m(u.pending) + '</td>' +
            '<td style="color:var(--danger)">' + _m(u.overdue) + '</td>' +
            '<td><strong>' + _m(u.debt) + '</strong></td>' +
            '<td>' + st + '</td>' +
            '</tr>';
        }).join('') +
        '</tbody></table></div></div>';

      return summary + table;
    }

    function _ownPaymentsHtml() {
      var mine = payments.filter(function (p) { return p.userId && p.userId === _dbUserId; });
      if (!mine.length) {
        return '<div class="card" style="padding:24px;text-align:center;color:var(--text-muted);">Bạn chưa có khoản thu nào. ✅</div>';
      }
      var unpaid = mine.filter(function (p) { return p.status !== 'Paid'; });
      var badge = { 'Paid': 'badge-success', 'Pending': 'badge-warning', 'Overdue': 'badge-danger' };
      var label = { 'Paid': 'Đã thanh toán', 'Pending': 'Chưa thanh toán', 'Overdue': 'Quá hạn' };
      var summary = unpaid.length
        ? '<div class="card" style="padding:16px;margin-bottom:14px;border-left:4px solid var(--danger);"><strong>Bạn còn ' + unpaid.length + ' khoản chưa thanh toán.</strong></div>'
        : '<div class="card" style="padding:16px;margin-bottom:14px;border-left:4px solid var(--success);"><strong>Bạn đã thanh toán đầy đủ. ✅</strong></div>';
      return summary + '<div class="card">' + mine.map(function (p) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">' +
          '<div><div style="font-weight:600;">$' + p.amount + '</div><div style="font-size:12px;color:var(--text-muted);">Hạn: ' + escHtml(p.due || '—') + (p.note ? ' · ' + escHtml(p.note) : '') + '</div></div>' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
          '  <span class="badge ' + (badge[p.status] || '') + '">' + (label[p.status] || p.status) + '</span>' +
          '  <button class="btn btn-sm btn-ghost" onclick="exportInvoice(' + qid(p.id) + ')">📄 In</button>' +
          '</div>' +
          '</div>';
      }).join('') + '</div>';
    }

    function exportInvoice(paymentId) {
      var p = payments.find(function (x) { return x.id === paymentId; });
      if (!p) { showToast('Không tìm thấy khoản thu.', 'error'); return; }

      var printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        showToast('Vui lòng cho phép trình duyệt mở popup để in hóa đơn.', 'error');
        return;
      }

      var invoiceHtml = '<!DOCTYPE html>' +
        '<html>' +
        '<head>' +
        '  <meta charset="UTF-8">' +
        '  <title>Hóa đơn học phí - Tutor Hub</title>' +
        '  <style>' +
        '    body { font-family: "Segoe UI", system-ui, sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; }' +
        '    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }' +
        '    .logo { font-size: 24px; font-weight: 800; color: #3b82f6; }' +
        '    .title { font-size: 28px; font-weight: 700; text-transform: uppercase; color: #1e293b; text-align: right; }' +
        '    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }' +
        '    .details-table th, .details-table td { padding: 12px; border: 1px solid #e2e8f0; text-align: left; }' +
        '    .details-table th { background: #f8fafc; font-weight: 600; }' +
        '    .summary { text-align: right; margin-top: 40px; font-size: 18px; }' +
        '    .summary .amount { font-size: 24px; font-weight: 700; color: #3b82f6; }' +
        '    .footer { text-align: center; margin-top: 80px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }' +
        '    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; }' +
        '    .badge-paid { background: #d1fae5; color: #065f46; }' +
        '    .badge-pending { background: #fef3c7; color: #92400e; }' +
        '    .badge-overdue { background: #fee2e2; color: #991b1b; }' +
        '    @media print { .no-print { display: none; } }' +
        '  </style>' +
        '</head>' +
        '<body>' +
        '  <div class="header">' +
        '    <div class="logo">📚 Tutor Hub</div>' +
        '    <div class="title">Hóa đơn học phí</div>' +
        '    <button class="no-print" onclick="window.print()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">In hóa đơn / Lưu PDF</button>' +
        '  </div>' +
        '  <table class="details-table">' +
        '    <tr>' +
        '      <th>Mã hóa đơn</th>' +
        '      <td>' + p.id + '</td>' +
        '    </tr>' +
        '    <tr>' +
        '      <th>Học sinh</th>' +
        '      <td>' + escHtml(p.student) + '</td>' +
        '    </tr>' +
        '    <tr>' +
        '      <th>Nội dung</th>' +
        '      <td>' + escHtml(p.note || 'Học phí lớp học') + '</td>' +
        '    </tr>' +
        '    <tr>' +
        '      <th>Hạn đóng</th>' +
        '      <td>' + escHtml(p.due || '—') + '</td>' +
        '    </tr>' +
        '    <tr>' +
        '      <th>Ngày thanh toán</th>' +
        '      <td>' + (p.paid || '—') + '</td>' +
        '    </tr>' +
        '    <tr>' +
        '      <th>Trạng thái</th>' +
        '      <td>' +
        '        <span class="badge ' + (p.status === 'Paid' ? 'badge-paid' : (p.status === 'Overdue' ? 'badge-overdue' : 'badge-pending')) + '">' +
        '          ' + (p.status === 'Paid' ? 'Đã thanh toán' : (p.status === 'Overdue' ? 'Quá hạn' : 'Chưa thanh toán')) +
        '        </span>' +
        '      </td>' +
        '    </tr>' +
        '  </table>' +
        '  <div class="summary">' +
        '    Tổng tiền cần đóng: <span class="amount">$' + p.amount + '</span>' +
        '  </div>' +
        '  <div class="footer">' +
        '    <p>Cảm ơn bạn đã đồng hành cùng Tutor Hub!</p>' +
        '    <p>Hóa đơn được xuất tự động từ hệ thống quản lý học tập Tutor Hub.</p>' +
        '  </div>' +
        '  <script>' +
        '    window.onload = function() { setTimeout(function() { window.print(); }, 500); };' +
        '  <\/script>' +
        '</body>' +
        '</html>';

      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
    }

    function sendPaymentReminder(paymentId) {
      var p = payments.find(function (x) { return x.id === paymentId; });
      if (!p) { showToast('Không tìm thấy khoản thu.', 'error'); return; }
      if (!p.userId) { showToast('Khoản thu này không có tài khoản liên kết.', 'error'); return; }
      if (!_db) return;

      var msg = 'Nhắc đóng học phí: Khoản phí $' + p.amount + ' cho "' + (p.note || 'Học phí') + '" của bạn đến hạn đóng vào ngày ' + (p.due || '—') + '. Vui lòng hoàn thành thanh toán.';
      _db.from('notifications').insert({
        user_id: p.userId,
        icon: '💳',
        message: msg,
        is_read: false
      }).then(function (r) {
        if (r.error) {
          showToast('Gửi nhắc nhở thất bại: ' + r.error.message, 'error');
        } else {
          showToast('Đã gửi thông báo nhắc nhở đến học viên/phụ huynh.', 'success');
        }
      });
    }

    function loadPayments() {
      if (!_db) return;
      _db.from('payments').select('*').order('due_date', { ascending: true }).then(function (r) {
        if (r.error) {
          console.warn('load payments', r.error.message);
          _dbError.payments = _dbErrMsg(r.error);
          if (currentSection === 'payments') renderPayments();
          return;
        }
        delete _dbError.payments;
        var today = new Date().toISOString().split('T')[0];
        if (r.data && r.data.length) {
          payments = r.data.map(function (p) {
            var st = p.status || 'Pending';
            // Tự động chuyển "Chưa đóng" thành "Quá hạn" khi trễ hạn nộp
            if (st !== 'Paid' && p.due_date && p.due_date < today) st = 'Overdue';
            return { id: p.id, student: p.student_name || '', amount: Number(p.amount) || 0, due: p.due_date || '', paid: p.paid_date || '', status: st, userId: p.user_id, note: p.note || '' };
          });
        }
        if (currentSection === 'payments') renderPayments();
        if (currentSection === 'dashboard') { try { renderDashboard(); } catch (e) { } }
        try { updateNotifBadge(); } catch (e) { }
      });
    }

    function openPaymentModal() {
      var html = '<div class="modal-header"><h3>Tạo khoản thu</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-group" style="position:relative;"><label>Học sinh / Phụ huynh (gõ tên để tìm)</label>' +
        '<input class="form-input" id="payName" placeholder="Gõ tên tài khoản..." autocomplete="off" oninput="payLookupName()">' +
        '<div id="paySuggest" style="position:absolute;left:0;right:0;top:100%;z-index:5;background:var(--card-bg);border:1px solid var(--border);border-radius:8px;box-shadow:var(--shadow);max-height:220px;overflow-y:auto;"></div></div>' +
        '<div class="form-group"><label>Email tài khoản</label><input class="form-input" id="payEmail" placeholder="tự điền khi chọn tên (hoặc gõ tay)"></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Số tiền ($)</label><input class="form-input" type="number" id="payAmount" value="0"></div>' +
        '<div class="form-group"><label>Hạn đóng</label><input class="form-input" type="date" id="payDue"></div>' +
        '</div>' +
        '<div class="form-group"><label>Trạng thái</label><select class="form-select" id="payStatus"><option value="Pending">Chưa thanh toán</option><option value="Paid">Đã thanh toán</option><option value="Overdue">Quá hạn</option></select></div>' +
        '<div class="form-group"><label>Ghi chú</label><input class="form-input" id="payNote" placeholder="Học phí tháng..."></div>' +
        '</div><div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="savePayment()">Tạo</button></div>';
      openModal(html);
    }

    var _payLookupTimer = null;
    function payLookupName() {
      clearTimeout(_payLookupTimer);
      _payLookupTimer = setTimeout(function () {
        var q = ((document.getElementById('payName') || {}).value || '').trim();
        var box = document.getElementById('paySuggest');
        if (!box) return;
        if (q.length < 1) { box.innerHTML = ''; return; }
        if (!_db) return;
        _db.from('profiles').select('name,email,role').ilike('name', '%' + q + '%').limit(8).then(function (r) {
          if (r.error) { box.innerHTML = '<div style="padding:8px;color:var(--danger);font-size:12px;">' + escHtml(r.error.message) + '</div>'; return; }
          if (!r.data || !r.data.length) { box.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:12px;">Không tìm thấy tài khoản.</div>'; return; }
          box.innerHTML = r.data.map(function (u) {
            return '<div onclick="payPickAccount(' + qid(u.email || '') + ',' + qid(u.name || '') + ')" style="padding:8px 10px;cursor:pointer;border-bottom:1px solid var(--border);font-size:13px;" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">' +
              '<strong>' + escHtml(u.name || '') + '</strong>' + (u.role ? ' <span class="badge badge-info" style="font-size:10px;">' + escHtml(u.role) + '</span>' : '') +
              '<div style="color:var(--text-muted);font-size:12px;">' + escHtml(u.email || '') + '</div></div>';
          }).join('');
        });
      }, 250);
    }

    function payPickAccount(email, name) {
      var e = document.getElementById('payEmail'); if (e) e.value = email;
      var n = document.getElementById('payName'); if (n) n.value = name;
      var box = document.getElementById('paySuggest'); if (box) box.innerHTML = '';
    }

    function savePayment() {
      var email = ((document.getElementById('payEmail') || {}).value || '').trim();
      var amount = Number((document.getElementById('payAmount') || {}).value || 0);
      var due = (document.getElementById('payDue') || {}).value || null;
      var status = (document.getElementById('payStatus') || {}).value || 'Pending';
      var note = ((document.getElementById('payNote') || {}).value || '').trim();
      if (!email) { showToast('Nhập email.', 'error'); return; }
      if (!_db) return;
      _db.rpc('create_payment', { _email: email, _amount: amount, _due: due, _status: status, _note: note }).then(function (r) {
        if (r.error) { showToast('Lỗi: ' + r.error.message, 'error'); return; }
        if (r.data === 'no_user') { showToast('Không tìm thấy tài khoản với email này.', 'error'); return; }
        if (r.data === 'not_admin') { showToast('Chỉ admin được tạo khoản thu.', 'error'); return; }
        try { logAudit('payment_create', 'payment', 'Tạo khoản $' + amount + ' cho ' + email); } catch (e) { }
        closeModal(); showToast('Đã tạo khoản thu.', 'success'); loadPayments();
      });
    }

    function markPaid(payId) {
      if (!_db) return;
      _db.from('payments').update({ status: 'Paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', String(payId)).then(function (r) {
        if (r.error) { showToast('Lỗi: ' + r.error.message, 'error'); return; }
        var p = payments.find(function (x) { return x.id === payId; });
        try { logAudit('payment_paid', 'payment', 'Đã thu $' + (p ? p.amount : '') + ' của ' + (p ? p.student : '')); } catch (e) { }
        showToast('Đã đánh dấu đã thu.', 'success'); loadPayments();
      });
    }

    // Nhắc học phí HÀNG LOẠT (admin) — gọi RPC server (migration 021), có chống
    // spam 6h. Ship "bản an toàn": người dùng bấm chủ động; pg_cron có thể gọi
    // đúng RPC này để tự động hoá sau.
    function remindAllUnpaid() {
      if (!(currentUser && currentUser.role === 'Admin')) { showToast('Chỉ admin gửi được nhắc học phí.', 'error'); return; }
      if (!_db) return;
      uiConfirm('Gửi nhắc nhở tới TẤT CẢ học viên còn khoản chưa thanh toán?', function () {
        showBusy('Đang gửi nhắc học phí…');
        _db.rpc('remind_overdue_payments').then(function (r) {
          hideBusy();
          if (r.error) { showToast('Lỗi: ' + r.error.message, 'error'); return; }
          var n = r.data;
          if (n === -1) { showToast('Bạn không có quyền.', 'error'); return; }
          showToast(n > 0 ? ('Đã gửi ' + n + ' nhắc học phí.') : 'Không có ai cần nhắc (hoặc vừa nhắc gần đây).', n > 0 ? 'success' : 'info');
          try { logAudit('remind_payments', 'payment', 'Gửi ' + n + ' nhắc học phí'); } catch (e) { }
        });
      }, { danger: false, okText: 'Gửi nhắc' });
    }

