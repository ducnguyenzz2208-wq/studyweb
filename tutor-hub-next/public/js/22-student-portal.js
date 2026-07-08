    // ============================================================
    // STUDENT PORTAL
    // ============================================================
    function initStudentPortal() {
      var isStudent = currentUser && currentUser.role === 'Student';
      var sel = document.getElementById('studentPortalSelect');
      // Ẩn ô "Select Student" với tài khoản học sinh (tự hiện dữ liệu của mình)
      var bar = sel ? sel.closest('.portal-select-bar') : null;
      if (bar) bar.style.display = isStudent ? 'none' : '';
      if (sel) sel.innerHTML = students.map(function (s) { return '<option value="' + s.id + '">' + escHtml(s.name) + '</option>'; }).join('');
      renderStudentPortal();
    }

    // Trạng thái "đèn giao thông" cho 1 bài tập (đã nộp / quá hạn / sắp hết hạn / chưa nộp).
    // order dùng để sắp xếp: việc khẩn cấp lên trước.
    function _hwStatus(a, done) {
      if (done) return { cls: 'badge-success', dot: '🟢', label: 'Đã nộp', order: 3 };
      var due = a.dueDate ? new Date(a.dueDate + 'T23:59:59') : null;
      if (due && !isNaN(due.getTime())) {
        var diffH = (due.getTime() - Date.now()) / 36e5;
        if (diffH < 0) return { cls: 'badge-danger', dot: '🔴', label: 'Quá hạn', order: 0 };
        if (diffH <= 48) return { cls: 'badge-warning', dot: '🟠', label: 'Sắp hết hạn', order: 1 };
      }
      return { cls: 'badge-info', dot: '⚪', label: 'Chưa nộp', order: 2 };
    }

    function _myStudentRecord() {
      if (currentUser && currentUser.email) {
        var byEmail = students.find(function (s) { return (s.email || '').toLowerCase() === currentUser.email.toLowerCase(); });
        if (byEmail) return byEmail;
      }
      return students[0] || null;
    }

    function renderStudentPortal() {
      var isStudent = currentUser && currentUser.role === 'Student';
      var s;
      if (isStudent) {
        s = _myStudentRecord();
      } else {
        var id = document.getElementById('studentPortalSelect').value;
        s = students.find(function (x) { return String(x.id) === String(id); });
      }
      var myClass = (s && s.class) || (classes[0] ? classes[0].name : '');
      if (!s) {
        s = { name: currentUser ? currentUser.name : '', class: myClass, mathScore: 0, engScore: 0, attendance: 0 };
      }
      var avg2 = avgScore(s);
      var g = getGrade(avg2);

      // ── VIỆC CẦN LÀM (To-do) — đẩy lên trên cùng, sắp theo mức khẩn cấp ──
      var myAssigns = assignments.filter(function (a) { return a.class === myClass; });
      var withStatus = myAssigns.map(function (a) {
        var done = !!submissions.find(function (x) { return x.assignmentId === a.id && x.studentId === _dbUserId; });
        return { a: a, done: done, st: _hwStatus(a, done) };
      });
      // Quá hạn (0) → Sắp hết hạn (1) → Chưa nộp (2) → Đã nộp (3)
      withStatus.sort(function (x, y) { return x.st.order - y.st.order; });
      var pendingCount = withStatus.filter(function (w) { return !w.done; }).length;

      document.getElementById('studentHwCard').innerHTML =
        '<div class="card-header"><div class="card-title">📋 Việc cần làm' +
        (pendingCount ? ' <span class="badge badge-danger" style="margin-left:6px;">' + pendingCount + ' bài</span>' : '') +
        '</div></div>' +
        (withStatus.length ? withStatus.map(function (w) {
          var a = w.a, st = w.st;
          var canSubmit = !w.done && a.status === 'open';
          return '<div class="todo-item">' +
            '<div class="hw-check ' + (w.done ? 'done' : 'pending') + '" aria-hidden="true">' + (w.done ? '✓' : '!') + '</div>' +
            '<div class="todo-main">' +
            '<div class="hw-title">' + escHtml(a.title) + '</div>' +
            '<div class="hw-meta">' + escHtml(a.subject || '') + (a.dueDate ? ' · Hạn ' + escHtml(a.dueDate) : '') + '</div>' +
            '<div style="margin-top:6px;"><span class="badge ' + st.cls + '">' + st.dot + ' ' + st.label + '</span></div>' +
            '</div>' +
            (canSubmit ? '<button class="btn btn-sm btn-primary todo-submit" onclick="quickSubmit(' + qid(a.id) + ')" aria-label="Nộp bài ' + escAttr(a.title) + '">Nộp ngay</button>' : '') +
            '</div>';
        }).join('') : '<div class="empty">🎉 Không có bài tập nào — em rảnh rồi!</div>');

      document.getElementById('studentKPI').innerHTML =
        '<div class="portal-card"><h4>Điểm của em</h4><div class="big-num ' + gradeClass(g) + '">' + g + '</div><div style="color:var(--text-muted);font-size:13px;margin-top:4px">Điểm số: ' + avg2 + '/100</div></div>' +
        '<div class="portal-card"><h4>Chuyên cần</h4><div class="big-num col-green">' + _realAttendPct(s) + '%</div><div style="color:var(--text-muted);font-size:13px;margin-top:4px">Cố lên nhé!</div></div>' +
        '<div class="portal-card"><h4>Lớp học</h4><div style="font-size:22px;font-weight:800;margin-top:8px">' + escHtml(myClass || '—') + '</div><div style="color:var(--text-muted);font-size:13px;margin-top:4px">Đang theo học</div></div>';

      var areas = [];
      if (s.mathScore < 70) areas.push({ label: 'Đại số', color: '#ef4444' });
      if (s.mathScore < 80) areas.push({ label: 'Giải toán', color: '#f59e0b' });
      if (s.engScore < 70) areas.push({ label: 'Đọc hiểu', color: '#ef4444' });
      if (s.engScore < 80) areas.push({ label: 'Kỹ năng viết', color: '#f59e0b' });
      if (s.attendance < 80) areas.push({ label: 'Chuyên cần', color: '#ef4444' });
      if (avg2 >= 90) areas.push({ label: 'Chủ đề nâng cao', color: '#10b981' });
      if (avg2 >= 80) areas.push({ label: 'Luyện đề', color: '#3b82f6' });
      if (areas.length === 0) areas.push({ label: 'Giữ phong độ nhé!', color: '#10b981' });

      document.getElementById('studentFocusCard').innerHTML =
        '<div class="card-header"><div class="card-title">Cần cải thiện</div></div>' +
        '<p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">Dựa trên kết quả hiện tại của em:</p>' +
        '<div>' + areas.map(function (a) { return '<span class="focus-tag" style="background:' + a.color + '22;color:' + a.color + ';border:1px solid ' + a.color + '44">' + a.label + '</span>'; }).join('') + '</div>' +
        '<div style="margin-top:20px;">' +
        '<div style="font-size:13px;font-weight:600;margin-bottom:10px">Bảng điểm</div>' +
        '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>Toán</span><span>' + s.mathScore + '/100</span></div><div class="score-bar" style="height:8px;"><div class="score-fill" style="width:' + s.mathScore + '%;background:#3b82f6"></div></div></div>' +
        '<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>Tiếng Anh</span><span>' + s.engScore + '/100</span></div><div class="score-bar" style="height:8px;"><div class="score-fill" style="width:' + s.engScore + '%;background:#8b5cf6"></div></div></div>' +
        '</div>';

      // Read-only: lịch học + điểm danh + học phí của tôi
      var schEl = document.getElementById('studentScheduleCard');
      if (schEl) schEl.innerHTML = '<div class="card-header"><div class="card-title">📅 Lịch học sắp tới</div></div>' + _upcomingScheduleHtml();
      var attEl = document.getElementById('studentAttendCard');
      if (attEl) attEl.innerHTML = '<div class="card-header"><div class="card-title">✅ Điểm danh của tôi</div></div>' + _attendHistoryHtml(s);
      var payEl = document.getElementById('studentPayCard');
      if (payEl) payEl.innerHTML = isStudent ? _ownPaymentsHtml() : '';
      var comEl = document.getElementById('studentCommentCard');
      if (comEl) comEl.innerHTML = '<div class="card-header"><div class="card-title">💬 Nhận xét từ giáo viên</div></div>' + (s.id ? renderCommentsBlock(s.id) : '<div class="empty">Chưa có nhận xét.</div>');
    }

