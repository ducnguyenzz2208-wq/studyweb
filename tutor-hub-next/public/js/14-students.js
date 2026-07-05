    // ============================================================
    // STUDENTS
    // ============================================================
    // ── Nhập học viên hàng loạt (CSV / dán danh sách) ───────────
    function openImportStudentsModal() {
      var classOpts = classes.map(function (c) { return '<option value="' + escAttr(c.name) + '">' + escHtml(c.name) + '</option>'; }).join('');
      var html = '<div class="modal-header"><h3>📥 Nhập học viên hàng loạt</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="hint">Mỗi dòng 1 học viên, các cột cách nhau bằng dấu phẩy:<br><strong>Tên, Lớp (tuỳ chọn), Email (tuỳ chọn)</strong><br>VD: <code>Nguyễn An, Math A, an@gmail.com</code></div>' +
        '<div class="form-group"><label>Lớp mặc định (khi dòng không ghi lớp)</label><select class="form-select" id="impDefClass">' + (classOpts || '<option value="">(chưa có lớp)</option>') + '</select></div>' +
        '<div class="form-group"><label>Danh sách</label><textarea class="form-textarea" id="impText" rows="8" placeholder="Nguyễn An, Math A, an@gmail.com&#10;Trần Bình, Math B&#10;Lê Cường" oninput="_previewImport()"></textarea></div>' +
        '<div id="impPreview" style="font-size:13px;color:var(--text-muted);"></div>' +
        '</div><div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="doImportStudents()">Nhập</button></div>';
      openModal(html);
    }

    function _parseImportLines() {
      var raw = (document.getElementById('impText') || {}).value || '';
      var def = (document.getElementById('impDefClass') || {}).value || '';
      var rows = [];
      raw.split(/\r?\n/).forEach(function (line) {
        line = line.trim();
        if (!line) return;
        var parts = line.split(/[,\t]/).map(function (p) { return p.trim(); });
        if (!parts[0]) return;
        rows.push({ name: parts[0], class: parts[1] || def, email: parts[2] || '' });
      });
      return rows;
    }

    function _previewImport() {
      var rows = _parseImportLines();
      var el = document.getElementById('impPreview');
      if (el) el.textContent = rows.length ? ('Sẽ nhập ' + rows.length + ' học viên.') : 'Chưa có dòng hợp lệ.';
    }

    function doImportStudents() {
      if (!_db || !_dbUserId) { showToast('Chưa kết nối tài khoản.', 'error'); return; }
      var rows = _parseImportLines();
      if (!rows.length) { showToast('Chưa có dòng hợp lệ (cần ít nhất tên).', 'error'); return; }
      var payload = rows.map(function (r) {
        return { owner_id: _dbUserId, name: r.name, email: r.email || null, class_name: r.class || '', math_score: 0, eng_score: 0, attendance: 0 };
      });
      _db.from('students').insert(payload).select().then(function (res) {
        if (res.error) { showToast('Lỗi nhập: ' + res.error.message, 'error'); return; }
        (res.data || []).forEach(function (s) { students.push(_mapStudentRow(s)); });
        closeModal();
        showToast('Đã nhập ' + (res.data ? res.data.length : rows.length) + ' học viên.', 'success');
        renderStudents();
        var kpi = document.getElementById('kpiStudents'); if (kpi) kpi.textContent = students.length;
      });
    }

    function _studentRow(s, colorIdx) {
      var avg2 = avgScore(s);
      var g = getGrade(avg2);
      var status = s.attendance >= 85 ? '<span class="badge badge-success">Tích cực</span>' :
        s.attendance >= 70 ? '<span class="badge badge-warning">Cần chú ý</span>' :
          '<span class="badge badge-danger">Báo động</span>';
      var isTA = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      var canEdit = isTA && editMode;
      var actBtns = '';
      if (canEdit) actBtns += '<button class="btn btn-sm btn-ghost" onclick="openStudentModal(' + qid(s.id) + ')">✏️</button> <button class="btn btn-sm btn-danger" onclick="deleteStudent(' + qid(s.id) + ')">🗑</button> ';
      if (isTA) actBtns += '<button class="btn btn-sm btn-ghost" onclick="openStudentComments(' + qid(s.id) + ')" title="Nhận xét học viên">💬</button>';
      var actions = isTA ? '<td style="white-space:nowrap;">' + actBtns + '</td>' : (editMode ? '<td></td>' : '');
      var nameHtml = isTA
        ? '<span onclick="openStudentComments(' + qid(s.id) + ')" style="cursor:pointer;" title="Xem/thêm nhận xét">' + escHtml(s.name) + '</span>'
        : escHtml(s.name);
      return '<tr>' +
        '<td><div class="student-row">' +
        '<div class="avatar" style="background:' + COLORS[colorIdx % 12] + '">' + getInitials(s.name) + '</div>' +
        '<div><div style="font-weight:600;font-size:14px">' + nameHtml + '</div><div style="color:var(--text-muted);font-size:12px">ID: STU-' + String(s.id).padStart(3, '0') + '</div></div>' +
        '</div></td>' +
        '<td><span class="badge badge-info">' + escHtml(s.class) + '</span></td>' +
        '<td>' + s.attendance + '%</td>' +
        '<td>' + avg2 + '</td>' +
        '<td><span class="' + gradeClass(g) + '">' + g + '</span></td>' +
        '<td>' + status + '</td>' +
        actions +
        '</tr>';
    }

    // Empty state cho bảng học sinh: phân biệt "chưa có dữ liệu" và "không khớp bộ lọc".
    function _studentsEmptyRow() {
      var canAdd = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      if (students.length === 0) {
        var cta = canAdd
          ? '<div style="margin-top:12px;"><button class="btn btn-primary" onclick="openStudentModal()">＋ Thêm học sinh đầu tiên</button></div>'
          : '';
        return '<tr><td colspan="7" style="padding:36px 16px;text-align:center;color:var(--text-muted);">' +
          '<div style="font-size:34px;margin-bottom:8px;">👨‍🎓</div>' +
          '<div style="font-weight:600;color:var(--text);margin-bottom:4px;">Chưa có học sinh nào</div>' +
          '<div style="font-size:13px;">Thêm học sinh để bắt đầu quản lý lớp học của bạn.</div>' +
          cta + '</td></tr>';
      }
      return '<tr><td colspan="7" class="empty">Không tìm thấy học sinh phù hợp với bộ lọc.</td></tr>';
    }

    function renderStudents() {
      var q = (document.getElementById('studentSearch').value || '').toLowerCase();
      var cls = document.getElementById('classFilter').value;
      var grade = document.getElementById('gradeFilter').value;
      var list = students.filter(function (s) {
        var g = getGrade(avgScore(s));
        return (!q || s.name.toLowerCase().includes(q)) &&
          (!cls || s.class === cls) &&
          (!grade || g === grade);
      });
      var tbody = document.getElementById('studentTableBody');
      if (!tbody) return;

      // When a specific class is selected, show flat list; otherwise group by class
      if (cls) {
        tbody.innerHTML = list.map(function (s, i) { return _studentRow(s, i); }).join('') ||
          _studentsEmptyRow();
        return;
      }

      // Group by class name
      var groups = {};
      var groupOrder = [];
      list.forEach(function (s) {
        if (!groups[s.class]) { groups[s.class] = []; groupOrder.push(s.class); }
        groups[s.class].push(s);
      });
      // Preserve insertion order, deduplicate
      groupOrder = groupOrder.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();

      var html = '';
      var globalIdx = 0;
      groupOrder.forEach(function (className) {
        html += '<tr style="background:var(--bg);">' +
          '<td colspan="7" style="padding:8px 16px;font-weight:700;font-size:12px;color:var(--text-muted);letter-spacing:0.04em;border-bottom:1px solid var(--border);">' +
          '🏫 ' + escHtml(className) + ' &nbsp;·&nbsp; ' + groups[className].length + ' học sinh' +
          '</td></tr>';
        groups[className].forEach(function (s) {
          html += _studentRow(s, globalIdx++);
        });
      });
      tbody.innerHTML = html || '<tr><td colspan="7" class="empty">Không tìm thấy học sinh.</td></tr>';
    }

    function openStudentModal(id) {
      var s = id ? students.find(function (x) { return x.id === id; }) : null;
      var title = s ? 'Sửa học sinh' : 'Thêm học sinh';
      var html = '<div class="modal-header"><h3>' + title + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-group"><label>Tra cứu tài khoản (email hoặc tên)</label>' +
        '<div style="display:flex;gap:8px;">' +
        '<input class="form-input" id="mStudentLookupInput" placeholder="email hoặc tên học sinh" style="flex:1;">' +
        '<button class="btn btn-ghost" type="button" onclick="lookupStudentEmail()">🔎 Tra cứu</button>' +
        '</div>' +
        '<div class="hint">Nhập email hoặc tên rồi bấm Tra cứu để tự điền tên &amp; email từ tài khoản đã đăng ký.</div>' +
        '<div id="mStudentLookup" style="font-size:12px;margin-top:4px;"></div></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Họ và tên</label><input class="form-input" id="mStudentName" value="' + (s ? escHtml(s.name) : '') + '"></div>' +
        '<div class="form-group"><label>Email</label><input class="form-input" id="mStudentEmail" placeholder="hocsinh@gmail.com" value="' + (s ? escAttr(s.email || '') : '') + '"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Lớp</label><select class="form-select" id="mStudentClass">' +
        classes.map(function (c) { return '<option value="' + c.name + '"' + (s && s.class === c.name ? ' selected' : '') + '>' + c.name + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="form-group"><label>Chuyên cần %</label><input class="form-input" type="number" min="0" max="100" id="mStudentAttend" value="' + (s ? s.attendance : 85) + '"></div>' +
        '</div>' +
        '<div class="form-group"><label>Liên hệ phụ huynh</label><input class="form-input" id="mStudentParent" value="' + (s ? escHtml(s.parentContact || '') : '') + '"></div>' +
        '<div class="form-group"><label>Ghi chú</label><textarea class="form-textarea" id="mStudentNotes">' + (s ? escHtml(s.notes || '') : '') + '</textarea></div>' +
        '<div class="hint" style="color:var(--text-muted);">Điểm số được đồng bộ tự động từ mục Bài tập, không nhập tay ở đây.</div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="saveStudent(' + (id ? qid(id) : 'null') + ')">Lưu</button>' +
        '</div>';
      openModal(html);
    }

    // Tra cứu tài khoản theo EMAIL (có @) hoặc TÊN → tự điền cả tên lẫn email.
    function lookupStudentEmail() {
      var q = ((document.getElementById('mStudentLookupInput') || {}).value || '').trim();
      var out = document.getElementById('mStudentLookup');
      if (!q) { showToast('Nhập email hoặc tên để tra cứu.', 'error'); return; }
      if (!_db) { showToast('Chưa kết nối.', 'error'); return; }
      if (out) out.innerHTML = '<span style="color:var(--text-muted);">Đang tra cứu…</span>';

      function _fill(acc) {
        var nameInp = document.getElementById('mStudentName');
        var emailInp = document.getElementById('mStudentEmail');
        if (nameInp && acc.name) nameInp.value = acc.name;
        if (emailInp && acc.email) emailInp.value = acc.email;
        if (out) out.innerHTML = '<span style="color:var(--success);">✓ Đã điền: <strong>' + escHtml(acc.name || '') + '</strong> — ' + escHtml(acc.email || '') + (acc.role ? ' (' + escHtml(acc.role) + ')' : '') + '</span>';
      }

      if (q.indexOf('@') !== -1) {
        _db.rpc('find_account', { _email: q }).then(function (r) {
          if (r.error) { if (out) out.innerHTML = '<span style="color:var(--danger);">Lỗi: ' + escHtml(r.error.message) + '</span>'; return; }
          if (!r.data || !r.data.length) { if (out) out.innerHTML = '<span style="color:var(--danger);">Không tìm thấy tài khoản với email này.</span>'; return; }
          _fill(r.data[0]);
        });
      } else {
        _db.rpc('find_account_by_name', { _q: q }).then(function (r) {
          if (r.error) {
            if (out) out.innerHTML = '<span style="color:var(--danger);">Chưa bật tra cứu theo tên (cần chạy migration 018) — hãy nhập email. ' + escHtml(r.error.message) + '</span>';
            return;
          }
          if (!r.data || !r.data.length) { if (out) out.innerHTML = '<span style="color:var(--danger);">Không tìm thấy tài khoản nào khớp tên này.</span>'; return; }
          _fill(r.data[0]);
          if (r.data.length > 1 && out) out.innerHTML += ' <span style="color:var(--text-muted);">(+' + (r.data.length - 1) + ' kết quả khác, đã chọn khớp nhất)</span>';
        });
      }
    }

    function saveStudent(id) {
      var name = document.getElementById('mStudentName').value.trim();
      if (!name) { showToast('Name is required.', 'error'); return; }
      // Điểm số KHÔNG nhập ở modal nữa (đồng bộ tự động từ Bài tập).
      // Sửa: giữ nguyên điểm cũ. Thêm: mặc định 0.
      var existing = id ? students.find(function (x) { return x.id === id; }) : null;
      var data = {
        name: name,
        email: ((document.getElementById('mStudentEmail') || {}).value || '').trim(),
        class: document.getElementById('mStudentClass').value,
        attendance: parseInt(document.getElementById('mStudentAttend').value) || 0,
        parentContact: document.getElementById('mStudentParent').value.trim(),
        notes: document.getElementById('mStudentNotes').value.trim(),
        mathScore: existing ? existing.mathScore : 0,
        engScore: existing ? existing.engScore : 0,
      };
      var dbRow = {
        name: data.name, email: data.email || null, class_name: data.class,
        attendance: data.attendance,
      };
      if (!existing) { dbRow.math_score = 0; dbRow.eng_score = 0; } // thêm mới → 0, để trigger cập nhật sau
      function _done(msg) {
        closeModal(); renderStudents();
        var kpi = document.getElementById('kpiStudents');
        if (kpi) kpi.textContent = students.length;
        showToast(msg, 'success');
      }
      if (id) {
        var s = students.find(function (x) { return x.id === id; });
        if (s) Object.assign(s, data);
        if (_db && _dbUserId && /-/.test(String(id))) {
          _db.from('students').update(dbRow).eq('id', String(id))
            .then(function (r) { if (r.error) showToast('Lỗi lưu HS: ' + r.error.message, 'error'); });
        }
        _done('Đã cập nhật học sinh.');
      } else if (_db && _dbUserId) {
        dbRow.owner_id = _dbUserId;
        _db.from('students').insert(dbRow).select().then(function (r) {
          if (r.error) { showToast('Lỗi thêm HS: ' + r.error.message, 'error'); return; }
          data.id = (r.data && r.data[0]) ? r.data[0].id : nextStudentId++;
          data.gender = 'M'; data.paymentStatus = 'Pending';
          students.push(data);
          _done('Đã thêm học sinh.');
        });
      } else {
        data.id = nextStudentId++;
        data.gender = 'M';
        data.paymentStatus = 'Pending';
        students.push(data);
        _done('Student added successfully.');
      }
    }

    function deleteStudent(id) {
      if (!confirm('Xóa học sinh này?')) return;
      students = students.filter(function (s) { return s.id !== id; });
      showToast('Đã xóa học sinh.', 'success');
      renderStudents();
      document.getElementById('kpiStudents').textContent = students.length;
      if (_db && /-/.test(String(id))) {
        _db.from('students').delete().eq('id', String(id))
          .then(function (r) { if (r.error) showToast('Lỗi xóa HS: ' + r.error.message, 'error'); });
      }
    }

