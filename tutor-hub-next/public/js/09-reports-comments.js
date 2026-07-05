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
          options: { responsive: true, plugins: { legend: { labels: { color: getChartTextColor(), font: { size: 11 } } } }, scales: { x: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } }, y: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() }, beginAtZero: true } } }
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
          options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() }, beginAtZero: true }, y: { ticks: { color: getChartTextColor(), font: { size: 10 } }, grid: { color: getChartGridColor() } } } }
        });
      }
    }

    // ============================================================
    // XUẤT BÁO CÁO (Điểm / Điểm danh / Học phí) — CSV (Excel) + In/PDF
    // ============================================================
    // CSV mở tốt trong Excel: có BOM UTF-8 cho tiếng Việt, ô có dấu phẩy/xuống
    // dòng được bọc "". In/PDF dùng cửa sổ in (giống exportInvoice) — không cần
    // thư viện ngoài, an toàn và không đụng dữ liệu/RLS.
    function _csvCell(v) {
      var s = (v == null ? '' : String(v));
      if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
      return s;
    }
    function _csvFromRows(rows) {
      return '﻿' + rows.map(function (r) { return r.map(_csvCell).join(','); }).join('\r\n');
    }
    function _downloadText(filename, text, mime) {
      try {
        var blob = new Blob([text], { type: (mime || 'text/csv') + ';charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
      } catch (e) { showToast('Trình duyệt không hỗ trợ tải tệp.', 'error'); }
    }
    function _today() { return new Date().toISOString().split('T')[0]; }

    function exportGradesCSV() {
      if (!students.length) { showToast('Chưa có dữ liệu học sinh để xuất.', 'error'); return; }
      var rows = [['Học sinh', 'Lớp', 'Điểm Toán', 'Điểm Anh', 'Điểm TB', 'Xếp loại', 'Chuyên cần %']];
      students.forEach(function (s) {
        var avg = avgScore(s);
        rows.push([s.name, s.class || '', s.mathScore, s.engScore, avg, getGrade(avg), s.attendance || 0]);
      });
      _downloadText('bao-cao-diem_' + _today() + '.csv', _csvFromRows(rows));
      showToast('Đã xuất báo cáo điểm (CSV).', 'success');
      try { logAudit('export', 'grades', 'Xuất báo cáo điểm ' + students.length + ' HS'); } catch (e) { }
    }

    function exportAttendanceCSV() {
      if (!attendanceRecords.length) { showToast('Chưa có dữ liệu điểm danh để xuất.', 'error'); return; }
      var label = { present: 'Có mặt', absent: 'Vắng', late: 'Muộn' };
      var rows = [['Ngày', 'Học sinh', 'Lớp', 'Trạng thái']];
      attendanceRecords.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); })
        .forEach(function (r) {
          rows.push([r.date || '', r.studentName || '', r.className || r.class || '', label[r.status] || r.status || '']);
        });
      _downloadText('bao-cao-diem-danh_' + _today() + '.csv', _csvFromRows(rows));
      showToast('Đã xuất báo cáo điểm danh (CSV).', 'success');
      try { logAudit('export', 'attendance', 'Xuất điểm danh ' + attendanceRecords.length + ' lượt'); } catch (e) { }
    }

    function exportPaymentsCSV() {
      if (!(currentUser && currentUser.role === 'Admin')) { showToast('Chỉ admin xuất được báo cáo học phí.', 'error'); return; }
      if (!payments.length) { showToast('Chưa có khoản thu để xuất.', 'error'); return; }
      var label = { Paid: 'Đã thanh toán', Pending: 'Chưa thanh toán', Overdue: 'Quá hạn' };
      var rows = [['Học sinh', 'Số tiền (USD)', 'Hạn đóng', 'Ngày đóng', 'Trạng thái', 'Ghi chú']];
      payments.forEach(function (p) {
        rows.push([p.student || '', p.amount, p.due || '', p.paid || '', label[p.status] || p.status, p.note || '']);
      });
      _downloadText('bao-cao-hoc-phi_' + _today() + '.csv', _csvFromRows(rows));
      showToast('Đã xuất báo cáo học phí (CSV).', 'success');
      try { logAudit('export', 'payments', 'Xuất học phí ' + payments.length + ' khoản'); } catch (e) { }
    }

    function exportReportPDF() {
      var w = window.open('', '_blank', 'width=900,height=700');
      if (!w) { showToast('Vui lòng cho phép popup để in báo cáo.', 'error'); return; }
      var totalStudents = students.length;
      var avgMath = totalStudents ? Math.round(students.reduce(function (a, x) { return a + x.mathScore; }, 0) / totalStudents) : 0;
      var avgEng = totalStudents ? Math.round(students.reduce(function (a, x) { return a + x.engScore; }, 0) / totalStudents) : 0;
      var paid = payments.filter(function (p) { return p.status === 'Paid'; }).length;
      var overdueN = payments.filter(function (p) { return p.status === 'Overdue'; }).length;
      var sorted = students.slice().sort(function (a, b) { return avgScore(b) - avgScore(a); }).slice(0, 10);
      var topRows = sorted.map(function (s, i) {
        return '<tr><td>' + (i + 1) + '</td><td>' + escHtml(s.name) + '</td><td>' + escHtml(s.class || '') + '</td><td>' + avgScore(s) + '%</td><td>' + getGrade(avgScore(s)) + '</td></tr>';
      }).join('');
      var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Báo cáo tổng hợp — Tutor Hub</title>' +
        '<style>body{font-family:system-ui,"Segoe UI",sans-serif;color:#1e293b;padding:40px;line-height:1.5;}' +
        'h1{color:#4f46e5;margin:0 0 4px;}.sub{color:#64748b;margin-bottom:24px;}' +
        '.kpis{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px;}' +
        '.kpi{border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;min-width:130px;}' +
        '.kpi b{display:block;font-size:22px;color:#4f46e5;}.kpi span{font-size:12px;color:#64748b;}' +
        'table{width:100%;border-collapse:collapse;margin-top:8px;}th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left;font-size:13px;}th{background:#f8fafc;}' +
        '.footer{margin-top:40px;font-size:11px;color:#94a3b8;text-align:center;}' +
        '@media print{.no-print{display:none;}}</style></head><body>' +
        '<h1>📚 Tutor Hub — Báo cáo tổng hợp</h1>' +
        '<div class="sub">Ngày xuất: ' + _today() + '</div>' +
        '<button class="no-print" onclick="window.print()" style="padding:8px 16px;background:#4f46e5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;margin-bottom:20px;">In / Lưu PDF</button>' +
        '<div class="kpis">' +
        '<div class="kpi"><b>' + totalStudents + '</b><span>Tổng học sinh</span></div>' +
        '<div class="kpi"><b>' + avgMath + '%</b><span>Điểm TB Toán</span></div>' +
        '<div class="kpi"><b>' + avgEng + '%</b><span>Điểm TB Anh</span></div>' +
        '<div class="kpi"><b>' + paid + '/' + payments.length + '</b><span>Học phí đã thu</span></div>' +
        '<div class="kpi"><b>' + overdueN + '</b><span>Học phí quá hạn</span></div>' +
        '</div>' +
        '<h3>Top học sinh</h3>' +
        '<table><thead><tr><th>#</th><th>Học sinh</th><th>Lớp</th><th>Điểm TB</th><th>Xếp loại</th></tr></thead><tbody>' +
        (topRows || '<tr><td colspan="5">Chưa có dữ liệu</td></tr>') + '</tbody></table>' +
        '<div class="footer">Xuất tự động từ hệ thống quản lý học tập Tutor Hub.</div>' +
        '<script>window.onload=function(){setTimeout(function(){window.print();},400);};<\/script>' +
        '</body></html>';
      w.document.write(html); w.document.close();
      try { logAudit('export', 'report_pdf', 'In/PDF báo cáo tổng hợp'); } catch (e) { }
    }

    // Menu xuất — mở modal chọn định dạng (đồng bộ giao diện app).
    function openExportMenu() {
      var isAdmin = currentUser && currentUser.role === 'Admin';
      var body = '<div class="modal-header"><h3 style="display:flex;align-items:center;gap:8px;">' + svgIcon('reports', 18) + 'Xuất báo cáo</h3><button class="modal-close" onclick="closeModal()" aria-label="Đóng">✕</button></div>' +
        '<div class="modal-body"><div style="display:flex;flex-direction:column;gap:10px;">' +
        '<button class="btn btn-ghost" style="justify-content:flex-start;" onclick="exportGradesCSV()">📊 Điểm số — CSV (Excel)</button>' +
        '<button class="btn btn-ghost" style="justify-content:flex-start;" onclick="exportAttendanceCSV()">🗓️ Điểm danh — CSV (Excel)</button>' +
        (isAdmin ? '<button class="btn btn-ghost" style="justify-content:flex-start;" onclick="exportPaymentsCSV()">💳 Học phí — CSV (Excel)</button>' : '') +
        '<button class="btn btn-primary" style="justify-content:flex-start;" onclick="closeModal();exportReportPDF()">🖨️ Báo cáo tổng hợp — In / PDF</button>' +
        '</div><div class="hint" style="margin-top:12px;">Tệp CSV mở trực tiếp bằng Excel/Google Sheets (đã có dấu tiếng Việt).</div>' +
        '</div>';
      openModal(body, 'modal-sm');
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

