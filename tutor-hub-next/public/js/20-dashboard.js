    // ============================================================
    // DASHBOARD (KPI + chart + danh sách — dữ liệu thật)
    // ============================================================
    function renderDashboard() {
      if (!currentUser || (currentUser.role !== 'Teacher' && currentUser.role !== 'Admin')) return;

      // KPI Học viên + active 30 ngày (có đi học trong 30 ngày qua)
      var elS = document.getElementById('kpiStudents'); if (elS) elS.textContent = students.length;
      var cutoff = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];
      var activeSet = {};
      attendanceRecords.forEach(function (r) {
        if (r.date >= cutoff && r.status !== 'absent') activeSet[r.studentRef || r.studentName] = 1;
      });
      var elSSub = document.getElementById('kpiStudentsSub');
      if (elSSub) elSSub.textContent = Object.keys(activeSet).length + ' active trong 30 ngày';

      // KPI Chuyên cần: % thật từ attendance_records; chưa có thì lấy hồ sơ
      var pct = null;
      if (attendanceRecords.length) {
        var ok = 0;
        attendanceRecords.forEach(function (r) { if (r.status !== 'absent') ok++; });
        pct = Math.round(ok / attendanceRecords.length * 100);
      } else if (students.length) {
        pct = Math.round(students.reduce(function (a, s) { return a + (s.attendance || 0); }, 0) / students.length);
      }
      var elA = document.getElementById('kpiAttend'); if (elA) elA.textContent = (pct === null ? '—' : pct + '%');
      var elASub = document.getElementById('kpiAttendSub');
      if (elASub) elASub.textContent = attendanceRecords.length ? ('từ ' + attendanceRecords.length + ' lượt điểm danh') : 'chưa có dữ liệu';

      // KPI Điểm TB
      var elSc = document.getElementById('kpiScore');
      var elScSub = document.getElementById('kpiScoreSub');
      if (students.length) {
        var avg = students.reduce(function (a, s) { return a + avgScore(s); }, 0) / students.length;
        if (elSc) elSc.textContent = Math.round(avg * 10) / 10;
        if (elScSub) elScSub.textContent = 'trung bình ' + students.length + ' học viên';
      } else {
        if (elSc) elSc.textContent = '—';
        if (elScSub) elScSub.textContent = 'chưa có học viên';
      }

      // KPI Doanh thu tháng này (tổng Paid theo paid_date) + so tháng trước
      var now = new Date();
      var curKey = now.toISOString().slice(0, 7);
      var prevKey = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().slice(0, 7);
      var revCur = 0, revPrev = 0;
      payments.forEach(function (p) {
        if (p.status !== 'Paid' || !p.paid) return;
        var k = String(p.paid).slice(0, 7);
        if (k === curKey) revCur += p.amount;
        else if (k === prevKey) revPrev += p.amount;
      });
      var elRL = document.getElementById('kpiRevenueLabel'); if (elRL) elRL.textContent = 'Doanh thu tháng ' + (now.getMonth() + 1);
      var elR = document.getElementById('kpiRevenue'); if (elR) elR.textContent = _fmtMoney(revCur);
      var elRSub = document.getElementById('kpiRevenueSub');
      if (elRSub) {
        var diff = revCur - revPrev;
        elRSub.textContent = (diff >= 0 ? '↑ ' : '↓ ') + _fmtMoney(Math.abs(diff)) + ' so với tháng trước';
        elRSub.className = 'kpi-change ' + (diff >= 0 ? 'up' : 'down');
      }

      try { renderDashCharts(); } catch (e) { }
      renderDashLists();
    }

    function renderDashLists() {
      // Tình trạng lớp: sĩ số / sức chứa — sắp đầy / còn chỗ / trống
      var el = document.getElementById('dashClasses');
      if (el) {
        var cnt = document.getElementById('dashClassCount');
        if (cnt) cnt.textContent = classes.length + ' lớp';
        el.innerHTML = classes.length ? classes.map(function (c) {
          var enrolled = students.filter(function (s) { return s.class === c.name; }).length;
          var cap = c.capacity || c.maxStudents || 0;
          var pctFull = cap ? Math.min(100, Math.round(enrolled / cap * 100)) : 0;
          var badge = !enrolled
            ? '<span class="badge" style="background:var(--bg);color:var(--text-muted);">Trống</span>'
            : pctFull >= 100 ? '<span class="badge badge-danger">Đầy</span>'
              : pctFull >= 80 ? '<span class="badge badge-warning">Sắp đầy</span>'
                : '<span class="badge badge-success">Còn chỗ</span>';
          var barColor = pctFull >= 100 ? 'var(--danger)' : pctFull >= 80 ? 'var(--warning)' : 'var(--accent)';
          return '<div style="padding:10px 0;border-bottom:1px solid var(--border);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px;">' +
            '<div style="font-size:13px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(c.name) +
            (c.subject ? ' <span style="color:var(--text-muted);font-weight:400;">· ' + escHtml(c.subject) + '</span>' : '') + '</div>' +
            '<div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">' +
            '<span style="font-size:12px;color:var(--text-muted);">' + enrolled + '/' + (cap || '—') + '</span>' + badge + '</div></div>' +
            '<div class="score-bar" style="height:6px;"><div class="score-fill" style="width:' + pctFull + '%;background:' + barColor + ';"></div></div>' +
            '</div>';
        }).join('') : '<div class="empty">Chưa có lớp nào.</div>';
      }

      // Cảnh báo học phí
      var overdue = payments.filter(function (p) { return p.status === 'Overdue'; });
      var oc = document.getElementById('overdueCount');
      if (oc) oc.textContent = overdue.length + ' quá hạn';
      var dp = document.getElementById('dashPayments');
      if (dp) {
        dp.innerHTML = payments.length ? payments.slice(0, 5).map(function (p) {
          var badge = { 'Paid': 'badge-success', 'Pending': 'badge-warning', 'Overdue': 'badge-danger' }[p.status];
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">' +
            '<div><div style="font-size:13px;font-weight:600">' + escHtml(p.student) + '</div><div style="font-size:12px;color:var(--text-muted)">Hạn: ' + escHtml(p.due || '—') + '</div></div>' +
            '<div style="display:flex;align-items:center;gap:10px;"><strong>$' + p.amount + '</strong><span class="badge ' + badge + '">' + escHtml(p.status) + '</span></div>' +
            '</div>';
        }).join('') : '<div class="empty">Chưa có khoản thu.</div>';
      }
    }

