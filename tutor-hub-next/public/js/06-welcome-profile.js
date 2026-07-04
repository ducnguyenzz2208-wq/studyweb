    // ============================================================
    // WELCOME BLOCK & QUICK ACTIONS
    // ============================================================
    function renderWelcome() {
      var wb = document.getElementById('welcomeBlock');
      if (!wb) return;
      var hr = new Date().getHours();
      var greet = hr < 12 ? t('greeting.morning') : hr < 17 ? t('greeting.afternoon') : t('greeting.evening');
      var name = currentUser ? currentUser.name.split(' ')[0] : '';
      // "Pending HW" = bài tập đang mở (thật), không dùng mảng homework demo đã bỏ
      var pendingHw = assignments.filter(function (a) { return a.status === 'open'; }).length;
      wb.innerHTML = '<div class="welcome-block">' +
        '<div class="welcome-text"><h2>' + greet + ', ' + name + '! 👋</h2>' +
        '<p>' + new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</p></div>' +
        '<div class="welcome-stats">' +
        '<div class="welcome-stat"><div class="ws-num">' + students.length + '</div><div class="ws-lbl">' + t('welcome.stat.students') + '</div></div>' +
        '<div class="welcome-stat"><div class="ws-num">' + classes.length + '</div><div class="ws-lbl">' + t('welcome.stat.classes') + '</div></div>' +
        '<div class="welcome-stat"><div class="ws-num">' + pendingHw + '</div><div class="ws-lbl">' + t('welcome.stat.homework') + '</div></div>' +
        '</div></div>';
      renderOnboardChecklist();
      renderQuickActions();
    }

    // ── ONBOARDING CHECKLIST (Bắt đầu nhanh cho GV/Admin) ─────────
    // Tự ẩn khi làm xong hết hoặc khi người dùng bấm bỏ qua (localStorage).
    function renderOnboardChecklist() {
      var box = document.getElementById('onboardChecklist');
      if (!box) return;
      var role = currentUser ? currentUser.role : '';
      if (role !== 'Teacher' && role !== 'Admin') { box.innerHTML = ''; return; }

      var dismissed = false;
      try { dismissed = localStorage.getItem('th_onboard_done') === '1'; } catch (e) { }

      var steps = [
        { done: classes.length > 0, label: 'Tạo lớp học đầu tiên', fn: 'openClassModal()' },
        { done: students.length > 0, label: 'Thêm học sinh', fn: 'openStudentModal()' },
        { done: assignments.length > 0, label: 'Giao bài tập đầu tiên', fn: "showSection('assignments')" },
        { done: (typeof materials !== 'undefined' && materials.length > 0), label: 'Tải lên tài liệu', fn: 'openMaterialModal()' },
      ];
      var doneCount = steps.filter(function (s) { return s.done; }).length;

      // Đã xong hết hoặc đã bỏ qua → không hiện nữa.
      if (dismissed || doneCount === steps.length) { box.innerHTML = ''; return; }

      var pct = Math.round((doneCount / steps.length) * 100);
      var items = steps.map(function (s) {
        var mark = s.done
          ? '<span style="color:#10b981;font-weight:700;">✓</span>'
          : '<span style="color:var(--text-muted);">○</span>';
        var text = s.done
          ? '<span style="color:var(--text-muted);text-decoration:line-through;">' + s.label + '</span>'
          : '<a href="#" onclick="' + s.fn + ';return false;" style="color:var(--primary,#3b82f6);text-decoration:none;font-weight:600;">' + s.label + ' →</a>';
        return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;">' + mark + text + '</div>';
      }).join('');

      box.innerHTML =
        '<div style="background:var(--card,#fff);border:1px solid var(--border,#e2e8f0);border-radius:14px;padding:18px 20px;margin-bottom:18px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<strong style="font-size:15px;">🚀 Bắt đầu nhanh</strong>' +
        '<button onclick="dismissOnboard()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:13px;">Bỏ qua</button>' +
        '</div>' +
        '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Hoàn thành ' + doneCount + '/' + steps.length + ' bước để thiết lập trung tâm của bạn.</div>' +
        '<div style="height:6px;background:var(--bg,#eef2f7);border-radius:999px;overflow:hidden;margin-bottom:12px;">' +
        '<div style="height:100%;width:' + pct + '%;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:999px;"></div></div>' +
        items +
        '</div>';
    }

    function dismissOnboard() {
      try { localStorage.setItem('th_onboard_done', '1'); } catch (e) { }
      var box = document.getElementById('onboardChecklist');
      if (box) box.innerHTML = '';
    }

    // ── WELCOME MODAL (chỉ hiện lần đầu đăng nhập) ────────────────
    function maybeShowWelcome() {
      var seen = false;
      try { seen = localStorage.getItem('th_welcome_seen') === '1'; } catch (e) { }
      if (seen || !currentUser) return;
      try { localStorage.setItem('th_welcome_seen', '1'); } catch (e) { }

      var role = currentUser.role;
      var tips;
      if (role === 'Teacher' || role === 'Admin') {
        tips = ['Tạo lớp và thêm học sinh ở mục <b>Học sinh</b> / <b>Lớp học</b>.',
          'Giao bài, chấm điểm ở mục <b>Bài tập</b> — điểm tự đồng bộ.',
          'Theo dõi lịch, điểm danh và học phí ở các mục tương ứng.'];
      } else if (role === 'Student') {
        tips = ['Xem bài tập và nộp bài ở mục <b>Bài tập</b>.',
          'Ôn tập với <b>Flashcards</b> và tải <b>Tài liệu</b>.',
          'Xem lịch học của bạn ở mục <b>Lịch</b>.'];
      } else {
        tips = ['Theo dõi tiến độ của con ở <b>Cổng phụ huynh</b>.',
          'Xem <b>Lịch</b> học và <b>Học phí</b>.',
          'Tải <b>Tài liệu</b> khi cần.'];
      }
      var list = tips.map(function (x) { return '<li style="margin-bottom:8px;line-height:1.5;">' + x + '</li>'; }).join('');
      openModal(
        '<div class="modal-header"><h3>👋 Chào mừng đến Tutor Hub!</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<p style="color:var(--text-muted);margin-bottom:14px;">Vài điều bạn có thể làm ngay:</p>' +
        '<ul style="padding-left:20px;margin:0 0 8px;">' + list + '</ul>' +
        '<p style="color:var(--text-muted);font-size:13px;margin-top:14px;">Cần trợ giúp? Bấm nút <b>❓</b> ở góc trên bất cứ lúc nào.</p>' +
        '</div>' +
        '<div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Bắt đầu</button></div>',
        'modal-sm'
      );
    }

    // ── HELP / FAQ ────────────────────────────────────────────────
    function openHelp() {
      var faqs = [
        ['Tài khoản mới của tôi chưa vào được?', 'Tài khoản mới cần quản trị viên cấp quyền (Học sinh / Giáo viên / Phụ huynh). Sau khi được duyệt, hãy tải lại trang.'],
        ['Làm sao thêm học sinh?', 'Vào mục Học sinh → nút "＋ Thêm học sinh". Bạn cũng có thể nhập hàng loạt bằng cách dán danh sách hoặc CSV.'],
        ['Điểm được tính thế nào?', 'Khi bạn chấm bài trong mục Bài tập, điểm trung bình của học sinh được cập nhật tự động.'],
        ['Đổi mật khẩu ở đâu?', 'Vào mục Cài đặt → Đổi mật khẩu. Nếu quên, dùng "Quên mật khẩu" ở trang đăng nhập.'],
        ['Đổi ngôn ngữ / giao diện tối?', 'Vào mục Cài đặt để đổi ngôn ngữ và bật/tắt chế độ tối.'],
      ];
      var body = faqs.map(function (f) {
        return '<details style="border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:10px 14px;margin-bottom:8px;">' +
          '<summary style="cursor:pointer;font-weight:600;">' + f[0] + '</summary>' +
          '<div style="color:var(--text-muted);margin-top:8px;line-height:1.5;font-size:14px;">' + f[1] + '</div></details>';
      }).join('');
      openModal(
        '<div class="modal-header"><h3>❓ Trợ giúp</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' + body + '</div>',
        'modal-sm'
      );
    }

    function renderQuickActions() {
      var qa = document.getElementById('quickActionsBlock');
      if (!qa || !currentUser) return;
      var role = currentUser.role;
      var actions = [];
      if (role === 'Teacher' || role === 'Admin') {
        actions = [
          { icon: '👨‍🎓', label: t('qa.addStudent'), fn: "openStudentModal()" },
          { icon: '📝', label: t('qa.addHomework'), fn: "openHomeworkModal()" },
          { icon: '🏫', label: t('qa.addClass'), fn: "openClassModal()" },
          { icon: '📊', label: t('qa.viewReports'), fn: "showSection('reports')" },
          { icon: '📂', label: t('qa.addMaterial'), fn: "openMaterialModal()" },
          { icon: '🃏', label: t('qa.addDeck'), fn: "openDeckModal()" },
        ];
      } else if (role === 'Student') {
        actions = [
          { icon: '🃏', label: 'Học Flashcards', fn: "showSection('flashcards')" },
          { icon: '📝', label: 'Xem bài tập', fn: "showSection('student-portal')" },
          { icon: '📅', label: 'Lịch của tôi', fn: "showSection('schedule')" },
          { icon: '📂', label: 'Tài liệu', fn: "showSection('materials')" },
        ];
      } else if (role === 'Parent') {
        actions = [
          { icon: '📊', label: 'Tiến độ của con', fn: "showSection('parent-portal')" },
          { icon: '📅', label: 'Lịch học', fn: "showSection('schedule')" },
          { icon: '💳', label: 'Học phí', fn: "showSection('payments')" },
          { icon: '📂', label: 'Tài liệu', fn: "showSection('materials')" },
        ];
      }
      if (!actions.length) { qa.innerHTML = ''; return; }
      qa.innerHTML = '<div class="quick-actions">' + actions.map(function (a) {
        return '<div class="qa-btn" onclick="' + a.fn + '"><div class="qa-icon">' + a.icon + '</div><div class="qa-label">' + a.label + '</div></div>';
      }).join('') + '</div>';
    }

    // ============================================================
    // PROFILE PANEL
    // ============================================================
    function toggleProfilePanel() {
      var panel = document.getElementById('profilePanel');
      var backdrop = document.getElementById('profileBackdrop');
      if (panel.classList.contains('open')) {
        closeProfilePanel();
      } else {
        renderProfilePanel();
        panel.classList.add('open');
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeProfilePanel() {
      document.getElementById('profilePanel').classList.remove('open');
      document.getElementById('profileBackdrop').classList.remove('open');
      document.body.style.overflow = '';
    }

    var _profileEditing = false;

    function buildRecentActivity() {
      var acts = [];
      var role = currentUser ? currentUser.role : '';
      var isTA = role === 'Teacher' || role === 'Admin';
      if (isTA) {
        students.slice(-3).reverse().forEach(function (s) { acts.push({ icon: '👨‍🎓', ts: '', text: 'Học viên: ' + s.name }); });
        submissions.slice(0, 4).forEach(function (s) {
          var a = assignments.find(function (x) { return x.id === s.assignmentId; });
          acts.push({ icon: '📥', ts: s.submittedAt, text: (s.studentName || 'HS') + ' nộp "' + (a ? a.title : '') + '"' });
        });
        payments.filter(function (p) { return p.status === 'Paid'; }).slice(0, 2).forEach(function (p) {
          acts.push({ icon: '💳', ts: p.paid, text: 'Đã thu $' + p.amount + ' — ' + p.student });
        });
      } else {
        submissions.filter(function (s) { return s.studentId === _dbUserId; }).slice(0, 4).forEach(function (s) {
          var a = assignments.find(function (x) { return x.id === s.assignmentId; });
          acts.push({ icon: s.grade != null ? '🎯' : '📥', ts: s.submittedAt, text: s.grade != null ? ('Điểm ' + s.grade + '/10 — ' + (a ? a.title : '')) : ('Đã nộp "' + (a ? a.title : '') + '"') });
        });
      }
      acts.sort(function (a, b) { return String(b.ts || '').localeCompare(String(a.ts || '')); });
      return acts.slice(0, 5).map(function (x) { return { icon: x.icon, text: x.text, time: _timeAgo(x.ts) || '' }; });
    }

    function renderProfilePanel() {
      if (!currentUser) return;
      var u = currentUser;
      // Hoạt động THẬT khi đã kết nối DB; demo chỉ khi chạy offline
      var logs = _db ? buildRecentActivity() : (activityLogs[u.role.toLowerCase()] || []);

      var html = '<button class="pp-close" onclick="closeProfilePanel()">×</button>';

      // Header — avatar + name (editable in edit mode)
      html += '<div class="pp-header">';
      var avInner = _isAvatarUrl(u.avatar)
        ? '<img src="' + escAttr(u.avatar) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">'
        : escHtml(u.avatar);
      html += '<div class="pp-avatar" style="overflow:hidden;position:relative;">' + avInner +
        (_profileEditing && _db ? '<div onclick="changeAvatar()" title="Đổi ảnh" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);color:#fff;font-size:20px;cursor:pointer;border-radius:50%;">📷</div>' : '') +
        '</div>';
      if (_profileEditing) {
        html += '<input type="file" id="ppAvatarFile" accept="image/*" style="display:none;" onchange="_avatarUpload(this)">';
        html += '<input id="ppNameInput" value="' + escHtml(u.name) + '" style="font-size:16px;font-weight:700;text-align:center;border:1.5px solid var(--accent);border-radius:8px;padding:4px 10px;background:var(--bg);color:var(--text);width:90%;margin:4px 0;">';
        if (u.subject !== undefined) {
          html += '<input id="ppSubjectInput" value="' + escHtml(u.subject || '') + '" placeholder="Môn học / Chức danh" style="font-size:12px;text-align:center;border:1px solid var(--border);border-radius:6px;padding:3px 8px;background:var(--bg);color:var(--text-muted);width:80%;margin:2px 0;">';
        }
        html += '<div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">';
        html += '<button class="btn btn-primary" style="padding:6px 18px;font-size:13px;" onclick="saveProfileEdit()">💾 Lưu</button>';
        html += '<button class="btn btn-ghost" style="padding:6px 14px;font-size:13px;" onclick="_profileEditing=false;renderProfilePanel()">Hủy</button>';
        html += '</div>';
      } else {
        html += '<div class="pp-name">' + escHtml(u.name) + '</div>';
        html += '<div class="pp-email">' + escHtml(u.email) + '</div>';
        html += '<div class="pp-role-badge">' + escHtml(u.role) + '</div>';
        html += '<button onclick="_profileEditing=true;renderProfilePanel()" style="margin-top:10px;display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:8px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;color:#fff;">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Sửa thông tin</button>';
      }
      html += '</div>';

      // Account info
      html += '<div class="pp-section"><h4>' + t('profile.account') + '</h4>';
      html += '<div class="pp-row"><span class="pp-lbl">Vai trò</span><span class="pp-val">' + escHtml(u.role) + '</span></div>';
      if (u.joined) html += '<div class="pp-row"><span class="pp-lbl">Tham gia</span><span class="pp-val">' + escHtml(u.joined) + '</span></div>';
      if (u.lastLogin) html += '<div class="pp-row"><span class="pp-lbl">Đăng nhập</span><span class="pp-val">' + escHtml(u.lastLogin) + '</span></div>';
      if (u.subject) html += '<div class="pp-row"><span class="pp-lbl">Môn</span><span class="pp-val">' + escHtml(u.subject) + '</span></div>';
      if (u.class) html += '<div class="pp-row"><span class="pp-lbl">Lớp</span><span class="pp-val">' + escHtml(u.class) + '</span></div>';
      if (u.linkedStudent) html += '<div class="pp-row"><span class="pp-lbl">Con</span><span class="pp-val">' + escHtml(u.linkedStudent) + '</span></div>';
      html += '</div>';

      // Activity log
      if (logs.length) {
        html += '<div class="pp-section"><h4>' + t('profile.activity') + '</h4>';
        logs.forEach(function (log) {
          html += '<div class="pp-activity"><div class="pp-act-icon">' + log.icon + '</div>';
          html += '<div class="pp-act-text">' + escHtml(log.text) + '</div>';
          html += '<div class="pp-act-time">' + log.time + '</div></div>';
        });
        html += '</div>';
      }

      // Preferences
      html += '<div class="pp-section"><h4>' + t('profile.preferences') + '</h4>';
      html += '<div class="pp-pref-row"><span>Ngôn ngữ</span><div class="pp-lang-btns">';
      html += '<button class="pp-lang-btn' + (currentLang === 'en' ? ' active' : '') + '" onclick="setLang(\'en\');renderProfilePanel()">EN</button>';
      html += '<button class="pp-lang-btn' + (currentLang === 'vi' ? ' active' : '') + '" onclick="setLang(\'vi\');renderProfilePanel()">VI</button>';
      html += '</div></div>';
      html += '<div class="pp-pref-row"><span>Giao diện tối</span><button class="toggle' + (isDark ? ' on' : '') + '" onclick="toggleTheme();renderProfilePanel()"></button></div>';
      if (u.role === 'Teacher' || u.role === 'Admin') {
        html += '<div class="pp-pref-row"><span>Chế độ sửa</span><button class="toggle' + (editMode ? ' on' : '') + '" onclick="toggleEditMode();renderProfilePanel()"></button></div>';
      }
      html += '</div>';

      // Demo switcher — only shown when NOT using real Supabase auth
      if (!_db) {
        html += '<div class="pp-section"><h4>Tài khoản Demo</h4>';
        mockUsers.forEach(function (mu) {
          if (mu.id === u.id) return;
          html += '<div onclick="switchToUser(' + mu.id + ')" style="display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">';
          html += '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;">' + escHtml(mu.avatar) + '</div>';
          html += '<div><div style="font-size:13px;font-weight:600;">' + escHtml(mu.name) + '</div><div style="font-size:11px;color:var(--text-muted);">' + escHtml(mu.role) + '</div></div>';
          html += '</div>';
        });
        html += '</div>';
      }

      html += '<button class="pp-logout-btn" onclick="logout()">' + t('btn.logout') + '</button>';
      document.getElementById('profilePanel').innerHTML = html;
    }

    function changeAvatar() {
      var inp = document.getElementById('ppAvatarFile');
      if (inp) inp.click();
    }

    function _avatarUpload(input) {
      var file = input && input.files && input.files[0];
      if (!file) return;
      if (!_db || !_dbUserId) { showToast('Chưa kết nối tài khoản.', 'error'); return; }
      if (file.size > 5 * 1024 * 1024) { showToast('Ảnh tối đa 5MB.', 'error'); return; }
      var safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      var path = 'avatars/' + _dbUserId + '_' + Date.now() + '_' + safe;
      showToast('Đang tải ảnh...', 'info');
      _db.storage.from('materials').upload(path, file, { upsert: true }).then(function (r) {
        if (r.error) { showToast('Lỗi tải ảnh: ' + r.error.message, 'error'); return; }
        var url = _db.storage.from('materials').getPublicUrl(path).data.publicUrl;
        currentUser.avatar = url;
        _setAvatarEl(document.getElementById('topAvatar'), currentUser);
        _setAvatarEl(document.getElementById('sidebarAvatar'), currentUser);
        renderProfilePanel();
        _db.from('profiles').update({ avatar: url }).eq('id', _dbUserId).then(function (r2) {
          if (r2.error) showToast('Lỗi lưu avatar: ' + r2.error.message, 'error');
          else showToast('Đã đổi ảnh đại diện.', 'success');
        });
      });
    }

    function saveProfileEdit() {
      var nameEl = document.getElementById('ppNameInput');
      var subjectEl = document.getElementById('ppSubjectInput');
      var newName = nameEl ? nameEl.value.trim() : currentUser.name;
      if (!newName) { showToast('Tên không được để trống.', 'error'); return; }

      var newSubject = subjectEl ? subjectEl.value.trim() : currentUser.subject;
      // Giữ nguyên ảnh nếu đã upload; nếu chưa thì dùng chữ cái viết tắt từ tên
      var newAvatar = _isAvatarUrl(currentUser.avatar)
        ? currentUser.avatar
        : newName.split(' ').filter(Boolean).map(function (w) { return w[0].toUpperCase(); }).join('').slice(0, 2);

      // Update in-memory user
      currentUser.name = newName;
      currentUser.avatar = newAvatar;
      if (newSubject !== undefined) currentUser.subject = newSubject;

      // Update topbar + sidebar
      _setAvatarEl(document.getElementById('topAvatar'), currentUser);
      _setAvatarEl(document.getElementById('sidebarAvatar'), currentUser);
      var sn = document.getElementById('sidebarName');
      if (sn) sn.textContent = newName;

      // Persist to Supabase
      if (_db && _dbUserId) {
        var updates = { name: newName, avatar: newAvatar };
        if (newSubject !== undefined) updates.subject = newSubject;
        persistProfile(updates);
        // Also update Supabase auth metadata (display_name)
        _db.auth.updateUser({ data: { full_name: newName } }).then(function (r) {
          if (r.error) { console.error('auth.updateUser failed:', r.error); }
        });
      }

      _profileEditing = false;
      showToast('Đã lưu thông tin.', 'success');
      renderProfilePanel();
    }

