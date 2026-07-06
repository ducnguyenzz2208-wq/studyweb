    // ============================================================
    // ATTENDANCE (bản ghi thật từ attendance_records)
    // ============================================================
    var attendanceRecords = [];

    function loadAttendance() {
      if (!_db) return;
      _db.from('attendance_records').select('*').order('session_date', { ascending: false }).limit(2000)
        .then(function (r) {
          if (r.error) {
            console.warn('load attendance', r.error.message);
            if (typeof _dbError !== 'undefined') _dbError.attendance = _dbErrMsg(r.error);
            if (currentSection === 'attendance') renderAttendance();
            return;
          }
          if (typeof _dbError !== 'undefined') delete _dbError.attendance;
          attendanceRecords = (r.data || []).map(function (a) {
            return { studentRef: String(a.student_ref), studentName: a.student_name || '', className: a.class_name || '', date: a.session_date, status: a.status };
          });
          if (currentSection === 'attendance') renderAttendance();
          if (currentSection === 'dashboard') { try { renderDashboard(); } catch (e) { } }
          try { updateNotifBadge(); } catch (e) { }
        });
    }

    function _findAttend(s, date) {
      return attendanceRecords.find(function (r) {
        return r.date === date && (r.studentRef === String(s.id) || (r.studentName && r.studentName === s.name));
      });
    }

    function _upsertLocalAttend(s, cls, date, status) {
      var ex = _findAttend(s, date);
      if (ex) { ex.status = status; }
      else attendanceRecords.push({ studentRef: String(s.id), studentName: s.name, className: cls, date: date, status: status });
    }

    function _attendSelDate() {
      var dateEl = document.getElementById('attendDateInput');
      if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().split('T')[0];
      return dateEl ? dateEl.value : new Date().toISOString().split('T')[0];
    }

    function renderAttendance() {
      var _atb = document.getElementById('attendanceTableBody');
      if (_atb && typeof _dbError !== 'undefined' && _dbError.attendance && !attendanceRecords.length && !students.length) {
        _atb.innerHTML = '<tr><td colspan="8" class="state-cell">' + errorBlock(_dbError.attendance, 'retryLoad()') + '</td></tr>';
        return;
      }
      var cls = (document.getElementById('attendClassFilter') || {}).value || '';
      var selDate = _attendSelDate();
      var canMark = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Teacher');
      var markColHeader = document.getElementById('attendMarkColHeader');
      if (markColHeader) markColHeader.style.display = canMark ? '' : 'none';

      var list = cls ? students.filter(function (s) { return s.class === cls; }) : students;

      // Nút điểm danh cả lớp + gợi ý
      var allP = document.getElementById('attendAllPresentBtn');
      var allA = document.getElementById('attendAllAbsentBtn');
      var show = canMark && list.length ? '' : 'none';
      if (allP) allP.style.display = show;
      if (allA) allA.style.display = show;
      var hint = document.getElementById('attendSessionHint');
      if (hint) hint.textContent = canMark ? ('Buổi ' + selDate + (cls ? ' · lớp ' + cls : ' · tất cả lớp')) : 'Lịch sử điểm danh';

      // KPI theo ngày đang chọn
      var dayRecs = attendanceRecords.filter(function (r) {
        return r.date === selDate && (!cls || r.className === cls);
      });
      var kp = { present: 0, absent: 0, late: 0 };
      dayRecs.forEach(function (r) { if (kp[r.status] !== undefined) kp[r.status]++; });
      var elP = document.getElementById('attendPresentKpi'); if (elP) elP.textContent = kp.present;
      var elA = document.getElementById('attendAbsentKpi'); if (elA) elA.textContent = kp.absent;
      var elL = document.getElementById('attendLateKpi'); if (elL) elL.textContent = kp.late;
      var elSub = document.getElementById('attendPresentSub');
      if (elSub) elSub.textContent = dayRecs.length ? ('trên ' + list.length + ' học sinh') : 'chưa điểm danh buổi này';

      function _btn(sid, st, cur, label, bg, fg) {
        var active = cur === st;
        return '<button onclick="markAttend(' + qid(sid) + ',\'' + st + '\')" style="background:' + bg + ';color:' + fg + ';border:' + (active ? '2px solid ' + fg : '0') + ';opacity:' + (cur && !active ? '0.45' : '1') + ';border-radius:6px;padding:3px 9px;font-size:12px;cursor:pointer;margin-right:3px;">' + label + '</button>';
      }

      document.getElementById('attendanceTableBody').innerHTML = list.map(function (s, i) {
        var h = getAttendHistory(s);
        var dots = h.arr.map(function (a) { return '<div class="dot dot-' + a + '"></div>'; }).join('');
        // % chuyên cần thật (muộn vẫn tính là đi học); chưa có bản ghi -> dùng số trên hồ sơ
        var pct = h.arr.length ? Math.round(((h.present + h.late) / h.arr.length) * 100) : (s.attendance || 0);
        var todayRec = _findAttend(s, selDate);
        var cur = todayRec ? todayRec.status : null;
        var rowBg = { present: 'rgba(16,185,129,0.07)', late: 'rgba(245,158,11,0.08)', absent: 'rgba(239,68,68,0.07)' }[cur] || '';
        var markCell = canMark ?
          '<td style="white-space:nowrap;">' +
          _btn(s.id, 'present', cur, '✅ Có', '#d1fae5', '#065f46') +
          _btn(s.id, 'late', cur, '🕐 Muộn', '#fef9c3', '#713f12') +
          _btn(s.id, 'absent', cur, '❌ Vắng', '#fee2e2', '#7f1d1d') +
          '</td>' : '';
        return '<tr' + (rowBg ? ' style="background:' + rowBg + ';"' : '') + '>' +
          '<td><div class="student-row">' +
          '<div class="avatar" style="background:' + COLORS[i % 12] + ';width:28px;height:28px;font-size:11px">' + getInitials(s.name) + '</div>' +
          escHtml(s.name) +
          '</div></td>' +
          '<td><span class="badge badge-info">' + escHtml(s.class) + '</span></td>' +
          '<td><strong>' + pct + '%</strong></td>' +
          '<td style="color:var(--success)">' + h.present + '</td>' +
          '<td style="color:var(--danger)">' + h.absent + '</td>' +
          '<td style="color:var(--warning)">' + h.late + '</td>' +
          '<td><div class="attend-dots">' + dots + '</div></td>' +
          markCell +
          '</tr>';
      }).join('') || '<tr><td colspan="8" class="empty">Không có học sinh' + (cls ? ' trong lớp này' : '') + '.</td></tr>';
    }

    function markAttend(studentId, status) {
      var s = students.find(function (x) { return String(x.id) === String(studentId); });
      if (!s) return;
      var selDate = _attendSelDate();
      var cls = (document.getElementById('attendClassFilter') || {}).value || s.class;
      var labels = { present: '✅ Có mặt', late: '🕐 Đi muộn', absent: '❌ Vắng' };
      // Cập nhật local ngay (optimistic) rồi lưu DB
      _upsertLocalAttend(s, cls, selDate, status);
      renderAttendance();
      showToast(escHtml(s.name) + ' (' + selDate + '): ' + (labels[status] || status), 'success');
      if (_db && _dbUserId) {
        _db.from('attendance_records').upsert({
          teacher_id: _dbUserId,
          student_ref: String(s.id),
          student_name: s.name,
          class_name: cls,
          session_date: selDate,
          status: status,
        }, { onConflict: 'teacher_id,student_ref,session_date' })
          .then(function (r) { if (r.error) showToast('Lỗi lưu điểm danh: ' + r.error.message, 'error'); });
      }
    }

    function markAllAttend(status) {
      if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Teacher')) return;
      var cls = (document.getElementById('attendClassFilter') || {}).value || '';
      var selDate = _attendSelDate();
      var list = cls ? students.filter(function (s) { return s.class === cls; }) : students;
      if (!list.length) { showToast('Không có học sinh để điểm danh.', 'error'); return; }
      var labels = { present: 'có mặt', late: 'đi muộn', absent: 'vắng' };
      uiConfirm('Đánh dấu ' + list.length + ' học sinh ' + (labels[status] || status) + ' cho buổi ' + selDate + '?', function () {
        list.forEach(function (s) { _upsertLocalAttend(s, cls || s.class, selDate, status); });
        renderAttendance();
        if (_db && _dbUserId) {
          var rows = list.map(function (s) {
            return {
              teacher_id: _dbUserId, student_ref: String(s.id), student_name: s.name,
              class_name: cls || s.class, session_date: selDate, status: status,
            };
          });
          _db.from('attendance_records').upsert(rows, { onConflict: 'teacher_id,student_ref,session_date' })
            .then(function (r) {
              if (r.error) { showToast('Lỗi lưu điểm danh cả lớp: ' + r.error.message, 'error'); return; }
              showToast('Đã điểm danh ' + list.length + ' học sinh.', 'success');
            });
        }
      }, { danger: false, okText: 'Điểm danh' });
    }

