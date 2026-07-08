    // ============================================================
    // TRANSLATIONS
    // ============================================================
    var T = {
      en: {
        'nav.dashboard': 'Dashboard', 'nav.students': 'Students', 'nav.classes': 'Classes',
        'nav.homework': 'Homework', 'nav.attendance': 'Attendance', 'nav.scores': 'Scores',
        'nav.payments': 'Payments', 'nav.schedule': 'Schedule', 'nav.materials': 'Materials',
        'nav.flashcards': 'Flashcards', 'nav.pomodoro': 'Pomodoro', 'nav.reports': 'Reports', 'nav.assignments': 'Assignments', 'nav.users': 'User Management',
        'nav.subjects': 'Subjects', 'nav.parent-portal': 'Parent Portal', 'nav.student-portal': 'Student Portal', 'nav.settings': 'Settings',
        'login.subtitle': 'Sign in to your account', 'login.email': 'Email Address', 'login.password': 'Password',
        'login.btn': 'Sign In', 'login.demo': 'Quick Demo Login', 'login.error': 'Invalid email or password',
        'greeting.morning': 'Good morning', 'greeting.afternoon': 'Good afternoon', 'greeting.evening': 'Good evening',
        'notif.title': 'Notifications', 'notif.markAll': 'Mark all read', 'notif.empty': 'No notifications',
        'sched.title': 'Schedule', 'sched.subtitle': 'Upcoming and past tutoring sessions.',
        'sched.all': 'All', 'sched.upcoming': 'Upcoming', 'sched.completed': 'Completed', 'sched.canceled': 'Canceled',
        'reports.title': 'Reports & Analytics',
        'settings.language': 'Language', 'settings.theme': 'Appearance', 'settings.editMode': 'Edit Mode',
        'btn.logout': 'Logout', 'btn.add': 'Add', 'btn.edit': 'Edit', 'btn.delete': 'Delete', 'btn.save': 'Save', 'btn.cancel': 'Cancel',
        'profile.account': 'Account Info', 'profile.activity': 'Recent Activity', 'profile.preferences': 'Preferences',
        'editmode.on': 'Edit Mode ON', 'editmode.off': 'Edit Mode',
        'welcome.stat.students': 'Students', 'welcome.stat.classes': 'Classes', 'welcome.stat.homework': 'Pending HW',
        'qa.addStudent': 'Add Student', 'qa.addHomework': 'Add Homework', 'qa.addClass': 'Add Class',
        'qa.viewReports': 'View Reports', 'qa.addMaterial': 'Add Material', 'qa.addDeck': 'Add Flashcard Deck',
        'assign.create': 'New Assignment', 'assign.submit': 'Submit Work', 'assign.grade': 'Grade',
        'assign.feedback': 'Feedback', 'assign.deadline': 'Due Date', 'assign.nowork': 'No assignments.',
        'assign.viewSubs': 'View Submissions', 'assign.mySubmit': 'My Submissions',
        'attend.markSession': 'Mark Attendance', 'attend.allClass': 'All Classes',
        'bulk.title': 'Bulk Import Cards', 'bulk.label': 'Paste cards below',
        'bulk.hint': 'Format: Front | Back  or  Front - Back  (one per line). Supports LaTeX.',
        'bulk.btn': 'Import', 'bulk.placeholder': 'Vocabulary | Definition\nQuestion | Answer',
        'users.title': 'User Management', 'users.pending': 'Pending', 'users.approve': 'Set Role',
        'users.noUsers': 'No users loaded. Click Reload.',
      },
      vi: {
        'nav.dashboard': 'Tổng quan', 'nav.students': 'Học sinh', 'nav.classes': 'Lớp học',
        'nav.homework': 'Bài tập', 'nav.attendance': 'Điểm danh', 'nav.scores': 'Điểm số',
        'nav.payments': 'Thanh toán', 'nav.schedule': 'Lịch học', 'nav.materials': 'Tài liệu',
        'nav.flashcards': 'Thẻ học', 'nav.pomodoro': 'Pomodoro', 'nav.reports': 'Báo cáo', 'nav.assignments': 'Bài tập & Nộp bài', 'nav.users': 'Quản lý ND',
        'nav.subjects': 'Môn học', 'nav.parent-portal': 'Cổng phụ huynh', 'nav.student-portal': 'Cổng học sinh', 'nav.settings': 'Cài đặt',
        'login.subtitle': 'Đăng nhập vào tài khoản của bạn', 'login.email': 'Địa chỉ Email', 'login.password': 'Mật khẩu',
        'login.btn': 'Đăng nhập', 'login.demo': 'Đăng nhập Demo nhanh', 'login.error': 'Email hoặc mật khẩu không đúng',
        'greeting.morning': 'Chào buổi sáng', 'greeting.afternoon': 'Chào buổi chiều', 'greeting.evening': 'Chào buổi tối',
        'notif.title': 'Thông báo', 'notif.markAll': 'Đánh dấu đã đọc', 'notif.empty': 'Không có thông báo',
        'sched.title': 'Lịch học', 'sched.subtitle': 'Các buổi học sắp tới và đã qua.',
        'sched.all': 'Tất cả', 'sched.upcoming': 'Sắp tới', 'sched.completed': 'Hoàn thành', 'sched.canceled': 'Đã hủy',
        'reports.title': 'Báo cáo & Phân tích',
        'settings.language': 'Ngôn ngữ', 'settings.theme': 'Giao diện', 'settings.editMode': 'Chế độ sửa',
        'btn.logout': 'Đăng xuất', 'btn.add': 'Thêm', 'btn.edit': 'Sửa', 'btn.delete': 'Xóa', 'btn.save': 'Lưu', 'btn.cancel': 'Hủy',
        'profile.account': 'Thông tin tài khoản', 'profile.activity': 'Hoạt động gần đây', 'profile.preferences': 'Tùy chọn',
        'editmode.on': 'Đang chỉnh sửa', 'editmode.off': 'Chỉnh sửa',
        'welcome.stat.students': 'Học sinh', 'welcome.stat.classes': 'Lớp học', 'welcome.stat.homework': 'BT chờ',
        'qa.addStudent': 'Thêm học sinh', 'qa.addHomework': 'Thêm bài tập', 'qa.addClass': 'Thêm lớp',
        'qa.viewReports': 'Xem báo cáo', 'qa.addMaterial': 'Thêm tài liệu', 'qa.addDeck': 'Thêm thẻ học',
        'assign.create': 'Giao bài mới', 'assign.submit': 'Nộp bài', 'assign.grade': 'Chấm điểm',
        'assign.feedback': 'Nhận xét', 'assign.deadline': 'Hạn nộp', 'assign.nowork': 'Chưa có bài tập.',
        'assign.viewSubs': 'Xem bài nộp', 'assign.mySubmit': 'Bài tôi đã nộp',
        'attend.markSession': 'Điểm danh', 'attend.allClass': 'Tất cả lớp',
        'bulk.title': 'Nhập thẻ hàng loạt', 'bulk.label': 'Dán nội dung thẻ bên dưới',
        'bulk.hint': 'Định dạng: Mặt trước | Mặt sau  hoặc  Mặt trước - Mặt sau  (mỗi dòng một thẻ). Hỗ trợ LaTeX.',
        'bulk.btn': 'Nhập', 'bulk.placeholder': 'Từ vựng | Nghĩa\nCâu hỏi | Đáp án',
        'users.title': 'Quản lý người dùng', 'users.pending': 'Chờ duyệt', 'users.approve': 'Đổi vai trò',
        'users.noUsers': 'Chưa có dữ liệu. Nhấn Tải lại.',
      }
    };

    function t(key) {
      return (T[currentLang] && T[currentLang][key]) || (T['en'] && T['en'][key]) || key;
    }

    function setLang(lang) {
      currentLang = lang;
      document.getElementById('langBtnEn').className = 'lang-btn' + (lang === 'en' ? ' active' : '');
      document.getElementById('langBtnVi').className = 'lang-btn' + (lang === 'vi' ? ' active' : '');
      // Update login screen text
      var sub = document.getElementById('loginSubtitle');
      if (sub) sub.textContent = t('login.subtitle');
      var em = document.getElementById('loginEmailLbl');
      if (em) em.textContent = t('login.email');
      var pw = document.getElementById('loginPwLbl');
      if (pw) pw.textContent = t('login.password');
      var lb = document.getElementById('loginBtn');
      if (lb) lb.textContent = t('login.btn');
      var dd = document.getElementById('demoDivLbl');
      if (dd) dd.textContent = t('login.demo');
      // Update edit mode button
      var eml = document.getElementById('editModeBtnLabel');
      if (eml) eml.textContent = editMode ? t('editmode.on') : t('editmode.off');
      // Re-render nav
      if (currentUser) {
        renderNavigation();
        // Re-render current section label
        renderWelcome();
      }
      // Cập nhật tooltip giải thích thuật ngữ theo ngôn ngữ mới
      try { injectHelpTips(document); } catch (e) { }
    }

    // ============================================================
    // MOCK USER DATA
    // ============================================================
    var mockUsers = [
      { id: 1, email: 'teacher@tutorhub.com', password: '123456', role: 'Teacher', name: 'Ms. Thompson', avatar: 'MT', subject: 'Math & English', joined: 'Jan 2024', classes: ['Math A', 'Math B'], lastLogin: '2026-06-09 08:30' },
      { id: 2, email: 'admin@tutorhub.com', password: '123456', role: 'Admin', name: 'Admin User', avatar: 'AU', subject: 'Administration', joined: 'Sep 2023', classes: [], lastLogin: '2026-06-09 09:00' },
      { id: 3, email: 'parent@tutorhub.com', password: '123456', role: 'Parent', name: 'Mr. Wilson', avatar: 'MW', linkedStudent: 'Emma Wilson', linkedStudentId: 1, joined: 'Feb 2024', lastLogin: '2026-06-08 19:15' },
      { id: 4, email: 'student@tutorhub.com', password: '123456', role: 'Student', name: 'Emma Wilson', avatar: 'EW', studentId: 1, class: 'Math A', joined: 'Feb 2024', lastLogin: '2026-06-09 07:45' }
    ];

    var ROLE_SECTIONS = {
      Teacher: ['dashboard', 'students', 'classes', 'assignments', 'attendance', 'scores', 'payments', 'schedule', 'materials', 'flashcards', 'pomodoro', 'reports', 'users', 'settings'],
      Admin: ['dashboard', 'students', 'classes', 'assignments', 'attendance', 'scores', 'payments', 'schedule', 'materials', 'flashcards', 'pomodoro', 'reports', 'users', 'subjects', 'settings'],
      Parent: ['parent-portal', 'materials', 'flashcards', 'schedule', 'payments', 'settings'],
      // HS: rút gọn còn các mục cốt lõi (bỏ 'payments' khỏi sidebar — học phí vẫn
      // xem được trong Cổng học sinh). Nav hiển thị theo STUDENT_NAV (05-navigation.js).
      Student: ['student-portal', 'assignments', 'materials', 'flashcards', 'pomodoro', 'schedule', 'settings'],
      Pending: ['settings'],
    };

    var DEFAULT_SECTION = {
      Teacher: 'dashboard', Admin: 'dashboard', Parent: 'parent-portal', Student: 'student-portal'
    };

    // ============================================================
    // NOTIFICATIONS DATA
    // ============================================================
    // Thông báo THẬT — sinh từ dữ liệu theo vai trò (buildNotifications()).
    var notifications = [];
    var enrollmentRequests = []; // yêu cầu vào lớp chờ duyệt (GV/Admin)
    var _notifRead = (function () { try { return JSON.parse(localStorage.getItem('th_notif_read') || '{}'); } catch (e) { return {}; } })();
    function _saveNotifRead() { try { localStorage.setItem('th_notif_read', JSON.stringify(_notifRead)); } catch (e) { } }

    function _timeAgo(dateStr) {
      if (!dateStr) return '';
      var d = new Date(dateStr); if (isNaN(d.getTime())) return dateStr;
      var day = Math.floor((Date.now() - d.getTime()) / 864e5);
      if (day <= 0) return 'Hôm nay';
      if (day === 1) return 'Hôm qua';
      if (day < 30) return day + ' ngày trước';
      return dateStr;
    }

    function buildNotifications() {
      if (_db) return; // Do not overwrite DB-backed notifications
      var list = [];
      var role = currentUser ? currentUser.role : '';
      var isTA = role === 'Teacher' || role === 'Admin';

      if (isTA) {
        submissions.filter(function (s) { return s.grade == null; }).forEach(function (s) {
          var a = assignments.find(function (x) { return x.id === s.assignmentId; });
          if (!a) return;
          list.push({ id: 'sub_' + s.id, icon: '📥', ts: s.submittedAt, message: (s.studentName || 'Học sinh') + ' nộp bài "' + a.title + '" — chưa chấm.' });
        });
        (enrollmentRequests || []).forEach(function (q) {
          list.push({ id: 'enr_' + q.id, icon: '📩', ts: q.createdAt, message: (q.studentName || q.studentEmail) + ' xin vào lớp ' + (q.className || '') + '.' });
        });
        if (role === 'Admin') {
          var od = payments.filter(function (p) { return p.status === 'Overdue'; });
          if (od.length) list.push({ id: 'pay_overdue', icon: '💳', ts: null, message: od.length + ' khoản học phí đang quá hạn.' });
        }
      }

      if (role === 'Student') {
        var rec = (typeof _myStudentRecord === 'function') ? _myStudentRecord() : null;
        var myClass = (rec && rec.class) || (classes[0] ? classes[0].name : '');
        assignments.filter(function (a) { return a.class === myClass && a.status === 'open'; }).forEach(function (a) {
          var mine = submissions.find(function (s) { return s.assignmentId === a.id && s.studentId === _dbUserId; });
          if (!mine) list.push({ id: 'asg_' + a.id, icon: '📝', ts: a.createdAt, message: 'Bài tập mới: "' + a.title + '" — chưa nộp.' });
        });
        submissions.filter(function (s) { return s.studentId === _dbUserId && s.grade != null; }).forEach(function (s) {
          var a = assignments.find(function (x) { return x.id === s.assignmentId; });
          list.push({ id: 'grade_' + s.id, icon: '🎯', ts: s.submittedAt, message: 'Bài "' + (a ? a.title : '') + '" đã được chấm: ' + s.grade + '/10.' });
        });
        payments.filter(function (p) { return p.userId === _dbUserId && p.status !== 'Paid'; }).forEach(function (p) {
          list.push({ id: 'pay_' + p.id, icon: '💳', ts: null, message: 'Học phí $' + p.amount + (p.status === 'Overdue' ? ' đã quá hạn' : ' đến hạn ' + (p.due || '')) + '.' });
        });
      }

      if (role === 'Parent') {
        payments.filter(function (p) { return p.status !== 'Paid'; }).forEach(function (p) {
          list.push({ id: 'pay_' + p.id, icon: '💳', ts: null, message: 'Học phí của con: $' + p.amount + (p.status === 'Overdue' ? ' quá hạn' : ' đến hạn') + '.' });
        });
      }

      // Buổi học hôm nay (mọi vai trò có lịch)
      var today = new Date().toISOString().split('T')[0];
      scheduleItems.filter(function (i) { return i.date === today && i.status !== 'Canceled'; }).forEach(function (i) {
        list.push({ id: 'sch_' + (i.dbId || i.id), icon: '📅', ts: i.date, message: 'Hôm nay có buổi ' + (i.class || '') + ' lúc ' + (i.time || '') + '.' });
      });

      list.sort(function (a, b) { return String(b.ts || '').localeCompare(String(a.ts || '')); });
      notifications = list.map(function (n) {
        return { id: n.id, icon: n.icon, message: n.message, time: _timeAgo(n.ts), read: !!_notifRead[n.id] };
      });
    }

    function loadNotifications() {
      if (!_db || !_dbUserId) return;
      _db.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)
        .then(function (r) {
          if (r.error) { console.warn('load notifications error', r.error.message); return; }
          notifications = (r.data || []).map(function (n) {
            return {
              id: n.id,
              icon: n.icon || '🔔',
              message: n.message,
              time: _timeAgo(n.created_at),
              read: n.is_read
            };
          });
          updateNotifBadge();
          if (document.getElementById('notifDropdown') && document.getElementById('notifDropdown').classList.contains('open')) {
            renderNotifDropdown();
          }
        });
    }

    var _notifChannel = null;
    function subscribeNotifications() {
      if (!_db || !_dbUserId) return;
      if (_notifChannel) _notifChannel.unsubscribe();
      // Nghe MỌI thay đổi (INSERT/UPDATE/DELETE) để đồng bộ cả trạng thái đã đọc
      // / đã xoá giữa các thiết bị; chỉ hiện toast khi có thông báo MỚI (INSERT).
      _notifChannel = _db.channel('public:notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + _dbUserId }, function (payload) {
          loadNotifications();
          if (payload.eventType === 'INSERT' && payload.new && payload.new.message) {
            showToast(payload.new.message, 'info');
          }
        })
        .subscribe();
    }

    // ============================================================
    // SCHEDULE DATA
    // ============================================================
    var scheduleItems = [
      { id: 1, class: 'Math A', teacher: 'Ms. Thompson', date: '2026-06-10', time: '4:00 PM', duration: 60, room: '101', status: 'Upcoming', notes: '' },
      { id: 2, class: 'English A', teacher: 'Mr. Sanders', date: '2026-06-10', time: '5:30 PM', duration: 60, room: '102', status: 'Upcoming', notes: '' },
      { id: 3, class: 'Math B', teacher: 'Ms. Thompson', date: '2026-06-11', time: '5:00 PM', duration: 60, room: '101', status: 'Upcoming', notes: '' },
      { id: 4, class: 'English B', teacher: 'Mr. Sanders', date: '2026-06-11', time: '4:30 PM', duration: 60, room: '102', status: 'Upcoming', notes: '' },
      { id: 5, class: 'Math A', teacher: 'Ms. Thompson', date: '2026-06-09', time: '4:00 PM', duration: 60, room: '101', status: 'Upcoming', notes: '' },
      { id: 6, class: 'Math B', teacher: 'Ms. Thompson', date: '2026-06-05', time: '5:00 PM', duration: 60, room: '101', status: 'Completed', notes: 'Covered quadratic equations.' },
      { id: 7, class: 'English A', teacher: 'Mr. Sanders', date: '2026-06-04', time: '5:30 PM', duration: 60, room: '102', status: 'Completed', notes: 'Reading comprehension chapter 5.' },
      { id: 8, class: 'English B', teacher: 'Mr. Sanders', date: '2026-06-03', time: '4:30 PM', duration: 60, room: '102', status: 'Canceled', notes: 'Teacher sick leave.' },
    ];

    // ============================================================
    // TEACHER COMMENTS
    // ============================================================
    var teacherComments = [
      { id: 1, studentId: 1, teacher: 'Ms. Thompson', date: '2026-06-08', category: 'achievement', text: 'Excellent performance on the algebra test — top of the class!' },
      { id: 2, studentId: 2, teacher: 'Ms. Thompson', date: '2026-06-07', category: 'progress', text: 'Liam has been improving steadily. Keep up the daily practice.' },
      { id: 3, studentId: 6, teacher: 'Ms. Thompson', date: '2026-06-06', category: 'progress', text: 'Ethan needs extra support on algebra basics. Schedule one-on-one session.' },
      { id: 4, studentId: 4, teacher: 'Ms. Thompson', date: '2026-06-05', category: 'behavior', text: 'Noah was very engaged during class today. Active participation.' },
      { id: 5, studentId: 10, teacher: 'Ms. Thompson', date: '2026-06-04', category: 'progress', text: 'Lucas struggling with statistics. Recommend additional worksheet practice.' },
    ];
    var nextCommentId = 6;

    // ============================================================
    // ACTIVITY LOGS
    // ============================================================
    var activityLogs = {
      teacher: [
        { icon: '📝', text: 'Graded Algebra Practice Set 3 — 12 students', time: '2 hours ago' },
        { icon: '📅', text: 'Marked attendance for Math A session', time: '4 hours ago' },
        { icon: '💬', text: 'Added comment on Liam Chen\'s progress', time: 'Yesterday' },
        { icon: '📚', text: 'Uploaded "Calculus Review" material', time: '2 days ago' },
        { icon: '🃏', text: 'Updated Algebra Fundamentals flashcard deck', time: '3 days ago' },
      ],
      admin: [
        { icon: '👤', text: 'Added new student: New Enrollment', time: '1 day ago' },
        { icon: '💳', text: 'Marked INV-006 payment as Paid', time: '2 days ago' },
        { icon: '🏫', text: 'Updated Math B class capacity to 5', time: '3 days ago' },
        { icon: '📊', text: 'Exported monthly report for June 2026', time: '4 days ago' },
        { icon: '⚙️', text: 'Updated grade thresholds settings', time: '5 days ago' },
      ],
      parent: [
        { icon: '📊', text: 'Viewed Emma Wilson\'s score report', time: 'Yesterday' },
        { icon: '💳', text: 'Checked payment status for June invoice', time: '2 days ago' },
        { icon: '🃏', text: 'Browsed Algebra Fundamentals flashcards', time: '3 days ago' },
        { icon: '📂', text: 'Downloaded Calculus Review material', time: '4 days ago' },
        { icon: '📅', text: 'Checked upcoming class schedule', time: '5 days ago' },
      ],
      student: [
        { icon: '🃏', text: 'Studied Algebra Fundamentals — 12 cards', time: '3 hours ago' },
        { icon: '📝', text: 'Reviewed homework: Quadratic Equations', time: 'Yesterday' },
        { icon: '📊', text: 'Checked score for Geometry Proofs', time: '2 days ago' },
        { icon: '📂', text: 'Downloaded English Grammar material', time: '3 days ago' },
        { icon: '🎯', text: 'Completed practice quiz — scored 88%', time: '4 days ago' },
      ]
    };

    // ============================================================
    // FLASHCARD EXTRAS (favorites, ratings)
    // ============================================================
    var cardFavorites = {};   // key: deckId+'-'+cardId → true/false
    var cardRatings = {};     // key: deckId+'-'+cardId → 'again'|'hard'|'good'|'easy'
    var studyStreak = 3;      // mock streak days

