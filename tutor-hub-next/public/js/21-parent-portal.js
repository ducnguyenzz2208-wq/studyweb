    // ============================================================
    // PARENT PORTAL
    // ============================================================
    function initParentPortal() {
      var sel = document.getElementById('parentChildSelect');
      sel.innerHTML = students.map(function (s) { return '<option value="' + s.id + '">' + escHtml(s.name) + '</option>'; }).join('');
      renderParentEnroll();
      renderParentPortal();
    }

    // ── PARENT: đăng ký lớp cho con ──────────────────────────────
    function renderParentEnroll() {
      var el = document.getElementById('parentEnrollCard');
      if (!el) return;
      el.innerHTML =
        '<div class="card-header"><div class="card-title">📩 Đăng ký lớp cho con</div>' +
        '<button class="btn btn-sm btn-primary" onclick="openEnrollModal()">+ Gửi yêu cầu</button></div>' +
        '<div id="parentReqList" style="font-size:14px;color:var(--text-muted);">Đang tải yêu cầu...</div>';
      loadMyEnrollRequests();
    }

    function loadMyEnrollRequests() {
      var el = document.getElementById('parentReqList');
      if (!el || !_db || !_dbUserId) { if (el) el.innerHTML = ''; return; }
      _db.from('enrollment_requests').select('*, classes(name)').eq('requester_id', _dbUserId).order('created_at', { ascending: false })
        .then(function (r) {
          if (r.error) { el.innerHTML = 'Lỗi tải: ' + escHtml(r.error.message); return; }
          if (!r.data || !r.data.length) { el.innerHTML = 'Chưa có yêu cầu nào.'; return; }
          var badge = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
          var label = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Bị từ chối' };
          el.innerHTML = r.data.map(function (q) {
            var cn = (q.classes && q.classes.name) ? q.classes.name : '(lớp)';
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">' +
              '<div><div style="font-weight:600;color:var(--text);">🏫 ' + escHtml(cn) + '</div>' +
              '<div style="font-size:12px;">HS: ' + escHtml(q.student_name || q.student_email) + '</div></div>' +
              '<span class="badge ' + (badge[q.status] || '') + '">' + (label[q.status] || q.status) + '</span>' +
              '</div>';
          }).join('');
        });
    }

    function openEnrollModal() {
      if (!_db) { showToast('Chưa kết nối.', 'error'); return; }
      // Lấy danh sách lớp mà phụ huynh có thể đăng ký (RLS cho phép đọc)
      _db.from('classes').select('id, name, subject').order('name').then(function (r) {
        var opts = (r.data || []).map(function (c) {
          return '<option value="' + escAttr(c.id) + '">' + escHtml(c.name) + (c.subject ? ' (' + escHtml(c.subject) + ')' : '') + '</option>';
        }).join('');
        var html = '<div class="modal-header"><h3>Đăng ký lớp cho con</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
          '<div class="modal-body">' +
          '<div class="form-group"><label>Chọn lớp</label><select class="form-select" id="enrClass">' + (opts || '<option value="">(chưa có lớp)</option>') + '</select></div>' +
          '<div class="form-group"><label>Email tài khoản học sinh (con)</label><input class="form-input" id="enrEmail" placeholder="con@email.com"></div>' +
          '<div class="form-group"><label>Tên con (tuỳ chọn)</label><input class="form-input" id="enrName" placeholder="Họ tên học sinh"></div>' +
          '<div class="hint">Yêu cầu sẽ gửi tới giáo viên chủ lớp & admin. Khi được duyệt, tài khoản học sinh tự vào lớp.</div>' +
          '</div><div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
          '<button class="btn btn-primary" onclick="submitEnroll()">Gửi yêu cầu</button></div>';
        openModal(html);
      });
    }

    function submitEnroll() {
      var classId = (document.getElementById('enrClass') || {}).value || '';
      var email = ((document.getElementById('enrEmail') || {}).value || '').trim();
      var name = ((document.getElementById('enrName') || {}).value || '').trim();
      if (!classId) { showToast('Chọn lớp.', 'error'); return; }
      if (!email) { showToast('Nhập email học sinh.', 'error'); return; }
      _db.from('enrollment_requests').insert({
        class_id: classId, requester_id: _dbUserId,
        student_email: email, student_name: name || null, status: 'pending',
      }).then(function (r) {
        if (r.error) { showToast('Lỗi gửi: ' + r.error.message, 'error'); return; }
        closeModal(); showToast('Đã gửi yêu cầu.', 'success'); loadMyEnrollRequests();
      });
    }

    // ── Portal helpers (read-only, dùng chung HV/PH) ─────────────
    function _attendHistoryHtml(s) {
      var byDate = {};
      attendanceRecords.forEach(function (r) {
        if (r.studentRef === String(s.id) || (r.studentName && r.studentName === s.name)) byDate[r.date] = r.status;
      });
      var dates = Object.keys(byDate).sort().reverse().slice(0, 10);
      if (!dates.length) return '<div class="empty">Chưa có dữ liệu điểm danh.</div>';
      var badge = { present: 'badge-success', late: 'badge-warning', absent: 'badge-danger' };
      var label = { present: '✅ Có mặt', late: '🕐 Đi muộn', absent: '❌ Vắng' };
      return dates.map(function (d) {
        var st = byDate[d];
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">' +
          '<span style="font-size:13px;">📅 ' + escHtml(d) + '</span>' +
          '<span class="badge ' + (badge[st] || '') + '">' + (label[st] || st) + '</span>' +
          '</div>';
      }).join('');
    }

    function _upcomingScheduleHtml() {
      var today = new Date().toISOString().split('T')[0];
      var upcoming = scheduleItems.filter(function (i) {
        return i.status !== 'Canceled' && (i.date || '') >= today;
      }).sort(function (a, b) { return ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || '')); }).slice(0, 5);
      if (!upcoming.length) return '<div class="empty">Không có buổi học sắp tới.</div>';
      return upcoming.map(function (i) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);gap:8px;">' +
          '<div style="min-width:0;"><div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(i.class || '') + '</div>' +
          '<div style="font-size:12px;color:var(--text-muted);">📅 ' + escHtml(i.date || '') + ' · 🕐 ' + escHtml(i.time || '') + (i.room ? ' · Phòng ' + escHtml(i.room) : '') + '</div></div>' +
          '<span class="badge badge-info" style="flex-shrink:0;">' + escHtml(i.status || 'Upcoming') + '</span>' +
          '</div>';
      }).join('');
    }

    function _realAttendPct(s) {
      var h = getAttendHistory(s);
      return h.arr.length ? Math.round(((h.present + h.late) / h.arr.length) * 100) : (s.attendance || 0);
    }

    function renderParentPortal() {
      var sel = document.getElementById('parentChildSelect');
      var id = sel ? sel.value : '';
      var s = students.find(function (x) { return String(x.id) === String(id); }) || students[0];
      var kpiEl = document.getElementById('parentKPI');
      if (!s) {
        if (kpiEl) kpiEl.innerHTML = '<div class="portal-card" style="grid-column:1/-1;"><h4>Chưa liên kết hồ sơ học sinh</h4>' +
          '<div style="color:var(--text-muted);font-size:13px;margin-top:6px;">Gửi yêu cầu đăng ký lớp cho con ở trên — sau khi được duyệt, dữ liệu của con sẽ hiện tại đây.</div></div>';
        ['parentScoreCard', 'parentHwCard', 'parentScheduleCard', 'parentPayCard'].forEach(function (i) {
          var el = document.getElementById(i); if (el) el.innerHTML = '';
        });
        return;
      }
      var avg2 = avgScore(s);
      var g = getGrade(avg2);
      var h = getAttendHistory(s);
      var attPct = _realAttendPct(s);
      var bal = payments.filter(function (p) { return p.student === s.name && p.status !== 'Paid'; }).reduce(function (a, p) { return a + p.amount; }, 0);

      kpiEl.innerHTML =
        '<div class="portal-card"><h4>Overall Grade</h4><div class="big-num ' + gradeClass(g) + '">' + g + '</div><div style="color:var(--text-muted);font-size:13px;margin-top:4px">Average: ' + avg2 + '/100</div></div>' +
        '<div class="portal-card"><h4>Attendance Rate</h4><div class="big-num col-green">' + attPct + '%</div><div style="color:var(--text-muted);font-size:13px;margin-top:4px">' + (h.arr.length ? ('từ ' + h.arr.length + ' buổi gần nhất') : 'chưa có dữ liệu') + '</div></div>' +
        '<div class="portal-card"><h4>Học phí còn nợ</h4><div class="big-num" style="color:' + (bal > 0 ? 'var(--danger)' : 'var(--success)') + '">' + _fmtMoney(bal) + '</div><div style="color:var(--text-muted);font-size:13px;margin-top:4px">' + (bal > 0 ? 'Cần thanh toán' : 'Đã đóng đủ!') + '</div></div>';

      document.getElementById('parentScoreCard').innerHTML =
        '<div class="card-header"><div class="card-title">Subject Scores</div></div>' +
        '<div style="padding:8px 0;">' +
        '<div style="margin-bottom:14px;"><div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;"><span>Math</span><strong>' + s.mathScore + '</strong></div><div class="score-bar" style="height:10px;"><div class="score-fill" style="width:' + s.mathScore + '%;background:#3b82f6;"></div></div></div>' +
        '<div><div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;"><span>English</span><strong>' + s.engScore + '</strong></div><div class="score-bar" style="height:10px;"><div class="score-fill" style="width:' + s.engScore + '%;background:#8b5cf6;"></div></div></div>' +
        '</div>';

      document.getElementById('parentHwCard').innerHTML =
        '<div class="card-header"><div class="card-title">✅ Điểm danh gần đây</div></div>' + _attendHistoryHtml(s);

      document.getElementById('parentScheduleCard').innerHTML =
        '<div class="card-header"><div class="card-title">📅 Lịch học sắp tới</div></div>' + _upcomingScheduleHtml();

      var sPay = payments.filter(function (p) { return p.student === s.name; });
      document.getElementById('parentPayCard').innerHTML =
        '<div class="card-header"><div class="card-title">💰 Học phí</div></div>' +
        (sPay.length
          ? '<div style="overflow-x:auto;"><table><thead><tr><th>Số tiền</th><th>Hạn</th><th>Trạng thái</th></tr></thead><tbody>' +
            sPay.map(function (p) {
              var badge = { 'Paid': 'badge-success', 'Pending': 'badge-warning', 'Overdue': 'badge-danger' }[p.status];
              var label = { 'Paid': 'Đã đóng', 'Pending': 'Chưa đóng', 'Overdue': 'Quá hạn' }[p.status] || p.status;
              return '<tr><td><strong>$' + p.amount + '</strong>' + (p.note ? '<div style="font-size:11px;color:var(--text-muted);">' + escHtml(p.note) + '</div>' : '') + '</td><td>' + escHtml(p.due || '—') + '</td><td><span class="badge ' + badge + '">' + label + '</span></td></tr>';
            }).join('') + '</tbody></table></div>'
          : '<div class="empty">Chưa có khoản thu.</div>');

      var comEl = document.getElementById('parentCommentCard');
      if (comEl) comEl.innerHTML = '<div class="card-header"><div class="card-title">💬 Nhận xét từ giáo viên</div></div>' + (s.id ? renderCommentsBlock(s.id) : '<div class="empty">Chưa có nhận xét.</div>');
    }

