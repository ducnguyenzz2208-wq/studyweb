    // ============================================================
    // BỘ ICON SVG (kiểu Lucide outline) — thay emoji cho chuyên nghiệp
    // Dùng chung: nav, quick-actions, topbar. currentColor để theo màu chữ.
    // ============================================================
    var SVG_ICONS = {
      dashboard: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
      students: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
      classes: '<path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01M9 12h.01M9 15h.01M9 18h.01"/>',
      assignments: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>',
      flashcards: '<rect x="3" y="5" width="13" height="15" rx="2"/><path d="M8 5V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-2"/>',
      materials: '<path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2z"/>',
      attendance: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/>',
      scores: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
      schedule: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      reports: '<path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="7"/><rect x="12" y="6" width="3" height="11"/><rect x="17" y="13" width="3" height="4"/>',
      payments: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
      'parent-portal': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      'student-portal': '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5"/><path d="M8 18h8"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      subjects: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
      // Quick actions & topbar
      'user-plus': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
      'file-plus': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 12v6M9 15h6"/>',
      'plus-square': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>',
      'folder-plus': '<path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2z"/><path d="M12 11v6M9 14h6"/>',
      book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
      help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
      moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
      menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
      info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
      'alert-triangle': '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
      pomodoro: '<path d="M10 2h4"/><path d="M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
      rotate: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
      play: '<polygon points="6 4 20 12 6 20 6 4"/>',
      pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
      skip: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>',
      skipback: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>',
      lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
      volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'
    };
    function svgIcon(name, size) {
      var p = SVG_ICONS[name] || '';
      var s = size || 18;
      return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
    }

    // Empty-state có hướng dẫn dùng chung (icon SVG + tiêu đề + gợi ý + nút hành động).
    // actionHtml: truyền chuỗi <button…> (thường chỉ cho GV/Admin) hoặc để trống.
    function emptyBlock(iconKey, title, hint, actionHtml) {
      return '<div class="empty-state">' +
        '<span class="empty-state-ic">' + svgIcon(iconKey, 26) + '</span>' +
        '<div class="empty-state-title">' + title + '</div>' +
        (hint ? '<div class="empty-state-hint">' + hint + '</div>' : '') +
        (actionHtml || '') +
        '</div>';
    }

    // Loading skeleton dùng chung (hiện khi đang tải dữ liệu từ DB).
    function skelTableRows(n, cols) {
      var h = '';
      for (var i = 0; i < (n || 6); i++) h += '<tr><td colspan="' + (cols || 6) + '" style="border:none;padding:0 12px;"><div class="skel skel-row"></div></td></tr>';
      return h;
    }
    function skelCards(n) {
      var h = '';
      for (var i = 0; i < (n || 6); i++) h += '<div class="skel skel-card"></div>';
      return '<div class="skel-cards">' + h + '</div>';
    }

    // ============================================================
    // HELP TOOLTIPS (giải thích thuật ngữ) — song ngữ vi/en
    // ============================================================
    // Mỗi mục: { label:{vi,en}, vi, en }. helpTip('key') trả ra 1 icon ⓘ có
    // chú giải hiện khi hover/focus (bàn phím). injectHelpTips() điền vào mọi
    // phần tử [data-help] trong DOM (gọi lại sau render / khi đổi ngôn ngữ).
    var GLOSSARY = {
      'enrollment-request': {
        label: { vi: 'Yêu cầu ghi danh', en: 'Enrollment request' },
        vi: 'Đề nghị của học sinh/phụ huynh xin vào một lớp. Giáo viên hoặc quản trị viên xét duyệt để thêm họ vào lớp.',
        en: 'A student/parent request to join a class. A teacher or admin approves it to add them to the class.'
      },
      'deck': {
        label: { vi: 'Bộ thẻ (deck)', en: 'Deck' },
        vi: 'Một tập hợp các thẻ ghi nhớ (flashcard) cùng chủ đề — dùng để ôn tập kiểu hỏi–đáp.',
        en: 'A set of flashcards on the same topic — used for question-and-answer style revision.'
      },
      'submission': {
        label: { vi: 'Bài nộp (submission)', en: 'Submission' },
        vi: 'Bài làm mà học sinh gửi lên cho một bài tập được giao. Giáo viên chấm điểm và nhận xét trên bài nộp.',
        en: "A student's turned-in work for an assignment. Teachers grade and give feedback on the submission."
      },
      'attendance': {
        label: { vi: 'Điểm danh', en: 'Attendance' },
        vi: 'Tỷ lệ phần trăm buổi học mà học sinh có mặt, tính từ lịch sử điểm danh từng buổi.',
        en: "The percentage of sessions a student attended, computed from per-session attendance records."
      },
      'overdue': {
        label: { vi: 'Quá hạn', en: 'Overdue' },
        vi: 'Khoản học phí chưa thanh toán và đã qua ngày đến hạn. Hệ thống tự đánh dấu để nhắc thu.',
        en: 'A tuition fee that is unpaid and past its due date. The system flags it automatically for follow-up.'
      },
      'pomodoro': {
        label: { vi: 'Pomodoro', en: 'Pomodoro' },
        vi: 'Kỹ thuật học tập trung: làm 25 phút rồi nghỉ ngắn 5 phút; sau 4 phiên thì nghỉ dài. Giúp duy trì sự tập trung.',
        en: 'A focus technique: work 25 minutes then take a 5-minute break; after 4 sessions take a longer break. Helps sustain concentration.'
      },
      'avg-score': {
        label: { vi: 'Điểm trung bình', en: 'Average score' },
        vi: 'Trung bình điểm các môn của học sinh. Điểm được đồng bộ tự động từ kết quả chấm bài trong mục Bài tập.',
        en: "The mean of a student's subject scores. Scores sync automatically from grading in the Assignments area."
      }
    };

    function helpTip(key) {
      var g = GLOSSARY[key];
      if (!g) return '';
      var lang = (typeof currentLang !== 'undefined') ? currentLang : 'vi';
      var txt = g[lang] || g.en || '';
      var lbl = (g.label && (g.label[lang] || g.label.en)) || key;
      return '<button type="button" class="help-tip" aria-label="' + escAttr(lbl + ': ' + txt) + '"' +
        ' onclick="event.preventDefault();event.stopPropagation();">' + svgIcon('info', 14) +
        '<span class="help-tip-pop" role="tooltip"><strong>' + escHtml(lbl) + '</strong>' + escHtml(txt) + '</span></button>';
    }

    // Điền tooltip vào mọi <span data-help="key"></span> đang có trong DOM.
    function injectHelpTips(root) {
      var scope = root || document;
      var nodes = scope.querySelectorAll('[data-help]');
      Array.prototype.forEach.call(nodes, function (el) {
        el.innerHTML = helpTip(el.getAttribute('data-help'));
      });
    }

    // Trạng thái LỖI dùng chung (RLS/500/mạng) — thay cho bảng trắng im lặng.
    // retryFn: tên hàm (chuỗi) để gọi lại khi bấm "Thử lại", vd 'loadDbData()'.
    function errorBlock(msg, retryFn) {
      var lang = (typeof currentLang !== 'undefined') ? currentLang : 'vi';
      var title = lang === 'en' ? "Couldn't load data" : 'Không tải được dữ liệu';
      var retryLbl = lang === 'en' ? 'Try again' : 'Thử lại';
      var btn = retryFn
        ? '<div style="margin-top:14px;"><button class="btn btn-primary" onclick="' + retryFn + '">' + retryLbl + '</button></div>'
        : '';
      return '<div class="empty-state error-state">' +
        '<span class="empty-state-ic" style="background:rgba(239,68,68,0.12);color:var(--danger);">' + svgIcon('alert-triangle', 26) + '</span>' +
        '<div class="empty-state-title">' + title + '</div>' +
        (msg ? '<div class="empty-state-hint">' + escHtml(msg) + '</div>' : '') +
        btn + '</div>';
    }

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
          { id: 'pomodoro', icon: '⏱️', key: 'nav.pomodoro' },
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
          html += '<span class="nav-icon">' + svgIcon(it.id) + '</span> ' + t(it.key);
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

