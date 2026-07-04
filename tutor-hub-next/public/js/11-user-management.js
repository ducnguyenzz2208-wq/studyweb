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
        closeModal(); showToast('Đã phân lớp cho giáo viên.', 'success');
      });
    }

    function renderUserManagement() {
      var list = document.getElementById('userMgmtList');
      if (!list) return;
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

    function loadUsersFromDb() {
      if (!_db) {
        renderUserManagement();
        showToast('Chưa kết nối Supabase.', 'warning');
        return;
      }
      showToast('Đang tải danh sách người dùng...', 'info');
      _db.from('profiles').select('id,email,name,role,created_at').order('created_at', { ascending: false })
        .then(function (r) {
          if (r.error) { showToast('Lỗi: ' + r.error.message, 'error'); return; }
          appUsers = (r.data || []).map(function (u) {
            return { id: u.id, email: u.email, name: u.name, role: u.role, createdAt: u.created_at };
          });
          renderUserManagement();
        });
    }

    function changeUserRole(userId, newRole) {
      var u = appUsers.find(function (x) { return x.id === userId; });
      if (!u) return;
      u.role = newRole;
      renderUserManagement();
      showToast((u.name || u.email) + ' → ' + newRole, 'success');
      if (_db) {
        _db.from('profiles').update({ role: newRole }).eq('id', userId)
          .then(function (r) { if (r.error) showToast('Lỗi lưu: ' + r.error.message, 'error'); });
      }
    }

