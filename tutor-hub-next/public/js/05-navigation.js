    // ============================================================
    // NAVIGATION
    // ============================================================
    var NAV_STRUCTURE = [
      {
        group: 'Main', items: [
          { id: 'dashboard', icon: '🏠', key: 'nav.dashboard' },
          { id: 'students', icon: '👨‍🎓', key: 'nav.students' },
          { id: 'classes', icon: '🏫', key: 'nav.classes' },
        ]
      },
      {
        group: 'Academic', items: [
          { id: 'assignments', icon: '📋', key: 'nav.assignments' },
          { id: 'flashcards', icon: '🃏', key: 'nav.flashcards' },
          { id: 'materials', icon: '📂', key: 'nav.materials' },
          { id: 'attendance', icon: '✅', key: 'nav.attendance' },
          { id: 'scores', icon: '🎯', key: 'nav.scores' },
          { id: 'schedule', icon: '📅', key: 'nav.schedule' },
          { id: 'reports', icon: '📊', key: 'nav.reports' },
        ]
      },
      {
        group: 'Finance', items: [
          { id: 'payments', icon: '💳', key: 'nav.payments' },
        ]
      },
      {
        group: 'Portals', items: [
          { id: 'parent-portal', icon: '👨‍👩‍👧', key: 'nav.parent-portal' },
          { id: 'student-portal', icon: '🎒', key: 'nav.student-portal' },
        ]
      },
      {
        group: 'System', items: [
          { id: 'users', icon: '👥', key: 'nav.users' },
          { id: 'subjects', icon: '📚', key: 'nav.subjects' },
          { id: 'settings', icon: '⚙️', key: 'nav.settings' },
        ]
      },
    ];

    function renderNavigation() {
      if (!currentUser) return;
      var allowed = ROLE_SECTIONS[currentUser.role] || [];
      var html = '';
      NAV_STRUCTURE.forEach(function (grp) {
        var visible = grp.items.filter(function (it) { return allowed.indexOf(it.id) !== -1; });
        if (!visible.length) return;
        html += '<div class="sidebar-section">' + grp.group + '</div>';
        visible.forEach(function (it) {
          html += '<a class="nav-item' + (currentSection === it.id ? ' active' : '') + '" onclick="showSection(\'' + it.id + '\')" href="#">';
          html += '<span class="nav-icon">' + it.icon + '</span> ' + t(it.key);
          html += '</a>';
        });
      });
      document.getElementById('navItems').innerHTML = html;
      _setAvatarEl(document.getElementById('sidebarAvatar'), currentUser);
      document.getElementById('sidebarName').textContent = currentUser.name;
      document.getElementById('sidebarRole').textContent = currentUser.role;
      _setAvatarEl(document.getElementById('topAvatar'), currentUser);
    }

    // Avatar: URL -> ảnh, ngược lại chữ cái viết tắt
    function _isAvatarUrl(v) { return !!v && /^https?:/i.test(v); }
    function _setAvatarEl(el, u) {
      if (!el || !u) return;
      if (_isAvatarUrl(u.avatar)) {
        el.innerHTML = '<img src="' + escAttr(u.avatar) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">';
        el.style.overflow = 'hidden';
      } else {
        el.textContent = u.avatar || '';
      }
    }

