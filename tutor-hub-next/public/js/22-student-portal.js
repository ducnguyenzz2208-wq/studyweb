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

      document.getElementById('studentKPI').innerHTML =
        '<div class="portal-card"><h4>Your Grade</h4><div class="big-num ' + gradeClass(g) + '">' + g + '</div><div style="color:var(--text-muted);font-size:13px;margin-top:4px">Score: ' + avg2 + '/100</div></div>' +
        '<div class="portal-card"><h4>Attendance</h4><div class="big-num col-green">' + _realAttendPct(s) + '%</div><div style="color:var(--text-muted);font-size:13px;margin-top:4px">Keep it up!</div></div>' +
        '<div class="portal-card"><h4>Class</h4><div style="font-size:22px;font-weight:800;margin-top:8px">' + escHtml(myClass || '—') + '</div><div style="color:var(--text-muted);font-size:13px;margin-top:4px">Current enrollment</div></div>';

      // Bài tập thật của lớp học sinh + trạng thái nộp bài của chính mình
      var myAssigns = assignments.filter(function (a) { return a.class === myClass; });
      document.getElementById('studentHwCard').innerHTML =
        '<div class="card-header"><div class="card-title">Bài tập của tôi</div></div>' +
        (myAssigns.length ? myAssigns.map(function (a) {
          var mySub = submissions.find(function (x) { return x.assignmentId === a.id && x.studentId === _dbUserId; });
          var done = !!mySub;
          return '<div class="hw-item"><div class="hw-check ' + (done ? 'done' : 'pending') + '">' + (done ? '✓' : '!') + '</div><div>' +
            '<div class="hw-title">' + escHtml(a.title) + '</div>' +
            '<div class="hw-meta">' + escHtml(a.subject || '') + ' · Hạn ' + escHtml(a.dueDate || '') + ' · <span class="badge ' + (done ? 'badge-success' : 'badge-warning') + '" style="padding:2px 8px;font-size:10px">' + (done ? 'Đã nộp' : 'Chưa nộp') + '</span></div>' +
            '</div></div>';
        }).join('') : '<div class="empty">Chưa có bài tập.</div>');

      var areas = [];
      if (s.mathScore < 70) areas.push({ label: 'Algebra', color: '#ef4444' });
      if (s.mathScore < 80) areas.push({ label: 'Problem Solving', color: '#f59e0b' });
      if (s.engScore < 70) areas.push({ label: 'Reading Comprehension', color: '#ef4444' });
      if (s.engScore < 80) areas.push({ label: 'Writing Skills', color: '#f59e0b' });
      if (s.attendance < 80) areas.push({ label: 'Attendance', color: '#ef4444' });
      if (avg2 >= 90) areas.push({ label: 'Advanced Topics', color: '#10b981' });
      if (avg2 >= 80) areas.push({ label: 'Practice Tests', color: '#3b82f6' });
      if (areas.length === 0) areas.push({ label: 'Keep Up the Great Work!', color: '#10b981' });

      document.getElementById('studentFocusCard').innerHTML =
        '<div class="card-header"><div class="card-title">Focus Areas</div></div>' +
        '<p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">Based on your current performance:</p>' +
        '<div>' + areas.map(function (a) { return '<span class="focus-tag" style="background:' + a.color + '22;color:' + a.color + ';border:1px solid ' + a.color + '44">' + a.label + '</span>'; }).join('') + '</div>' +
        '<div style="margin-top:20px;">' +
        '<div style="font-size:13px;font-weight:600;margin-bottom:10px">Score Breakdown</div>' +
        '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>Math</span><span>' + s.mathScore + '/100</span></div><div class="score-bar" style="height:8px;"><div class="score-fill" style="width:' + s.mathScore + '%;background:#3b82f6"></div></div></div>' +
        '<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>English</span><span>' + s.engScore + '/100</span></div><div class="score-bar" style="height:8px;"><div class="score-fill" style="width:' + s.engScore + '%;background:#8b5cf6"></div></div></div>' +
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

