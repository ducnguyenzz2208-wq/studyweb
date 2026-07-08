    // ============================================================
    // AUTH FUNCTIONS
    // ============================================================
    function tryLogin() {
      var email = document.getElementById('loginEmail').value.trim();
      var pw = document.getElementById('loginPw').value;
      var err = document.getElementById('loginError');
      var user = mockUsers.find(function (u) { return u.email === email && u.password === pw; });
      if (!user) {
        err.textContent = t('login.error');
        err.style.display = 'block';
        return;
      }
      err.style.display = 'none';
      currentUser = user;
      showApp();
    }

    function quickLogin(email) {
      var user = mockUsers.find(function (u) { return u.email === email; });
      if (!user) return;
      currentUser = user;
      document.getElementById('loginEmail').value = email;
      document.getElementById('loginPw').value = '123456';
      document.getElementById('loginError').style.display = 'none';
      showApp();
    }

    function switchToUser(userId) {
      var user = mockUsers.find(function (u) { return u.id === userId; });
      if (!user) return;
      currentUser = user;
      closeProfilePanel();
      showApp();
    }

    function changePassword() {
      var newPw = (document.getElementById('settingNewPw') || {}).value || '';
      var confirmPw = (document.getElementById('settingConfirmPw') || {}).value || '';
      if (!newPw) { showToast('Vui lòng nhập mật khẩu mới.', 'error'); return; }
      if (newPw.length < 6) { showToast('Mật khẩu phải từ 6 ký tự trở lên.', 'error'); return; }
      if (newPw !== confirmPw) { showToast('Mật khẩu xác nhận không khớp.', 'error'); return; }
      if (!_db) { showToast('Chức năng này yêu cầu kết nối Database.', 'error'); return; }

      _db.auth.updateUser({ password: newPw }).then(function (r) {
        if (r.error) {
          showToast('Đổi mật khẩu thất bại: ' + r.error.message, 'error');
        } else {
          showToast('Đổi mật khẩu thành công!', 'success');
          if (document.getElementById('settingNewPw')) document.getElementById('settingNewPw').value = '';
          if (document.getElementById('settingConfirmPw')) document.getElementById('settingConfirmPw').value = '';
        }
      });
    }

    function logout() {
      currentUser = null;
      closeProfilePanel();
      Object.keys(reportCharts).forEach(function (k) { if (reportCharts[k]) { reportCharts[k].destroy(); delete reportCharts[k]; } });

      // Running inside Next.js wrapper — let the parent handle sign-out
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'TUTOR_HUB_LOGOUT' }, window.location.origin);
        return;
      }

      // Standalone fallback: show local login screen
      document.getElementById('sidebar').style.display = 'none';
      document.getElementById('main').style.display = 'none';
      document.getElementById('loginScreen').style.display = 'flex';
      document.getElementById('loginEmail').value = '';
      document.getElementById('loginPw').value = '';
    }

    function showApp() {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('sidebar').style.display = 'flex';
      document.getElementById('main').style.display = 'block';
      renderNavigation();
      updateNotifBadge();
      // init section: restore the last tab on reload.
      // The iframe reloads without its hash, so localStorage is the real source;
      // hash is only meaningful for in-session back/forward navigation.
      var hashSection = window.location.hash.replace(/^#/, '');
      var savedSection = '';
      try { savedSection = localStorage.getItem('th_section') || ''; } catch (e) { }
      var pref = hashSection || savedSection;
      var defaultSection = DEFAULT_SECTION[currentUser.role] || 'dashboard';
      var first = (pref && canAccessSection(pref)) ? pref : defaultSection;
      // Học sinh: luôn mở Cổng học sinh khi khởi tạo (bỏ qua tab đã lưu) — đây là
      // màn hình chính của các em, tránh rơi vào Cài đặt/Bài tập sau khi tải lại.
      if (currentUser.role === 'Student') first = 'student-portal';
      showSection(first);
      // Khôi phục trạng thái công tắc thông báo (Cài đặt) đã lưu — không mất khi tải lại.
      try { restoreNotifPrefs(); } catch (e) { }
      renderWelcome();
      if (currentUser.role === 'Teacher' || currentUser.role === 'Admin') {
        try { renderDashboard(); } catch (e) { }
        renderStudents();
      }
      populateSubjectDropdowns();
      populateClassDropdowns();
      setTimeout(maybeShowWelcome, 400);
    }

    function canAccessSection(id) {
      if (!currentUser) return false;
      var allowed = ROLE_SECTIONS[currentUser.role] || [];
      return allowed.indexOf(id) !== -1;
    }

