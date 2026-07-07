    // ============================================================
    // ASSIGNMENTS
    // ============================================================
    function renderAssignments() {
      var isTA = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      var hwBtn = document.getElementById('hwRemindBtn');
      if (hwBtn) hwBtn.style.display = isTA ? '' : 'none';
      renderClassSidebar();
      var feed = document.getElementById('classFeed');
      if (feed && typeof _dbError !== 'undefined' && _dbError.assignments && !assignments.length) {
        feed.innerHTML = errorBlock(_dbError.assignments, 'retryLoad()');
        return;
      }
      renderClassFeed();
    }

    function qid(v) { return "'" + String(v == null ? '' : v).replace(/'/g, "\\'") + "'"; }
    // Feed chỉ dùng lớp THẬT (id UUID có dấu '-'); bỏ lớp demo (id số nguyên).
    function _classesForFeed() { return classes.filter(function (c) { return /-/.test(String(c.id)); }); }

    function renderClassSidebar() {
      var el = document.getElementById('classSidebar');
      if (!el) return;
      var isTeacher = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      var cls = _classesForFeed();
      if (!cls.length) {
        el.innerHTML = '<div class="card" style="padding:16px;color:var(--text-muted);font-size:13px;">' +
          (isTeacher ? 'Chưa có lớp. Tạo lớp ở mục Lớp học (Classes).' : 'Bạn chưa được thêm vào lớp nào.') + '</div>';
        return;
      }
      if (!currentClassId || !cls.some(function (c) { return c.id === currentClassId; })) currentClassId = cls[0].id;
      var bySubject = {};
      cls.forEach(function (c) { var s = c.subject || 'Khác'; (bySubject[s] = bySubject[s] || []).push(c); });
      var html = '<div class="card" style="padding:10px;">';
      Object.keys(bySubject).forEach(function (subj) {
        html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);padding:6px 8px 2px;">📚 ' + escHtml(subj) + '</div>';
        bySubject[subj].forEach(function (c) {
          var active = c.id === currentClassId;
          html += '<div onclick="selectClass(' + qid(c.id) + ')" style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:8px 10px;border-radius:8px;cursor:pointer;margin-bottom:2px;' +
            (active ? 'background:var(--primary,#3b82f6);color:#fff;' : '') + '">' +
            '<span style="font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">🏫 ' + escHtml(c.name) + '</span>' +
            (isTeacher ? '<button onclick="event.stopPropagation();openMembersModal(' + qid(c.id) + ')" title="Thành viên" style="background:none;border:none;cursor:pointer;font-size:14px;' + (active ? 'color:#fff;' : 'color:var(--text-muted);') + '">👥</button>' : '') +
            '</div>';
        });
      });
      html += '</div>';
      el.innerHTML = html;
    }

    function selectClass(id) { currentClassId = id; renderAssignments(); }

    // ── Kỳ học theo TUẦN (Moodle-style) ──────────────────────────
    function _pd2(n) { return String(n).padStart(2, '0'); }
    function _parseYMD(s) { if (!s) return null; var m = String(s).split('T')[0].split('-'); if (m.length !== 3) return null; var d = new Date(+m[0], +m[1] - 1, +m[2]); return isNaN(d.getTime()) ? null : d; }
    function _ymdStr(d) { return d.getFullYear() + '-' + _pd2(d.getMonth() + 1) + '-' + _pd2(d.getDate()); }
    function _fmtDM(d) { return _pd2(d.getDate()) + '/' + _pd2(d.getMonth() + 1); }
    function _classWeeks(cur) {
      var start = _parseYMD(cur && cur.termStart); var n = parseInt(cur && cur.termWeeks, 10);
      if (!start || !n || n < 1) return null;
      var weeks = [];
      for (var i = 0; i < Math.min(n, 53); i++) {
        var s = new Date(start); s.setDate(start.getDate() + i * 7);
        var e = new Date(s); e.setDate(s.getDate() + 6);
        weeks.push({ idx: i + 1, start: s, end: e });
      }
      return weeks;
    }
    function _weekOf(weeks, due) { var d = _parseYMD(due); if (!d) return null; for (var i = 0; i < weeks.length; i++) { if (d >= weeks[i].start && d <= weeks[i].end) return weeks[i].idx; } return null; }
    function _termLabel(cur) { var d = _parseYMD(cur && cur.termStart); return (d && cur.termWeeks) ? (' · 🗓 ' + cur.termWeeks + ' tuần từ ' + _fmtDM(d)) : ''; }
    function _wkSection(title, subtitle, posts, open) {
      return '<details class="wk-sec"' + (open ? ' open' : '') + '>' +
        '<summary class="wk-sum"><span class="wk-caret">▸</span><span class="wk-title">' + escHtml(title) + '</span>' +
        (subtitle ? '<span class="wk-sub">' + escHtml(subtitle) + '</span>' : '') +
        '<span class="wk-count">' + posts.length + '</span></summary>' +
        '<div class="wk-body">' + (posts.length ? posts.map(renderPostCard).join('') : '<div class="wk-empty">Chưa có bài trong mục này.</div>') + '</div>' +
        '</details>';
    }

    function renderClassFeed() {
      var el = document.getElementById('classFeed');
      if (!el) return;
      var isTeacher = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      var cls = _classesForFeed();
      var cur = cls.find(function (c) { return c.id === currentClassId; });
      if (!cur) { el.innerHTML = '<div class="card" style="padding:24px;text-align:center;color:var(--text-muted);">Chọn một lớp ở bên trái để xem bài tập.</div>'; return; }
      var posts = assignments.filter(function (a) { return a.classId === currentClassId; });
      var actions = isTeacher
        ? '<button class="btn btn-ghost btn-sm" onclick="openClassTermModal()">🗓 Kỳ học</button> <button class="btn btn-primary" onclick="openAssignmentModal()">+ Đăng bài</button>'
        : '';
      var header = '<div class="card" style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">' +
        '<div><div style="font-weight:700;font-size:18px;">🏫 ' + escHtml(cur.name) + '</div>' +
        '<div style="font-size:13px;color:var(--text-muted);">' + escHtml(cur.subject || '') + _termLabel(cur) + '</div></div>' +
        '<div style="display:flex;gap:8px;">' + actions + '</div></div>';

      var weeks = _classWeeks(cur);
      if (!weeks) {
        // Chưa đặt kỳ học → feed phẳng như cũ (+ nhắc GV đặt kỳ học).
        var prompt = isTeacher
          ? '<div class="card wk-prompt">🗓 <strong>Chưa đặt kỳ học theo tuần.</strong> Bấm <a href="#" onclick="openClassTermModal();return false;">Kỳ học</a> để đặt ngày bắt đầu Tuần 1 &amp; số tuần — bài tập sẽ tự xếp vào từng tuần.</div>'
          : '';
        el.innerHTML = header + prompt + (posts.length ? posts.map(renderPostCard).join('')
          : '<div class="card" style="padding:24px;text-align:center;color:var(--text-muted);">Chưa có bài tập nào trong lớp này.</div>');
        return;
      }

      // Gom bài theo tuần (dựa hạn nộp); không có hạn → General; ngoài kỳ → "Ngoài kỳ học".
      var general = [], outside = [], buckets = {};
      posts.forEach(function (p) {
        if (!_parseYMD(p.dueDate)) { general.push(p); return; }
        var w = _weekOf(weeks, p.dueDate);
        if (w) (buckets[w] = buckets[w] || []).push(p); else outside.push(p);
      });
      var openIdx = _weekOf(weeks, _ymdStr(new Date())) || 1;
      var body = _wkSection('📌 General', 'Thông báo & bài chung (không đặt hạn)', general, true);
      weeks.forEach(function (w) {
        body += _wkSection('Tuần ' + w.idx, _fmtDM(w.start) + ' – ' + _fmtDM(w.end), buckets[w.idx] || [], w.idx === openIdx);
      });
      if (outside.length) body += _wkSection('Ngoài kỳ học', 'Bài có hạn nộp ngoài các tuần trên', outside, false);
      el.innerHTML = header + body;
    }

    // GV/Admin đặt "Tuần 1 bắt đầu ngày… / số tuần" cho lớp đang chọn.
    function openClassTermModal() {
      var cur = _classesForFeed().find(function (c) { return c.id === currentClassId; });
      if (!cur) { showToast('Chọn lớp trước.', 'error'); return; }
      if (!(currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin'))) { showToast('Chỉ GV/Admin đặt kỳ học.', 'error'); return; }
      openModal('<div class="modal-header"><h3>🗓 Kỳ học theo tuần — ' + escHtml(cur.name) + '</h3><button class="modal-close" onclick="closeModal()" aria-label="Đóng">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="hint">Đặt ngày bắt đầu <strong>Tuần 1</strong> và tổng số tuần. Bài tập tự xếp vào tuần theo <strong>hạn nộp</strong>.</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label for="mTermStart">Tuần 1 bắt đầu ngày</label><input class="form-input" type="date" id="mTermStart" value="' + escAttr((cur.termStart || '').split('T')[0]) + '"></div>' +
        '<div class="form-group"><label for="mTermWeeks">Số tuần</label><input class="form-input" type="number" min="1" max="53" id="mTermWeeks" value="' + (cur.termWeeks || 16) + '"></div>' +
        '</div></div>' +
        '<div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        (cur.termStart ? '<button class="btn btn-danger" onclick="saveClassTerm(true)">Xoá kỳ học</button>' : '') +
        '<button class="btn btn-primary" onclick="saveClassTerm(false)">Lưu</button></div>');
    }
    function saveClassTerm(clear) {
      var cur = _classesForFeed().find(function (c) { return c.id === currentClassId; });
      if (!cur || !_db) return;
      var ts = clear ? null : (((document.getElementById('mTermStart') || {}).value) || null);
      var tw = clear ? null : (parseInt((document.getElementById('mTermWeeks') || {}).value, 10) || null);
      if (!clear && (!ts || !tw)) { showToast('Nhập ngày bắt đầu và số tuần.', 'error'); return; }
      _db.from('classes').update({ term_start: ts, term_weeks: tw }).eq('id', String(cur.id)).then(function (r) {
        if (r.error) { showToast('Lỗi lưu kỳ học: ' + r.error.message, 'error'); return; }
        cur.termStart = ts || ''; cur.termWeeks = tw || 0;
        closeModal();
        showToast(clear ? 'Đã xoá kỳ học.' : 'Đã lưu kỳ học theo tuần.', 'success');
        try { logAudit('class_term', 'class', 'Đặt kỳ học lớp ' + cur.name); } catch (e) { }
        renderAssignments();
      });
    }

    function renderPostCard(a) {
      var isTeacher = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      var isStudent = currentUser && currentUser.role === 'Student';
      var subs = submissions.filter(function (s) { return s.assignmentId === a.id; });
      var statusBadge = a.status === 'open'
        ? '<span class="badge badge-success">Đang mở</span>'
        : '<span class="badge badge-warning">Đã đóng</span>';
      var attach = '';
      if (a.attachmentUrl) {
        attach = _isImageUrl(a.attachmentUrl)
          ? '<div style="margin-top:8px;"><a href="' + escAttr(a.attachmentUrl) + '" target="_blank" rel="noopener"><img src="' + escAttr(a.attachmentUrl) + '" style="max-width:100%;max-height:320px;border-radius:8px;cursor:zoom-in;" loading="lazy"></a></div>'
          : '<div style="margin-top:8px;"><a class="btn btn-sm btn-ghost" href="' + escAttr(a.attachmentUrl) + '" target="_blank" rel="noopener">📎 Tệp đính kèm</a></div>';
      }
      var teacherActions = isTeacher
        ? '<button class="btn btn-sm btn-ghost" onclick="openAssignmentModal(' + qid(a.id) + ')" title="Sửa">✏️</button>' +
          '<button class="btn btn-sm btn-ghost" onclick="deleteAssignment(' + qid(a.id) + ')" title="Xóa">🗑</button>' : '';
      var thread = subs.map(function (s) { return renderSubmissionRow(a, s); }).join('');
      var mySub = isStudent ? subs.find(function (s) { return s.studentId === _dbUserId; }) : null;
      var composer = '';
      if (isStudent && a.status === 'open') {
        composer = '<div style="display:flex;gap:6px;margin-top:10px;align-items:center;">' +
          '<input class="form-input" id="subInput_' + a.id + '" placeholder="' + (mySub ? 'Cập nhật bài nộp...' : 'Viết bài nộp...') + '" style="flex:1;" value="' + escAttr(mySub ? mySub.content : '') + '">' +
          '<input type="file" id="subFile_' + a.id + '" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style="display:none;" onchange="_subFilePicked(' + qid(a.id) + ')">' +
          '<button class="btn btn-sm btn-ghost" onclick="document.getElementById(\'subFile_' + a.id + '\').click()" title="Đính kèm tệp">📎</button>' +
          '<span id="subFileName_' + a.id + '" style="font-size:11px;color:var(--text-muted);max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></span>' +
          '<button class="btn btn-sm btn-primary" onclick="submitWork(' + qid(a.id) + ')">' + (mySub ? 'Cập nhật' : 'Nộp') + '</button>' +
          '</div>';
      }
      return '<div class="card" style="margin-bottom:14px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">' +
        '<div style="display:flex;gap:10px;align-items:center;min-width:0;">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:var(--primary,#3b82f6);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">' + escHtml((a.subject || 'GV').slice(0, 1).toUpperCase()) + '</div>' +
        '<div style="min-width:0;"><div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;">' + escHtml(a.title) + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);">' + escHtml(a.subject || '') + ' · 📅 ' + escHtml(a.dueDate || 'không hạn') + ' ' + statusBadge + '</div></div>' +
        '</div>' +
        '<div style="display:flex;gap:4px;flex-shrink:0;">' + teacherActions + '</div>' +
        '</div>' +
        (a.description ? '<div style="margin-top:10px;font-size:14px;white-space:pre-wrap;">' + escHtml(a.description) + '</div>' : '') +
        attach +
        '<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px;">' +
        '<div style="font-size:13px;font-weight:600;color:var(--text-muted);margin-bottom:6px;">💬 Bài nộp (' + subs.length + ')</div>' +
        (thread || '<div style="font-size:13px;color:var(--text-muted);">Chưa có bài nộp.</div>') +
        composer +
        '</div>' +
        '</div>';
    }

    function renderSubmissionRow(a, s) {
      var isTeacher = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      var isOwner = s.studentId && s.studentId === _dbUserId;
      // Ảnh hiển thị luôn (dưới nội dung), file khác thì link
      var media = '';
      if (s.fileUrl) {
        media = _isImageUrl(s.fileUrl)
          ? '<div style="margin-top:6px;"><a href="' + escAttr(s.fileUrl) + '" target="_blank" rel="noopener"><img src="' + escAttr(s.fileUrl) + '" style="max-width:260px;max-height:240px;border-radius:8px;cursor:zoom-in;display:block;" loading="lazy"></a></div>'
          : '<div style="margin-top:4px;"><a href="' + escAttr(s.fileUrl) + '" target="_blank" rel="noopener" style="font-size:12px;">📎 tệp đính kèm</a></div>';
      }
      var gradeBox = '';
      if (s.grade !== null && s.grade !== undefined) {
        gradeBox = '<div style="margin-top:4px;background:var(--bg);border-radius:8px;padding:6px 10px;font-size:13px;">' +
          '<strong style="color:var(--success);">Điểm: ' + s.grade + '/10</strong>' +
          (s.feedback ? '<div style="color:var(--text-muted);margin-top:2px;">📝 ' + escHtml(s.feedback) + '</div>' : '') + '</div>';
      }
      // Hàng thao tác kiểu Facebook: Sửa · Xóa · (Chấm)
      var acts = [];
      if (isOwner && a.status === 'open') acts.push('<span onclick="focusComposer(' + qid(a.id) + ')" style="cursor:pointer;font-weight:600;">Sửa</span>');
      if (isOwner || isTeacher) acts.push('<span onclick="deleteSubmission(' + qid(s.id) + ')" style="cursor:pointer;font-weight:600;color:var(--danger);">Xóa</span>');
      if (isTeacher) acts.push('<span onclick="openGradeModal(' + qid(s.id) + ')" style="cursor:pointer;font-weight:600;color:var(--accent);">' + (s.grade != null ? 'Sửa điểm' : 'Chấm điểm') + '</span>');
      var actRow = '<div style="font-size:12px;color:var(--text-muted);margin-top:3px;display:flex;gap:12px;align-items:center;">' +
        '<span>' + escHtml(s.submittedAt || '') + '</span>' + acts.join('') + '</div>';

      return '<div style="display:flex;gap:10px;padding:8px 0;">' +
        '<div style="width:32px;height:32px;border-radius:50%;background:var(--purple,#8b5cf6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;">' + escHtml((s.studentName || '?').slice(0, 1).toUpperCase()) + '</div>' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="background:var(--bg);border-radius:12px;padding:8px 12px;">' +
        '<div style="font-weight:600;font-size:13px;">' + escHtml(s.studentName || 'Học sinh') + (isOwner ? ' <span style="font-weight:400;color:var(--text-muted);">(bạn)</span>' : '') + '</div>' +
        (s.content ? '<div style="font-size:14px;word-break:break-word;white-space:pre-wrap;">' + escHtml(s.content) + '</div>' : '') +
        media +
        '</div>' +
        actRow +
        gradeBox +
        '</div></div>';
    }

    function focusComposer(assignmentId) {
      var inp = document.getElementById('subInput_' + assignmentId);
      if (inp) { inp.focus(); inp.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }

    function deleteSubmission(subId) {
      uiConfirm('Xóa bài nộp này?', function () {
        submissions = submissions.filter(function (x) { return x.id !== subId; });
        renderAssignments();
        if (_db) {
          _db.from('assignment_submissions').delete().eq('id', String(subId)).then(function (r) {
            if (r.error) { showToast('Lỗi xóa: ' + r.error.message, 'error'); reloadSubmissions(); }
            else showToast('Đã xóa bài nộp.', 'success');
          });
        }
      });
    }

    function _subFilePicked(assignmentId) {
      var fi = document.getElementById('subFile_' + assignmentId);
      var span = document.getElementById('subFileName_' + assignmentId);
      if (fi && span) span.textContent = (fi.files && fi.files[0]) ? fi.files[0].name : '';
    }

    function submitWork(assignmentId) {
      var inp = document.getElementById('subInput_' + assignmentId);
      var text = inp ? inp.value.trim() : '';
      var fi = document.getElementById('subFile_' + assignmentId);
      var file = fi && fi.files && fi.files[0] ? fi.files[0] : null;
      if (!text && !file) { showToast('Nhập nội dung hoặc đính kèm tệp.', 'error'); return; }
      if (!_db || !_dbUserId) { showToast('Chưa kết nối tài khoản.', 'error'); return; }
      function _save(fileUrl) {
        var payload = {
          assignment_id: String(assignmentId), student_id: _dbUserId,
          student_name: currentUser.name, type: file ? 'file' : 'text', content: text,
        };
        if (fileUrl) payload.file_url = fileUrl;
        _db.from('assignment_submissions').upsert(payload, { onConflict: 'assignment_id,student_id' }).select()
          .then(function (r) {
            hideBusy();
            if (r.error) { showToast('Lỗi nộp bài: ' + r.error.message, 'error'); return; }
            showToast('Đã nộp bài.', 'success');
            reloadSubmissions();
          });
      }
      showBusy(file ? 'Đang nộp bài…' : 'Đang nộp…');
      if (file) {
        var safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        var path = 'assignments/' + assignmentId + '/' + _dbUserId + '_' + Date.now() + '_' + safe;
        _db.storage.from('materials').upload(path, file, { upsert: true }).then(function (r) {
          if (r.error) { hideBusy(); showToast('Lỗi tải tệp: ' + r.error.message, 'error'); return; }
          var url = _db.storage.from('materials').getPublicUrl(path).data.publicUrl;
          _save(url);
        }).catch(function (e) { hideBusy(); showToast('Lỗi mạng khi tải tệp. Thử lại.', 'error'); });
      } else { _save(null); }
    }

    function reloadSubmissions() {
      if (!_db) { renderAssignments(); return; }
      _db.from('assignment_submissions').select('*').order('submitted_at', { ascending: false }).then(function (r) {
        if (!r.error && r.data) {
          submissions = r.data.map(function (s) {
            return { id: s.id, assignmentId: s.assignment_id, studentId: s.student_id, studentName: s.student_name || '', submittedAt: (s.submitted_at || '').split('T')[0], type: s.type || 'text', content: s.content || '', fileUrl: s.file_url || null, grade: (s.grade != null ? Number(s.grade) : null), feedback: s.feedback || null };
          });
        }
        renderAssignments();
        try { updateNotifBadge(); } catch (e) { }
      });
    }

    function openGradeModal(subId) {
      var s = submissions.find(function (x) { return x.id === subId; });
      if (!s) return;
      var html = '<div class="modal-header"><h3>Chấm điểm: ' + escHtml(s.studentName || '') + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        (s.content ? '<div style="background:var(--bg);border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:14px;">' + escHtml(s.content) + (s.fileUrl ? ' <a href="' + escAttr(s.fileUrl) + '" target="_blank">📎 tệp</a>' : '') + '</div>' : '') +
        '<div class="form-group"><label>Điểm (0-10)</label><input class="form-input" type="number" min="0" max="10" step="0.5" id="gGrade" value="' + (s.grade != null ? s.grade : '') + '"></div>' +
        '<div class="form-group"><label>Nhận xét</label><textarea class="form-textarea" id="gFeedback">' + escHtml(s.feedback || '') + '</textarea></div>' +
        '</div><div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="saveGradeInline(' + qid(subId) + ')">Lưu điểm</button></div>';
      openModal(html);
    }

    function saveGradeInline(subId) {
      var g = document.getElementById('gGrade').value;
      var fb = document.getElementById('gFeedback').value.trim();
      var grade = g === '' ? null : Number(g);
      if (!_db) return;
      _db.from('assignment_submissions').update({ grade: grade, feedback: fb }).eq('id', String(subId)).then(function (r) {
        if (r.error) { showToast('Lỗi lưu điểm: ' + r.error.message, 'error'); return; }
        closeModal(); showToast('Đã lưu điểm.', 'success');
        reloadSubmissions();
        reloadStudents(); // điểm TB học viên được trigger cập nhật -> tải lại
      });
    }

    function reloadStudents() {
      if (!_db || !_dbUserId || !currentUser) return;
      var q = _db.from('students').select('*');
      if (currentUser.role === 'Teacher') q = q.eq('owner_id', _dbUserId);
      q.then(function (r) {
        if (r.error || !r.data) return;
        students = r.data.map(_mapStudentRow);
        var kpi = document.getElementById('kpiStudents'); if (kpi) kpi.textContent = students.length;
        if (currentSection === 'students') renderStudents();
        if (currentSection === 'scores') { try { renderScores(); } catch (e) { } }
        if (currentSection === 'reports') { try { renderReports(); } catch (e) { } }
        if (currentSection === 'dashboard') { try { renderDashboard(); } catch (e) { } }
      });
    }

    function deleteAssignment(id) {
      uiConfirm('Xóa bài tập này? Mọi bài nộp sẽ bị xóa theo.', function () {
        assignments = assignments.filter(function (a) { return a.id !== id; });
        renderAssignments();
        if (_db) _db.from('assignments').delete().eq('id', String(id)).then(function (r) { if (r.error) showToast('Lỗi xóa: ' + r.error.message, 'error'); });
      });
    }

    // Nhắc nộp bài HÀNG LOẠT (GV/Admin) — RPC server (migration 021): với mỗi bài
    // đang mở, nhắc thành viên lớp chưa nộp; chống spam 6h. Bản an toàn, bấm chủ động.
    function remindPendingHomework() {
      if (!(currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin'))) { showToast('Chỉ GV/Admin gửi được nhắc nộp bài.', 'error'); return; }
      if (!_db) return;
      uiConfirm('Gửi nhắc nộp bài tới học sinh chưa nộp các bài đang mở?', function () {
        showBusy('Đang gửi nhắc nộp bài…');
        _db.rpc('remind_pending_homework').then(function (r) {
          hideBusy();
          if (r.error) { showToast('Lỗi: ' + r.error.message, 'error'); return; }
          var n = r.data;
          if (n === -1) { showToast('Bạn không có quyền.', 'error'); return; }
          showToast(n > 0 ? ('Đã gửi ' + n + ' nhắc nộp bài.') : 'Không có ai cần nhắc (hoặc vừa nhắc gần đây).', n > 0 ? 'success' : 'info');
          try { logAudit('remind_homework', 'assignment', 'Gửi ' + n + ' nhắc nộp bài'); } catch (e) { }
        });
      }, { danger: false, okText: 'Gửi nhắc' });
    }

    function openMembersModal(classId) {
      var cls = classes.find(function (c) { return c.id === classId; });
      var html = '<div class="modal-header"><h3>👥 Thành viên: ' + escHtml(cls ? cls.name : '') + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div style="font-weight:600;margin-bottom:6px;">📩 Yêu cầu chờ duyệt</div>' +
        '<div id="reqList" style="font-size:14px;color:var(--text-muted);margin-bottom:16px;">Đang tải...</div>' +
        '<div style="font-weight:600;margin-bottom:6px;">Thành viên</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
        '<input class="form-input" id="memEmail" placeholder="Email học sinh..." style="flex:1;">' +
        '<button class="btn btn-primary" onclick="addMember(' + qid(classId) + ')">Thêm</button>' +
        '</div>' +
        '<div id="memList" style="font-size:14px;color:var(--text-muted);">Đang tải...</div>' +
        '</div>';
      openModal(html);
      loadClassRequests(classId);
      loadMembers(classId);
    }

    function loadClassRequests(classId) {
      var el = document.getElementById('reqList');
      if (!el || !_db) return;
      _db.from('enrollment_requests').select('*').eq('class_id', classId).eq('status', 'pending').order('created_at', { ascending: true })
        .then(function (r) {
          if (r.error) { el.innerHTML = 'Lỗi: ' + escHtml(r.error.message); return; }
          if (!r.data || !r.data.length) { el.innerHTML = 'Không có yêu cầu nào.'; return; }
          el.innerHTML = r.data.map(function (q) {
            return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">' +
              '<div><div style="font-weight:600;color:var(--text);">' + escHtml(q.student_name || q.student_email) + '</div>' +
              '<div style="font-size:12px;">' + escHtml(q.student_email) + '</div></div>' +
              '<div style="display:flex;gap:6px;flex-shrink:0;">' +
              '<button class="btn btn-sm btn-primary" onclick="approveReq(' + qid(q.id) + ',' + qid(classId) + ')">Duyệt</button>' +
              '<button class="btn btn-sm btn-ghost" onclick="rejectReq(' + qid(q.id) + ',' + qid(classId) + ')">Từ chối</button>' +
              '</div></div>';
          }).join('');
        });
    }

    function approveReq(reqId, classId) {
      if (!_db) return;
      _db.rpc('approve_enrollment', { _request_id: reqId }).then(function (r) {
        if (r.error) { showToast('Lỗi: ' + r.error.message, 'error'); return; }
        if (r.data === 'no_user') { showToast('Không tìm thấy tài khoản học sinh với email này.', 'error'); return; }
        if (r.data === 'not_allowed') { showToast('Bạn không có quyền duyệt lớp này.', 'error'); return; }
        if (r.data === 'not_found') { showToast('Yêu cầu không tồn tại.', 'error'); return; }
        showToast('Đã duyệt — học sinh vào lớp.', 'success');
        loadClassRequests(classId); loadMembers(classId);
      });
    }

    function rejectReq(reqId, classId) {
      if (!_db) return;
      _db.from('enrollment_requests').update({ status: 'rejected' }).eq('id', String(reqId)).then(function (r) {
        if (r.error) { showToast('Lỗi: ' + r.error.message, 'error'); return; }
        showToast('Đã từ chối.', 'success');
        loadClassRequests(classId);
      });
    }

    function loadMembers(classId) {
      if (!_db) return;
      _db.rpc('list_class_members', { _class_id: classId }).then(function (r) {
        var el = document.getElementById('memList');
        if (!el) return;
        if (r.error) { el.innerHTML = 'Lỗi: ' + escHtml(r.error.message); return; }
        if (!r.data || !r.data.length) { el.innerHTML = 'Chưa có thành viên nào. Thêm bằng email ở trên.'; return; }
        el.innerHTML = r.data.map(function (m) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">' +
            '<div><div style="font-weight:600;color:var(--text);">' + escHtml(m.name || '') + '</div><div style="font-size:12px;">' + escHtml(m.email || '') + '</div></div>' +
            '<button class="btn btn-sm btn-ghost" onclick="removeMember(' + qid(m.member_id) + ',' + qid(classId) + ')">Xóa</button>' +
            '</div>';
        }).join('');
      });
    }

    function addMember(classId) {
      var inp = document.getElementById('memEmail');
      var email = inp ? inp.value.trim() : '';
      if (!email) return;
      if (!_db) return;
      _db.rpc('add_class_member', { _class_id: classId, _email: email }).then(function (r) {
        if (r.error) { showToast('Lỗi: ' + r.error.message, 'error'); return; }
        if (r.data === 'no_user') { showToast('Không tìm thấy tài khoản với email này.', 'error'); return; }
        if (r.data === 'not_owner') { showToast('Bạn không phải chủ lớp này.', 'error'); return; }
        if (inp) inp.value = '';
        showToast('Đã thêm thành viên.', 'success');
        loadMembers(classId);
      });
    }

    function removeMember(memberId, classId) {
      if (!_db) return;
      _db.from('class_members').delete().eq('id', String(memberId)).then(function (r) {
        if (r.error) { showToast('Lỗi xóa: ' + r.error.message, 'error'); return; }
        loadMembers(classId);
      });
    }

    // ── Legacy list renderer (thay bằng class feed ở trên; giữ dormant) ──
    function renderAssignmentsLegacy() {
      var isTeacherOrAdmin = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      var isStudent = currentUser && currentUser.role === 'Student';
      var isParent = currentUser && currentUser.role === 'Parent';
      var createBtn = document.getElementById('createAssignBtn');
      if (createBtn) createBtn.style.display = isTeacherOrAdmin ? '' : 'none';

      var clsF = (document.getElementById('assignClassFilter') || {}).value || '';
      var stF = (document.getElementById('assignStatusFilter') || {}).value || '';

      // Parent: filter to linked child's class only
      var linkedStudent = isParent ? students.find(function (s) { return s.id === currentUser.linkedStudentId; }) : null;

      var list = assignments.filter(function (a) {
        var classOk = !clsF || a.class === clsF;
        var statusOk = !stF || a.status === stF;
        if (isParent && linkedStudent) return a.class === linkedStudent.class && statusOk;
        return classOk && statusOk;
      });

      var container = document.getElementById('assignmentsList');
      if (!container) return;
      if (!list.length) {
        container.innerHTML = '<div class="card" style="padding:32px;text-align:center;color:var(--text-muted);">' + t('assign.nowork') + '</div>';
        return;
      }

      container.innerHTML = list.map(function (a) {
        var subs = submissions.filter(function (s) { return s.assignmentId === a.id; });
        var commentCount = assignmentComments.filter(function (c) { return c.assignmentId === a.id; }).length;
        var aid = JSON.stringify(a.id);

        // Status + grade-published badges
        var statusBadge = a.status === 'open'
          ? '<span class="badge badge-success">Đang mở</span>'
          : '<span class="badge badge-warning">Đã đóng</span>';
        var pubBadge = a.gradesPublished
          ? '<span class="badge badge-info" style="margin-left:4px;">📢 Điểm đã công bố</span>' : '';

        // Attachment link (visible to everyone)
        var attachLine = a.attachmentUrl
          ? '<div style="margin-top:6px;"><a class="btn btn-sm btn-ghost" href="' + escHtml(a.attachmentUrl) + '" target="_blank" rel="noopener">📎 Tệp đính kèm</a></div>'
          : '';

        // Discussion button
        var discussLine = '<div style="margin-top:6px;">' +
          '<button class="btn btn-sm btn-ghost" onclick="openCommentsModal(' + aid + ')">💬 Thảo luận' +
          (commentCount ? ' (' + commentCount + ')' : '') + '</button></div>';

        // Teacher / Admin actions
        var teacherActions = isTeacherOrAdmin
          ? '<button class="btn btn-sm btn-ghost" onclick="openAssignmentModal(' + aid + ')" style="margin-right:4px;">✏️ Sửa</button>' +
          '<button class="btn btn-sm btn-primary" onclick="openSubmissionsView(' + aid + ')">📥 Bài nộp (' + subs.length + ')</button>'
          : '';

        // Student: find own submission by DB userId first, fallback to name
        var mySubmission = null;
        if (isStudent) {
          mySubmission = submissions.find(function (s) { return s.assignmentId === a.id && (_dbUserId ? s.studentId === _dbUserId : s.studentName === (currentUser.name || '')); });
        }
        var studentView = '';
        if (isStudent) {
          if (mySubmission) {
            var gradeStr = '';
            if (mySubmission.grade !== null && a.gradesPublished) {
              gradeStr = '<strong style="color:var(--success);">Điểm: ' + mySubmission.grade + '/10</strong>';
              if (mySubmission.feedback) gradeStr += '<div style="margin-top:4px;font-size:12px;color:var(--text-muted);">📝 ' + escHtml(mySubmission.feedback) + '</div>';
            } else if (mySubmission.grade !== null) {
              gradeStr = '<span style="color:var(--text-muted);font-size:13px;">⏳ Chờ giáo viên công bố điểm...</span>';
            } else {
              gradeStr = '<span style="color:var(--text-muted);font-size:13px;">Chờ chấm...</span>';
            }
            studentView = '<div style="margin-top:10px;"><span class="badge badge-success" style="margin-right:8px;">✅ Đã nộp</span>' + gradeStr + '</div>';
          } else {
            studentView = '<div style="margin-top:10px;"><button class="btn btn-sm btn-primary" onclick="openSubmitModal(' + aid + ')">📤 ' + t('assign.submit') + '</button></div>';
          }
        }

        // Parent: show linked child's submission status
        var parentView = '';
        if (isParent && linkedStudent) {
          var childSub = submissions.find(function (s) { return s.assignmentId === a.id && s.studentName === linkedStudent.name; });
          if (childSub) {
            var childGrade = '';
            if (childSub.grade !== null && a.gradesPublished) {
              childGrade = '<strong style="color:var(--success);">Điểm: ' + childSub.grade + '/10</strong>';
              if (childSub.feedback) childGrade += '<div style="margin-top:4px;font-size:12px;color:var(--text-muted);">📝 ' + escHtml(childSub.feedback) + '</div>';
            } else {
              childGrade = '<span style="font-size:13px;color:var(--text-muted);">Chưa có điểm</span>';
            }
            parentView = '<div style="margin-top:10px;"><span class="badge badge-success" style="margin-right:8px;">✅ ' + escHtml(linkedStudent.name) + ' đã nộp</span>' + childGrade + '</div>';
          } else {
            parentView = '<div style="margin-top:10px;"><span class="badge badge-warning">⏳ Chưa nộp bài</span></div>';
          }
        }

        return '<div class="card" style="margin-bottom:14px;">' +
          '<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
          '<div style="flex:1;min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">' +
          statusBadge + pubBadge +
          '<span class="badge badge-info">' + escHtml(a.class) + '</span>' +
          (a.subject ? '<span class="badge badge-purple" style="font-size:11px;">' + escHtml(a.subject) + '</span>' : '') +
          '<span class="badge" style="background:var(--bg);color:var(--text-muted);font-size:11px;">📅 ' + escHtml(a.dueDate) + '</span>' +
          '</div>' +
          '<div style="font-weight:700;font-size:16px;margin-bottom:4px;">' + escHtml(a.title) + '</div>' +
          '<div style="font-size:13px;color:var(--text-muted);margin-bottom:2px;">' + escHtml(a.description) + '</div>' +
          attachLine + discussLine +
          studentView + parentView +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;">' + teacherActions + '</div>' +
          '</div>' +
          '</div>';
      }).join('');
    }

    function openAssignmentModal(id) {
      var a = id ? assignments.find(function (x) { return x.id === id; }) : null;
      var title = a ? 'Sửa bài tập' : 'Giao bài mới';
      var selClassId = a ? a.classId : currentClassId;
      var classOpts = classes.map(function (c) { return '<option value="' + escAttr(c.id) + '"' + (c.id === selClassId ? ' selected' : '') + '>' + escHtml(c.name) + '</option>'; }).join('');
      var aid = id ? qid(id) : 'null';
      var existingAttach = a && a.attachmentUrl
        ? '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Đính kèm hiện tại: <a href="' + escHtml(a.attachmentUrl) + '" target="_blank">xem tệp</a></div>'
        : '';
      var html = '<div class="modal-header"><h3>' + title + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-group"><label>Tiêu đề</label><input class="form-input" id="mATitle" value="' + (a ? escHtml(a.title) : '') + '"></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Lớp</label><select class="form-select" id="mAClass">' + classOpts + '</select></div>' +
        '<div class="form-group"><label>Môn</label><select class="form-select" id="mASubject">' + _subjectOpts(a && a.subject) + '</select></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Hạn nộp</label><input class="form-input" type="date" id="mADue" value="' + (a ? a.dueDate : '') + '"></div>' +
        '<div class="form-group"><label>Trạng thái</label><select class="form-select" id="mAStatus"><option value="open"' + (a && a.status === 'open' ? ' selected' : '') + '>Đang mở</option><option value="closed"' + (a && a.status === 'closed' ? ' selected' : '') + '>Đã đóng</option></select></div>' +
        '</div>' +
        '<div class="form-group"><label>Mô tả / Yêu cầu</label><textarea class="form-textarea" id="mADesc">' + (a ? escHtml(a.description) : '') + '</textarea></div>' +
        '<div class="form-group"><label>Tệp đính kèm (PDF, ảnh — tuỳ chọn)</label>' +
        '<input type="file" class="form-input" id="mAFile" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">' +
        existingAttach +
        '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" id="saveAssignBtn" onclick="saveAssignment(' + aid + ')">Lưu</button>' +
        '</div>';
      openModal(html);
    }

    function saveAssignment(id) {
      var title = document.getElementById('mATitle').value.trim();
      if (!title) { showToast('Vui lòng nhập tiêu đề.', 'error'); return; }
      var fileInput = document.getElementById('mAFile');
      var file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

      var selClassId = document.getElementById('mAClass').value;
      var selClass = classes.find(function (c) { return c.id === selClassId; });
      if (!selClass) { showToast('Vui lòng chọn lớp (tạo lớp ở mục Lớp học nếu chưa có).', 'error'); return; }
      if (_savingAssignment) return;
      _savingAssignment = true;
      var _saveBtn = document.getElementById('saveAssignBtn');
      if (_saveBtn) { _saveBtn.disabled = true; _saveBtn.textContent = 'Đang lưu…'; }
      function _resetSaving() {
        _savingAssignment = false;
        var b = document.getElementById('saveAssignBtn');
        if (b) { b.disabled = false; b.textContent = 'Lưu'; }
      }
      var data = {
        title: title,
        classId: selClassId,
        class: selClass.name,
        subject: document.getElementById('mASubject').value,
        dueDate: document.getElementById('mADue').value,
        status: document.getElementById('mAStatus').value,
        description: document.getElementById('mADesc').value.trim(),
        teacherId: currentUser ? currentUser.id : null,
      };

      function _finishSave(attachUrl) {
        if (attachUrl !== undefined) data.attachmentUrl = attachUrl;
        if (id) {
          var a = assignments.find(function (x) { return x.id === id; });
          if (a) {
            Object.assign(a, data);
            if (_db && _dbUserId) {
              _db.from('assignments').update({
                title: a.title, subject: a.subject, class_name: a.class, class_id: a.classId || null,
                due_date: a.dueDate, status: a.status, description: a.description,
                attachment_url: a.attachmentUrl || null,
              }).eq('id', String(id)).then(function (r) { if (r.error) showToast('Lỗi lưu: ' + r.error.message, 'error'); });
            }
          }
          showToast('Đã cập nhật bài tập.', 'success');
        } else {
          data.id = nextAssignmentId++;
          data.gradesPublished = false;
          data.createdAt = new Date().toISOString().split('T')[0];
          assignments.push(data);
          if (_db && _dbUserId) {
            _db.from('assignments').insert({
              owner_id: _dbUserId, title: data.title, subject: data.subject,
              class_name: data.class, class_id: data.classId || null,
              due_date: data.dueDate, status: data.status,
              description: data.description, attachment_url: data.attachmentUrl || null,
              grades_published: false,
            }).select().then(function (r) {
              if (r.error) { showToast('Lỗi đăng bài: ' + r.error.message, 'error'); return; }
              if (r.data && r.data[0]) { data.id = r.data[0].id; renderAssignments(); }
            });
          }
          showToast('Đã giao bài tập mới.', 'success');
        }
        _savingAssignment = false;
        closeModal();
        renderAssignments();
      }

      // If a file was selected, upload first (public 'materials' bucket)
      if (file && _db) {
        var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        var path = 'assignments/' + (id || 'new') + '/' + (_dbUserId || 'anon') + '_' + Date.now() + '_' + safeName;
        _db.storage.from('materials').upload(path, file, { upsert: true })
          .then(function (r) {
            if (!r.error) {
              var pubUrl = _db.storage.from('materials').getPublicUrl(path).data.publicUrl;
              _finishSave(pubUrl || path);
            } else {
              showToast('Lỗi tải tệp đính kèm: ' + r.error.message, 'error');
              _finishSave(undefined); // save without attachment on error
            }
          })
          .catch(function (e) {
            showToast('Lỗi mạng khi tải tệp. Thử lại.', 'error');
            _resetSaving(); // mở lại nút Lưu, modal vẫn mở
          });
      } else {
        _finishSave(undefined);
      }
    }

    function openSubmitModal(assignmentId) {
      var a = assignments.find(function (x) { return x.id === assignmentId; });
      if (!a) return;
      var html = '<div class="modal-header"><h3>Nộp bài: ' + escHtml(a.title) + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-group"><label>Hình thức nộp</label>' +
        '<select class="form-select" id="mSubType" onchange="toggleSubmitFields()">' +
        '<option value="text">Văn bản</option>' +
        '<option value="file">Tệp (PDF / ảnh)</option>' +
        '</select>' +
        '</div>' +
        '<div id="subTextField" class="form-group"><label>Nội dung bài làm</label><textarea class="form-textarea" id="mSubContent" rows="6" placeholder="Nhập bài làm của bạn..."></textarea></div>' +
        '<div id="subFileField" class="form-group" style="display:none;"><label>Chọn tệp (PDF, JPG, PNG)</label><input type="file" class="form-input" id="mSubFile" accept=".pdf,.jpg,.jpeg,.png"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="saveSubmission(' + assignmentId + ')">📤 Nộp bài</button>' +
        '</div>';
      openModal(html);
    }

    function toggleSubmitFields() {
      var t = document.getElementById('mSubType').value;
      document.getElementById('subTextField').style.display = t === 'text' ? '' : 'none';
      document.getElementById('subFileField').style.display = t === 'file' ? '' : 'none';
    }

    function saveSubmission(assignmentId) {
      var type = document.getElementById('mSubType').value;
      var content = type === 'text' ? document.getElementById('mSubContent').value.trim() : '';
      var fileInput = document.getElementById('mSubFile');
      var fileName = type === 'file' && fileInput && fileInput.files[0] ? fileInput.files[0].name : null;

      if (type === 'text' && !content) { showToast('Vui lòng nhập nội dung bài làm.', 'error'); return; }
      if (type === 'file' && !fileName) { showToast('Vui lòng chọn tệp.', 'error'); return; }

      var sub = {
        id: nextSubmissionId++,
        assignmentId: assignmentId,
        studentId: currentUser ? currentUser.id : null,
        studentName: currentUser ? currentUser.name : 'Unknown',
        submittedAt: new Date().toISOString().split('T')[0],
        type: type,
        content: content || ('[file] ' + fileName),
        grade: null,
        feedback: null,
        fileUrl: null,
      };

      // Upload to Supabase Storage if file provided
      if (_db && type === 'file' && fileInput && fileInput.files[0]) {
        var file = fileInput.files[0];
        var path = 'submissions/' + assignmentId + '/' + sub.id + '_' + file.name;
        _db.storage.from('tutor-hub').upload(path, file, { upsert: true })
          .then(function (r) {
            if (r.error) {
              console.error('Storage upload failed:', r.error);
              showToast('Lỗi upload file: ' + r.error.message, 'error');
              return;
            }
            sub.fileUrl = path;
            _db.from('assignment_submissions').insert({
              assignment_id: String(assignmentId), student_id: _dbUserId,
              student_name: sub.studentName, type: type, content: sub.content,
              file_url: path, grade: null, feedback: null,
            }).then(function (r) {
              if (r.error) { console.error('Insert submission failed:', r.error); showToast('Lỗi lưu bài: ' + r.error.message, 'error'); }
              else { renderAssignments(); }
            });
          });
      } else if (_db && _dbUserId) {
        _db.from('assignment_submissions').insert({
          assignment_id: String(assignmentId), student_id: _dbUserId,
          student_name: sub.studentName, type: type, content: sub.content,
          file_url: null, grade: null, feedback: null,
        }).then(function (r) {
          if (r.error) { console.error('Insert submission failed:', r.error); showToast('Lỗi lưu bài: ' + r.error.message, 'error'); }
          else { renderAssignments(); }
        });
      }

      submissions.push(sub);
      showToast('Đã nộp bài thành công!', 'success');
      closeModal();
      renderAssignments();
    }

    function openSubmissionsView(assignmentId) {
      var a = assignments.find(function (x) { return x.id === assignmentId; });
      if (!a) return;
      var subs = submissions.filter(function (s) { return s.assignmentId === assignmentId; });
      var aid = JSON.stringify(assignmentId);
      var rows = subs.length ? subs.map(function (s) {
        var sid = JSON.stringify(s.id);
        var gradeCell = '<input type="number" min="0" max="10" step="0.1" placeholder="0–10" style="width:64px;border:1px solid var(--border);border-radius:6px;padding:3px 6px;font-size:13px;" id="grade-' + s.id + '" value="' + (s.grade !== null ? s.grade : '') + '">';
        var fbCell = '<input type="text" placeholder="Nhận xét..." style="width:140px;border:1px solid var(--border);border-radius:6px;padding:3px 6px;font-size:13px;" id="fb-' + s.id + '" value="' + escHtml(s.feedback || '') + '">';
        // Content cell: show file link if available
        var contentCell = s.type === 'file' && s.fileUrl
          ? '<a href="' + escHtml(s.fileUrl) + '" target="_blank" rel="noopener" class="btn btn-sm btn-ghost" style="font-size:12px;">📎 Tải xuống</a>'
          : '<span style="max-width:180px;display:inline-block;font-size:12px;color:var(--text-muted);" title="' + escHtml(s.content) + '">' + escHtml((s.content || '').slice(0, 80)) + '</span>';
        return '<tr>' +
          '<td>' + escHtml(s.studentName) + '</td>' +
          '<td style="font-size:12px;">' + escHtml(s.submittedAt) + '</td>' +
          '<td><span class="badge ' + (s.type === 'file' ? 'badge-info' : 'badge-success') + '">' + (s.type === 'file' ? '📎 Tệp' : '📝 Văn bản') + '</span></td>' +
          '<td>' + contentCell + '</td>' +
          '<td>' + gradeCell + '</td>' +
          '<td>' + fbCell + '</td>' +
          '<td><button class="btn btn-sm btn-primary" onclick="saveGrade(' + sid + ')">Lưu</button></td>' +
          '</tr>';
      }).join('') : '<tr><td colspan="7" class="empty">Chưa có bài nộp.</td></tr>';

      var pubBtn = a.gradesPublished
        ? '<span class="badge badge-info">📢 Điểm đã công bố</span>'
        : '<button class="btn btn-primary" onclick="publishGrades(' + aid + ');closeModal()">📢 Công bố điểm cho học sinh</button>';

      var html = '<div class="modal-header"><h3>Bài nộp: ' + escHtml(a.title) + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body" style="max-height:60vh;overflow-y:auto;">' +
        '<table><thead><tr><th>Học sinh</th><th>Ngày nộp</th><th>Loại</th><th>Nội dung</th><th>Điểm (0–10)</th><th>Nhận xét</th><th></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table>' +
        '</div>' +
        '<div class="modal-footer" style="gap:8px;">' +
        pubBtn +
        '<button class="btn btn-ghost" onclick="closeModal()">Đóng</button>' +
        '</div>';
      openModal(html, 'modal-lg');
    }

    function saveGrade(submissionId) {
      var s = submissions.find(function (x) { return x.id === submissionId; });
      if (!s) return;
      var gradeVal = parseFloat(document.getElementById('grade-' + submissionId).value);
      var fbVal = document.getElementById('fb-' + submissionId).value.trim();
      s.grade = isNaN(gradeVal) ? null : gradeVal;
      s.feedback = fbVal || null;
      showToast('Đã lưu điểm cho ' + s.studentName, 'success');
      if (_db && _dbUserId) {
        _db.from('assignment_submissions').update({ grade: s.grade, feedback: s.feedback })
          .eq('id', String(submissionId)).then(function (r) {
            if (r.error) { console.error('Save grade failed:', r.error); showToast('Lỗi lưu điểm: ' + r.error.message, 'error'); }
          });
      }
    }

    function publishGrades(assignmentId) {
      var a = assignments.find(function (x) { return x.id === assignmentId; });
      if (!a) return;
      a.gradesPublished = true;
      showToast('Điểm đã được công bố cho học sinh!', 'success');
      renderAssignments();
      if (_db) {
        _db.from('assignments').update({ grades_published: true })
          .eq('id', String(assignmentId))
          .then(function (r) { if (r.error) console.warn('publish grades', r.error.message); });
      }
    }

    // ── ASSIGNMENT COMMENTS ───────────────────────────────────────
    function openCommentsModal(assignmentId) {
      var a = assignments.find(function (x) { return x.id === assignmentId; });
      if (!a) return;
      var aid = JSON.stringify(assignmentId);
      function _commentsHtml() {
        var cmts = assignmentComments.filter(function (c) { return c.assignmentId === assignmentId; });
        if (!cmts.length) return '<div style="color:var(--text-muted);font-size:13px;padding:12px 0;">Chưa có bình luận nào. Hãy là người đầu tiên!</div>';
        return cmts.map(function (c) {
          var isOwn = currentUser && (c.userId === _dbUserId || c.userName === currentUser.name);
          var delBtn = isOwn ? ' <button onclick="deleteComment(' + JSON.stringify(c.id) + ',' + aid + ')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:11px;" title="Xóa">✕</button>' : '';
          return '<div style="padding:10px 0;border-bottom:1px solid var(--border);">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
            '<strong style="font-size:13px;">' + escHtml(c.userName) + '</strong>' +
            '<span style="font-size:11px;color:var(--text-muted);">' + escHtml(c.createdAt) + delBtn + '</span>' +
            '</div>' +
            '<div style="font-size:14px;">' + escHtml(c.content) + '</div>' +
            '</div>';
        }).join('');
      }
      function _rebuildModal() {
        var content = document.getElementById('modalContent');
        if (!content) return;
        var inputHtml = currentUser ?
          '<div style="display:flex;gap:8px;margin-top:12px;">' +
          '<input class="form-input" id="cmtInput" placeholder="Nhập bình luận..." style="flex:1;" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();postComment(' + aid + ');}">' +
          '<button class="btn btn-primary" onclick="postComment(' + aid + ')">Gửi</button>' +
          '</div>' : '';
        content.querySelector('#cmtList').innerHTML = _commentsHtml();
        content.querySelector('#cmtForm').innerHTML = inputHtml;
      }
      var html = '<div class="modal-header"><h3>💬 Thảo luận: ' + escHtml(a.title) + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body" style="max-height:60vh;overflow-y:auto;">' +
        '<div id="cmtList">' + _commentsHtml() + '</div>' +
        '</div>' +
        '<div class="modal-footer" style="flex-direction:column;align-items:stretch;">' +
        '<div id="cmtForm">' +
        (currentUser ?
          '<div style="display:flex;gap:8px;">' +
          '<input class="form-input" id="cmtInput" placeholder="Nhập bình luận..." style="flex:1;" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();postComment(' + aid + ');}">' +
          '<button class="btn btn-primary" onclick="postComment(' + aid + ')">Gửi</button>' +
          '</div>' : ''
        ) +
        '</div>' +
        '</div>';
      openModal(html);
    }

    function postComment(assignmentId) {
      var inp = document.getElementById('cmtInput');
      var text = inp ? inp.value.trim() : '';
      if (!text) return;
      var cmt = {
        id: nextCommentId++,
        assignmentId: assignmentId,
        userId: _dbUserId || null,
        userName: currentUser ? currentUser.name : 'Unknown',
        content: text,
        createdAt: new Date().toISOString().split('T')[0],
      };
      assignmentComments.push(cmt);
      if (inp) inp.value = '';
      // Refresh modal comment list
      var cmtList = document.getElementById('cmtList');
      if (cmtList) {
        var cmts = assignmentComments.filter(function (c) { return c.assignmentId === assignmentId; });
        var aid = JSON.stringify(assignmentId);
        cmtList.innerHTML = cmts.map(function (c) {
          var isOwn = currentUser && (c.userId === _dbUserId || c.userName === currentUser.name);
          var delBtn = isOwn ? ' <button onclick="deleteComment(' + JSON.stringify(c.id) + ',' + aid + ')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:11px;" title="Xóa">✕</button>' : '';
          return '<div style="padding:10px 0;border-bottom:1px solid var(--border);">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
            '<strong style="font-size:13px;">' + escHtml(c.userName) + '</strong>' +
            '<span style="font-size:11px;color:var(--text-muted);">' + escHtml(c.createdAt) + delBtn + '</span>' +
            '</div>' +
            '<div style="font-size:14px;">' + escHtml(c.content) + '</div>' +
            '</div>';
        }).join('') || '<div style="color:var(--text-muted);font-size:13px;">Chưa có bình luận.</div>';
      }
      renderAssignments(); // refresh badge counts
      if (_db && _dbUserId) {
        _db.from('assignment_comments').insert({
          assignment_id: String(assignmentId),
          user_id: _dbUserId,
          user_name: cmt.userName,
          content: cmt.content,
        }).then(function (r) { if (r.error) console.warn('insert comment', r.error.message); });
      }
    }

    function deleteComment(commentId, assignmentId) {
      assignmentComments = assignmentComments.filter(function (c) { return c.id !== commentId; });
      renderAssignments();
      if (_db) {
        _db.from('assignment_comments').delete().eq('id', String(commentId))
          .then(function (r) { if (r.error) console.warn('delete comment', r.error.message); });
      }
      // Reopen to refresh modal
      openCommentsModal(assignmentId);
    }

