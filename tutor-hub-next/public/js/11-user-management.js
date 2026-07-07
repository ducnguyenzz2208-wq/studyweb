    // ============================================================
    // NHẬP HỌC SINH TỪ EXCEL / CSV (nhanh: chỉ cần Tên, Email, Lớp)
    // Dùng SheetJS (nạp lười từ jsDelivr — đã có trong CSP). Có ô dán text
    // (dùng khi copy từ PDF/Word). Chèn vào bảng students (owner = current user).
    // ============================================================
    var _importRows = [];
    function _loadXlsx(cb) {
      if (window.XLSX) { cb(); return; }
      var s = document.getElementById('xlsx-lib');
      if (s) { s.addEventListener('load', cb); return; }
      s = document.createElement('script');
      s.id = 'xlsx-lib';
      s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      s.onload = cb;
      s.onerror = function () { showToast('Không tải được thư viện đọc Excel. Hãy dùng ô dán text.', 'error'); };
      document.head.appendChild(s);
    }
    // Nhận diện cột Tên/Email/Lớp theo tiêu đề; nếu không có tiêu đề thì theo thứ tự Tên,Email,Lớp.
    function _parseSheetAoa(aoa) {
      if (!aoa || !aoa.length) return [];
      var head = aoa[0].map(function (h) { return String(h == null ? '' : h).trim().toLowerCase(); });
      var iName = -1, iEmail = -1, iClass = -1;
      head.forEach(function (h, i) {
        if (iName < 0 && /(tên|ten|name|họ|ho ten|full ?name)/.test(h)) iName = i;
        else if (iEmail < 0 && /(e-?mail|thư)/.test(h)) iEmail = i;
        else if (iClass < 0 && /(lớp|lop|class|khối|khoi)/.test(h)) iClass = i;
      });
      var hasHeader = (iName >= 0 || iEmail >= 0 || iClass >= 0);
      var start = hasHeader ? 1 : 0;
      if (!hasHeader) { iName = 0; iEmail = 1; iClass = 2; }
      var out = [];
      for (var r = start; r < aoa.length; r++) {
        var row = aoa[r]; if (!row) continue;
        var name = String((iName >= 0 ? row[iName] : '') || '').trim();
        var email = String((iEmail >= 0 ? row[iEmail] : '') || '').trim();
        var cls = String((iClass >= 0 ? row[iClass] : '') || '').trim();
        if (!email) { for (var c = 0; c < row.length; c++) { if (String(row[c] || '').indexOf('@') !== -1) { email = String(row[c]).trim(); break; } } }
        if (!name) continue;
        out.push({ name: name, email: email, class: cls });
      }
      return out;
    }
    function openStudentImportModal() {
      if (!(currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin'))) { showToast('Chỉ GV/Admin nhập được học sinh.', 'error'); return; }
      _importRows = [];
      openModal('<div class="modal-header"><h3 style="display:flex;align-items:center;gap:8px;">' + svgIcon('user-plus', 18) + 'Nhập học sinh từ Excel / CSV</h3><button class="modal-close" onclick="closeModal()" aria-label="Đóng">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="hint">Cần 3 cột: <strong>Tên, Email, Lớp</strong> (có tiêu đề càng tốt). Hỗ trợ <strong>.xlsx / .xls / .csv</strong>. ' +
        '<a href="#" onclick="downloadImportTemplate();return false;">Tải tệp mẫu CSV</a></div>' +
        '<div class="form-group"><label for="impFile">Chọn tệp Excel/CSV</label>' +
        '<input class="form-input" type="file" id="impFile" accept=".xlsx,.xls,.csv" onchange="onImportFile(this)"></div>' +
        '<div class="form-group"><label for="impPasteBox">Hoặc dán danh sách (khi copy từ PDF/Word) — mỗi dòng: Tên, Email, Lớp</label>' +
        '<textarea class="form-textarea" id="impPasteBox" rows="4" placeholder="Nguyễn An, an@gmail.com, Toán 9A&#10;Trần Bình, binh@gmail.com, Anh 8B" oninput="onImportPaste()"></textarea></div>' +
        '<div class="form-group"><label for="impDefClass2">Lớp mặc định (khi dòng thiếu lớp)</label>' +
        '<input class="form-input" id="impDefClass2" placeholder="VD: Toán 9A"></div>' +
        '<div id="impPreview2" style="font-size:13px;"></div>' +
        '</div><div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" id="impDoBtn" onclick="doStudentImport()" disabled>Nhập</button></div>');
    }
    function _setImportRows(rows) {
      _importRows = rows || [];
      var pv = document.getElementById('impPreview2');
      var btn = document.getElementById('impDoBtn');
      if (btn) btn.disabled = !_importRows.length;
      if (!pv) return;
      if (!_importRows.length) { pv.innerHTML = '<span style="color:var(--text-muted);">Chưa có dòng hợp lệ (cần ít nhất Tên).</span>'; return; }
      var sample = _importRows.slice(0, 5).map(function (r) {
        return '<tr><td>' + escHtml(r.name) + '</td><td>' + escHtml(r.email || '—') + '</td><td>' + escHtml(r.class || '—') + '</td></tr>';
      }).join('');
      pv.innerHTML = '<div style="margin:6px 0;color:var(--success);font-weight:600;">Sẽ nhập ' + _importRows.length + ' học sinh:</div>' +
        '<div style="overflow-x:auto;"><table><thead><tr><th>Tên</th><th>Email</th><th>Lớp</th></tr></thead><tbody>' + sample +
        (_importRows.length > 5 ? '<tr><td colspan="3" style="color:var(--text-muted);">… và ' + (_importRows.length - 5) + ' dòng nữa</td></tr>' : '') +
        '</tbody></table></div>';
    }
    function onImportFile(input) {
      var f = input.files && input.files[0]; if (!f) return;
      _loadXlsx(function () {
        var reader = new FileReader();
        reader.onload = function (e) {
          try {
            var wb = window.XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            var ws = wb.Sheets[wb.SheetNames[0]];
            var aoa = window.XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
            _setImportRows(_parseSheetAoa(aoa));
          } catch (err) { showToast('Không đọc được tệp: ' + err.message, 'error'); }
        };
        reader.readAsArrayBuffer(f);
      });
    }
    function onImportPaste() {
      var raw = (document.getElementById('impPasteBox') || {}).value || '';
      var aoa = raw.split(/\r?\n/).map(function (line) { return line.split(/[,\t;]/).map(function (c) { return c.trim(); }); }).filter(function (r) { return r.some(function (c) { return c; }); });
      // Không có tiêu đề khi dán → coi như Tên,Email,Lớp theo thứ tự
      _setImportRows(_parseSheetAoa([['tên', 'email', 'lớp']].concat(aoa)));
    }
    function downloadImportTemplate() {
      var csv = '﻿' + 'Tên,Email,Lớp\r\nNguyễn An,an@gmail.com,Toán 9A\r\nTrần Bình,binh@gmail.com,Anh 8B\r\n';
      if (typeof _downloadText === 'function') _downloadText('mau-nhap-hoc-sinh.csv', csv, 'text/csv');
    }
    function doStudentImport() {
      if (!_db || !_dbUserId) { showToast('Chưa kết nối tài khoản.', 'error'); return; }
      if (!_importRows.length) { showToast('Chưa có dữ liệu để nhập.', 'error'); return; }
      var def = ((document.getElementById('impDefClass2') || {}).value || '').trim();
      var payload = _importRows.map(function (r) {
        return { owner_id: _dbUserId, name: r.name, email: r.email || null, class_name: r.class || def || '', math_score: 0, eng_score: 0, attendance: 0 };
      });
      showBusy('Đang nhập ' + payload.length + ' học sinh…');
      _db.from('students').insert(payload).select().then(function (res) {
        hideBusy();
        if (res.error) { showToast('Lỗi nhập: ' + res.error.message, 'error'); return; }
        var n = (res.data || []).length;
        if (typeof students !== 'undefined') (res.data || []).forEach(function (s) { try { students.push(_mapStudentRow(s)); } catch (e) { } });
        closeModal();
        showToast('Đã nhập ' + n + ' học sinh.', 'success');
        try { logAudit('import_students', 'student', 'Nhập ' + n + ' học sinh từ tệp'); } catch (e) { }
        try { if (currentSection === 'students') renderStudents(); } catch (e) { }
        var kpi = document.getElementById('kpiStudents'); if (kpi && typeof students !== 'undefined') kpi.textContent = students.length;
      });
    }

    // ============================================================
    // USER MANAGEMENT (Admin + Teacher)
    // ============================================================
    function openAddMemberToClass() {
      var cls = _classesForFeed();
      if (!cls.length) { showToast('Chưa có lớp. Tạo lớp ở mục Lớp học trước.', 'error'); return; }
      var opts = cls.map(function (c) { return '<option value="' + escAttr(c.id) + '">' + escHtml(c.name) + '</option>'; }).join('');
      var html = '<div class="modal-header"><h3>Thêm học sinh vào lớp</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-group"><label>Lớp</label><select class="form-select" id="amClass">' + opts + '</select></div>' +
        '<div class="form-group"><label>Email tài khoản học sinh</label><input class="form-input" id="amEmail" placeholder="hs@email.com"></div>' +
        '<div class="hint">Học sinh phải có tài khoản đăng nhập với email này.</div>' +
        '</div><div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="addMemberToClass()">Thêm</button></div>';
      openModal(html);
    }

    function addMemberToClass() {
      var classId = (document.getElementById('amClass') || {}).value || '';
      var email = ((document.getElementById('amEmail') || {}).value || '').trim();
      if (!classId || !email) { showToast('Chọn lớp và nhập email.', 'error'); return; }
      if (!_db) return;
      _db.rpc('add_class_member', { _class_id: classId, _email: email }).then(function (r) {
        if (r.error) { showToast('Lỗi: ' + r.error.message, 'error'); return; }
        if (r.data === 'no_user') { showToast('Không tìm thấy tài khoản với email này.', 'error'); return; }
        if (r.data === 'not_owner') { showToast('Bạn không có quyền với lớp này.', 'error'); return; }
        closeModal(); showToast('Đã thêm học sinh vào lớp.', 'success');
        if (currentSection === 'assignments') renderAssignments();
      });
    }

    function openAssignClassModal(teacherId, teacherName) {
      var cls = _classesForFeed(); // admin thấy tất cả lớp thật
      if (!cls.length) { showToast('Chưa có lớp nào. Tạo lớp ở mục Lớp học.', 'error'); return; }
      var opts = cls.map(function (c) { return '<option value="' + escAttr(c.id) + '">' + escHtml(c.name) + '</option>'; }).join('');
      var html = '<div class="modal-header"><h3>Phân lớp cho: ' + escHtml(teacherName) + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-group"><label>Chọn lớp giao cho giáo viên này</label><select class="form-select" id="acClass">' + opts + '</select></div>' +
        '<div class="hint">Giáo viên sẽ phụ trách lớp: đăng bài, duyệt học sinh, chấm điểm.</div>' +
        '</div><div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="assignClassTeacher(' + qid(teacherId) + ')">Phân lớp</button></div>';
      openModal(html);
    }

    function assignClassTeacher(teacherId) {
      var classId = (document.getElementById('acClass') || {}).value;
      if (!classId) { showToast('Chọn lớp.', 'error'); return; }
      if (!_db) return;
      _db.from('classes').update({ owner_id: teacherId }).eq('id', String(classId)).then(function (r) {
        if (r.error) { showToast('Lỗi phân lớp: ' + r.error.message, 'error'); return; }
        var tName = (appUsers.find(function (u) { return u.id === teacherId; }) || {}).name || teacherId;
        var cName = (classes.find(function (c) { return String(c.id) === String(classId); }) || {}).name || classId;
        try { logAudit('assign_class', 'class', 'Phân lớp "' + cName + '" cho GV ' + tName); } catch (e) { }
        closeModal(); showToast('Đã phân lớp cho giáo viên.', 'success');
      });
    }

    // ── NHẬT KÝ HOẠT ĐỘNG (audit log) — chỉ Admin ────────────────
    var _AUDIT_LABEL = {
      role_change: 'Đổi vai trò', assign_class: 'Phân lớp', payment_create: 'Tạo học phí',
      payment_paid: 'Đánh dấu đã thu', sample_load: 'Nạp dữ liệu mẫu', sample_clear: 'Xoá dữ liệu mẫu',
      remind_payments: 'Nhắc học phí', remind_homework: 'Nhắc nộp bài', export: 'Xuất báo cáo'
    };
    function openAuditLog() {
      if (!(currentUser && currentUser.role === 'Admin')) { showToast('Chỉ admin xem được nhật ký.', 'error'); return; }
      if (!_db) { showToast('Chưa kết nối.', 'error'); return; }
      openModal('<div class="modal-header"><h3 style="display:flex;align-items:center;gap:8px;">' + svgIcon('reports', 18) + 'Nhật ký hoạt động</h3><button class="modal-close" onclick="closeModal()" aria-label="Đóng">✕</button></div>' +
        '<div class="modal-body" id="auditBody"><div class="skel skel-row"></div><div class="skel skel-row"></div><div class="skel skel-row"></div></div>', 'modal-lg');
      _db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100).then(function (r) {
        var box = document.getElementById('auditBody');
        if (!box) return;
        if (r.error) { box.innerHTML = errorBlock(_dbErrMsg(r.error), null); return; }
        var rows = r.data || [];
        if (!rows.length) { box.innerHTML = '<div class="empty" style="padding:20px;">Chưa có hoạt động nào được ghi.</div>'; return; }
        box.innerHTML = '<div style="overflow-x:auto;"><table><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Chi tiết</th></tr></thead><tbody>' +
          rows.map(function (a) {
            var when = (a.created_at || '').replace('T', ' ').slice(0, 16);
            return '<tr><td style="white-space:nowrap;font-size:12px;color:var(--text-muted);">' + escHtml(when) + '</td>' +
              '<td>' + escHtml(a.actor_name || '—') + '<div style="font-size:11px;color:var(--text-muted);">' + escHtml(a.actor_role || '') + '</div></td>' +
              '<td><span class="badge badge-info">' + escHtml(_AUDIT_LABEL[a.action] || a.action) + '</span></td>' +
              '<td style="font-size:13px;">' + escHtml(a.detail || '') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      });
    }

    function renderUserManagement() {
      var list = document.getElementById('userMgmtList');
      if (!list) return;
      // Nút "Nhật ký" chỉ hiện cho Admin
      var auditBtn = document.getElementById('auditLogBtn');
      if (auditBtn) auditBtn.style.display = (currentUser && currentUser.role === 'Admin') ? '' : 'none';
      if (!appUsers.length) {
        list.innerHTML = '<tr><td colspan="5" class="empty">' + t('users.noUsers') + '</td></tr>';
        return;
      }
      var roleBadgeMap = { Admin: 'badge-danger', Teacher: 'badge-info', Student: 'badge-success', Parent: 'badge-warning', Pending: 'badge-warning' };
      var iAmAdmin = currentUser && currentUser.role === 'Admin';
      list.innerHTML = appUsers.map(function (u) {
        var actionCell;
        if (u.id === _dbUserId) {
          actionCell = '<span class="badge ' + (roleBadgeMap[u.role] || '') + '">' + escHtml(u.role) + ' (bạn)</span>';
        } else if (iAmAdmin) {
          actionCell = '<select class="filter-select" style="padding:4px 8px;font-size:12px;" onchange="changeUserRole(\'' + u.id + '\',this.value)">' +
            ['Student', 'Teacher', 'Admin'].map(function (r) {
              return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' +
                ({ Student: 'Học sinh', Teacher: 'Giáo viên', Admin: 'Admin phụ' }[r] || r) + '</option>';
            }).join('') +
            '</select>';
          if (u.role === 'Teacher') {
            actionCell += ' <button class="btn btn-sm btn-ghost" onclick="openAssignClassModal(' + qid(u.id) + ',' + qid(u.name || u.email) + ')">🏫 Phân lớp</button>';
          }
        } else {
          actionCell = '<span style="font-size:12px;color:var(--text-muted);">Chỉ admin đổi vai trò</span>';
        }
        return '<tr>' +
          '<td>' + escHtml(u.name || '—') + '</td>' +
          '<td style="font-size:12px;color:var(--text-muted);">' + escHtml(u.email) + '</td>' +
          '<td><span class="badge ' + (roleBadgeMap[u.role] || '') + '">' + escHtml(u.role) + '</span></td>' +
          '<td style="font-size:12px;">' + escHtml((u.createdAt || '').split('T')[0]) + '</td>' +
          '<td>' + actionCell + '</td>' +
          '</tr>';
      }).join('');
    }

    function _mapUserRow(u) { return { id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.created_at }; }
    function loadUsersFromDb() {
      if (!_db) {
        renderUserManagement();
        showToast('Chưa kết nối Supabase.', 'warning');
        return;
      }
      showToast('Đang tải danh sách người dùng...', 'info');
      // Ưu tiên RPC admin_list_users → thấy CẢ tài khoản chưa có profile (chờ duyệt
      // bị thiếu profile). Nếu chưa chạy migration 024 thì fallback đọc bảng profiles.
      _db.rpc('admin_list_users').then(function (r) {
        if (r.error || !r.data) { _loadUsersFallback(); return; }
        appUsers = r.data.map(_mapUserRow);
        renderUserManagement();
      });
    }
    function _loadUsersFallback() {
      _db.from('profiles').select('id,email,name,role,created_at').order('created_at', { ascending: false })
        .then(function (r) {
          if (r.error) { showToast('Lỗi: ' + r.error.message, 'error'); return; }
          appUsers = (r.data || []).map(_mapUserRow);
          renderUserManagement();
        });
    }

    function changeUserRole(userId, newRole) {
      var u = appUsers.find(function (x) { return x.id === userId; });
      if (!u) return;
      u.role = newRole;
      renderUserManagement();
      if (!_db) return;
      // admin_set_role: đổi vai trò + TẠO profile nếu chưa có. Fallback update profiles.
      _db.rpc('admin_set_role', { _user_id: userId, _role: newRole }).then(function (r) {
        if (r.error) {
          _db.from('profiles').update({ role: newRole }).eq('id', userId).then(function (r2) {
            if (r2.error) { showToast('Lỗi lưu: ' + r2.error.message, 'error'); return; }
            showToast((u.name || u.email) + ' → ' + newRole, 'success');
            try { logAudit('role_change', 'user', (u.name || u.email) + ' → ' + newRole); } catch (e) { }
          });
          return;
        }
        if (r.data === 'not_admin') { showToast('Chỉ admin đổi được vai trò.', 'error'); return; }
        if (r.data === 'no_user') { showToast('Không tìm thấy tài khoản.', 'error'); return; }
        showToast((u.name || u.email) + ' → ' + newRole, 'success');
        try { logAudit('role_change', 'user', (u.name || u.email) + ' → ' + newRole); } catch (e) { }
      });
    }

