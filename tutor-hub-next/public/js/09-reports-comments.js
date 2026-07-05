    // ============================================================
    // REPORTS SECTION
    // ============================================================
    function renderReports() {
      // KPI cards
      var totalStudents = students.length;
      var avgMath = totalStudents ? Math.round(students.reduce(function (s, x) { return s + x.mathScore; }, 0) / totalStudents) : 0;
      var avgEng = totalStudents ? Math.round(students.reduce(function (s, x) { return s + x.engScore; }, 0) / totalStudents) : 0;
      // Chuyên cần THẬT từ attendance_records; fallback số trên hồ sơ nếu chưa điểm danh
      var realAvgAtt = attendanceRecords.length
        ? Math.round(attendanceRecords.filter(function (r) { return r.status !== 'absent'; }).length / attendanceRecords.length * 100)
        : (totalStudents ? Math.round(students.reduce(function (s, x) { return s + x.attendance; }, 0) / totalStudents) : 0);
      var cutoff = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];
      var activeSet = {};
      attendanceRecords.forEach(function (r) { if (r.date >= cutoff && r.status !== 'absent') activeSet[r.studentRef || r.studentName] = 1; });
      var activeCount = Object.keys(activeSet).length;
      var atRiskCount = students.filter(function (s) { return s.mathScore < 70 || s.engScore < 70 || (s.attendance || 0) < 75; }).length;
      var paid = payments.filter(function (p) { return p.status === 'Paid'; }).length;
      var overdueN = payments.filter(function (p) { return p.status === 'Overdue'; }).length;
      var kpiEl = document.getElementById('reportKPIs');
      kpiEl.innerHTML = [
        { num: totalStudents, label: 'Tổng học viên', change: activeCount + ' active (30 ngày)', up: true, color: 'var(--accent)' },
        { num: avgMath + '%', label: 'Điểm TB Toán', change: 'trên ' + totalStudents + ' HV', up: avgMath >= 70, color: 'var(--accent2)' },
        { num: avgEng + '%', label: 'Điểm TB Anh', change: 'trên ' + totalStudents + ' HV', up: avgEng >= 70, color: 'var(--accent3)' },
        { num: realAvgAtt + '%', label: 'Chuyên cần', change: attendanceRecords.length + ' lượt điểm danh', up: realAvgAtt >= 80, color: 'var(--accent4)' },
        { num: atRiskCount, label: 'HV cần chú ý', change: atRiskCount ? 'điểm/chuyên cần thấp' : 'không có 🎉', up: atRiskCount === 0, color: 'var(--danger)' },
        { num: paid + '/' + payments.length, label: 'Khoản đã thu', change: overdueN + ' quá hạn', up: overdueN === 0, color: 'var(--success)' },
      ].map(function (k) {
        return '<div class="report-kpi"><div class="rk-num" style="color:' + k.color + '">' + k.num + '</div><div class="rk-label">' + k.label + '</div><div class="rk-change ' + (k.up ? 'rk-up' : 'rk-down') + '">' + k.change + '</div></div>';
      }).join('');

      // Top students
      var sorted = students.slice().sort(function (a, b) { return ((b.mathScore + b.engScore) / 2) - ((a.mathScore + a.engScore) / 2); });
      var topEl = document.getElementById('topStudentsList');
      topEl.innerHTML = sorted.slice(0, 5).map(function (s, i) {
        var avg = Math.round((s.mathScore + s.engScore) / 2);
        var rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        return '<div class="top-student-row"><div class="ts-rank ' + rankCls + '">' + (i + 1) + '</div><div class="ts-name">' + s.name + '<div style="font-size:11px;color:var(--text-muted);">' + s.class + '</div></div><div class="ts-score">' + avg + '%</div></div>';
      }).join('');

      // At-risk students
      var risky = students.filter(function (s) { return s.mathScore < 70 || s.engScore < 70 || s.attendance < 75; });
      var riskEl = document.getElementById('atRiskList');
      riskEl.innerHTML = risky.length ? risky.map(function (s) {
        var high = s.mathScore < 60 || s.attendance < 65;
        return '<div class="atrisk-row"><div class="atrisk-indicator ' + (high ? 'risk-high' : 'risk-med') + '"></div><div style="flex:1;font-size:13px;"><strong>' + s.name + '</strong><div style="font-size:11px;color:var(--text-muted);">Math:' + s.mathScore + '% · Eng:' + s.engScore + '% · Att:' + s.attendance + '%</div></div></div>';
      }).join('') : '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No at-risk students 🎉</div>';

      // Charts
      var scoreCtx = document.getElementById('reportScoreChart');
      var hwCtx = document.getElementById('reportHwChart');
      if (scoreCtx) {
        if (reportCharts.score) reportCharts.score.destroy();
        reportCharts.score = new Chart(scoreCtx, {
          type: 'bar',
          data: {
            labels: ['<60', '60-69', '70-79', '80-89', '90-100'],
            datasets: [
              {
                label: 'Math', backgroundColor: 'rgba(59,130,246,0.7)', data: [
                  students.filter(function (s) { return s.mathScore < 60; }).length,
                  students.filter(function (s) { return s.mathScore >= 60 && s.mathScore < 70; }).length,
                  students.filter(function (s) { return s.mathScore >= 70 && s.mathScore < 80; }).length,
                  students.filter(function (s) { return s.mathScore >= 80 && s.mathScore < 90; }).length,
                  students.filter(function (s) { return s.mathScore >= 90; }).length,
                ]
              },
              {
                label: 'English', backgroundColor: 'rgba(139,92,246,0.7)', data: [
                  students.filter(function (s) { return s.engScore < 60; }).length,
                  students.filter(function (s) { return s.engScore >= 60 && s.engScore < 70; }).length,
                  students.filter(function (s) { return s.engScore >= 70 && s.engScore < 80; }).length,
                  students.filter(function (s) { return s.engScore >= 80 && s.engScore < 90; }).length,
                  students.filter(function (s) { return s.engScore >= 90; }).length,
                ]
              }
            ]
          },
          options: { responsive: true, plugins: { legend: { labels: { color: '#6b7280', font: { size: 11 } } } }, scales: { x: { ticks: { color: '#6b7280' } }, y: { ticks: { color: '#6b7280' }, beginAtZero: true } } }
        });
      }
      if (hwCtx) {
        if (reportCharts.hw) reportCharts.hw.destroy();
        // Số bài nộp theo bài tập (thật) — thay chart homework demo đã bỏ
        var asgList = assignments.slice(0, 8);
        var hwData = asgList.map(function (a) { return submissions.filter(function (s) { return s.assignmentId === a.id; }).length; });
        var hwLabels = asgList.map(function (a) { return (a.title || '').substring(0, 18); });
        reportCharts.hw = new Chart(hwCtx, {
          type: 'bar',
          data: { labels: hwLabels, datasets: [{ label: 'Số bài nộp', backgroundColor: 'rgba(16,185,129,0.7)', data: hwData }] },
          options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#6b7280' }, beginAtZero: true }, y: { ticks: { color: '#6b7280', font: { size: 10 } } } } }
        });
      }
    }

    // ============================================================
    // NHẬN XÉT HỌC VIÊN (teacher_comments — thật)
    // ============================================================
    var _COMMENT_CAT = { progress: 'Tiến bộ', achievement: 'Thành tích', behavior: 'Thái độ' };

    function getCommentsForStudent(studentId) {
      return teacherComments.filter(function (c) { return String(c.studentId) === String(studentId); });
    }

    function renderCommentsBlock(studentId) {
      var comments = getCommentsForStudent(studentId);
      if (!comments.length) return '<div class="empty" style="padding:12px;font-size:13px;">Chưa có nhận xét nào.</div>';
      return comments.map(function (c) {
        return '<div style="padding:10px 0;border-bottom:1px solid var(--border);">' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:4px;gap:8px;">' +
          '<span>👩‍🏫 ' + escHtml(c.teacher) + ' · ' + escHtml(c.date) + '</span>' +
          '<span class="badge badge-info" style="font-size:10px;">' + (_COMMENT_CAT[c.category] || c.category) + '</span></div>' +
          '<div style="font-size:14px;">' + escHtml(c.text) + '</div></div>';
      }).join('');
    }

    function openStudentComments(studentId) {
      var s = students.find(function (x) { return String(x.id) === String(studentId); });
      var canAdd = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      var html = '<div class="modal-header"><h3>💬 Nhận xét: ' + escHtml(s ? s.name : 'Học viên') + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div id="stuCommentList">' + _commentsListHtml(studentId) + '</div>' +
        (canAdd ?
          '<div style="border-top:1px solid var(--border);margin-top:12px;padding-top:12px;">' +
          '<div class="form-row">' +
          '<div class="form-group"><label>Loại</label><select class="form-select" id="mComCat"><option value="progress">Tiến bộ</option><option value="achievement">Thành tích</option><option value="behavior">Thái độ</option></select></div>' +
          '<div class="form-group" style="display:flex;align-items:flex-end;"><button class="btn btn-primary" style="width:100%;" onclick="saveComment(' + qid(studentId) + ')">+ Thêm nhận xét</button></div>' +
          '</div>' +
          '<div class="form-group"><label>Nội dung</label><textarea class="form-textarea" id="mComText" placeholder="Nhập nhận xét về học viên..."></textarea></div>' +
          '</div>' : '') +
        '</div>';
      openModal(html);
    }

    function _commentsListHtml(studentId) {
      var comments = getCommentsForStudent(studentId);
      if (!comments.length) return '<div class="empty" style="padding:16px;">Chưa có nhận xét.</div>';
      var canDel = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      return comments.map(function (c) {
        var del = canDel ? ' <span onclick="deleteStuComment(' + qid(c.id) + ',' + qid(studentId) + ')" style="cursor:pointer;color:var(--danger);font-size:11px;font-weight:600;">Xóa</span>' : '';
        return '<div style="padding:10px 0;border-bottom:1px solid var(--border);">' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-bottom:4px;gap:8px;">' +
          '<span>👩‍🏫 ' + escHtml(c.teacher) + ' · ' + escHtml(c.date) + '</span>' +
          '<span><span class="badge badge-info" style="font-size:10px;">' + (_COMMENT_CAT[c.category] || c.category) + '</span>' + del + '</span></div>' +
          '<div style="font-size:14px;">' + escHtml(c.text) + '</div></div>';
      }).join('');
    }

    function saveComment(studentId) {
      var text = ((document.getElementById('mComText') || {}).value || '').trim();
      if (!text) { showToast('Nhập nội dung nhận xét.', 'error'); return; }
      if (!_db || !_dbUserId) { showToast('Chưa kết nối tài khoản.', 'error'); return; }
      var s = students.find(function (x) { return String(x.id) === String(studentId); });
      var cat = (document.getElementById('mComCat') || {}).value || 'progress';
      var today = new Date().toISOString().split('T')[0];
      _db.from('teacher_comments').insert({
        teacher_id: _dbUserId, teacher_name: currentUser.name,
        student_id: String(studentId), student_name: s ? s.name : '',
        comment: text, type: cat, date: today,
      }).select().then(function (r) {
        if (r.error) { showToast('Lỗi lưu nhận xét: ' + r.error.message, 'error'); return; }
        var row = r.data && r.data[0];
        teacherComments.unshift({ id: row ? row.id : Date.now(), studentId: studentId, studentName: s ? s.name : '', teacher: currentUser.name, text: text, category: cat, date: today });
        var el = document.getElementById('mComText'); if (el) el.value = '';
        var list = document.getElementById('stuCommentList'); if (list) list.innerHTML = _commentsListHtml(studentId);
        showToast('Đã thêm nhận xét.', 'success');
      });
    }

    function deleteStuComment(commentId, studentId) {
      uiConfirm('Xóa nhận xét này?', function () {
        teacherComments = teacherComments.filter(function (c) { return c.id !== commentId; });
        var list = document.getElementById('stuCommentList'); if (list) list.innerHTML = _commentsListHtml(studentId);
        if (_db) _db.from('teacher_comments').delete().eq('id', String(commentId)).then(function (r) { if (r.error) showToast('Lỗi xóa: ' + r.error.message, 'error'); });
      });
    }

