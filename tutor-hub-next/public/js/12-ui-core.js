    // ============================================================
    // MATHJAX HELPER
    // ============================================================
    function typesetMath(el) {
      if (window.MathJax && MathJax.typesetPromise) {
        const target = el ? (typeof el === 'string' ? document.getElementById(el) : el) : document.body;
        if (target) MathJax.typesetPromise([target]).catch(function () { });
      }
    }

    // ============================================================
    // TOAST SYSTEM
    // ============================================================
    function showToast(message, type) {
      type = type || 'info';
      var icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
      var container = document.getElementById('toastContainer');
      var toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.innerHTML = '<span class="toast-icon">' + (icons[type] || 'ℹ️') + '</span><span>' + message + '</span>';
      container.appendChild(toast);
      setTimeout(function () {
        toast.style.animation = 'toastOut 0.3s forwards';
        setTimeout(function () { toast.remove(); }, 300);
      }, 3000);
    }

    // ============================================================
    // MODAL SYSTEM
    // ============================================================
    var _modalPrevFocus = null;
    // A11y: Esc để đóng + bẫy Tab trong modal (không cho focus thoát ra nền).
    function _modalKeydown(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
      if (e.key !== 'Tab') return;
      var content = document.getElementById('modalContent');
      var f = content.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
      f = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function openModal(html, cls) {
      var overlay = document.getElementById('modalOverlay');
      var content = document.getElementById('modalContent');
      content.className = 'modal' + (cls ? ' ' + cls : '');
      content.setAttribute('role', 'dialog');
      content.setAttribute('aria-modal', 'true');
      content.innerHTML = html;
      // A11y: gắn <label> với ô nhập kế tiếp trong cùng .form-group (khi chưa gắn)
      // để trình đọc màn hình đọc đúng nhãn. Chỉ thêm id/for khi còn thiếu.
      try {
        var _grps = content.querySelectorAll('.form-group');
        Array.prototype.forEach.call(_grps, function (g, i) {
          var lbl = g.querySelector('label');
          var field = g.querySelector('input:not([type=hidden]), select, textarea');
          if (lbl && field && !lbl.getAttribute('for')) {
            if (!field.id) field.id = '_fld_' + Date.now().toString(36) + '_' + i;
            lbl.setAttribute('for', field.id);
          }
        });
      } catch (e) { }
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (!overlay.classList.contains('_focus-bound')) { _modalPrevFocus = document.activeElement; }
      document.removeEventListener('keydown', _modalKeydown, true);
      document.addEventListener('keydown', _modalKeydown, true);
      overlay.classList.add('_focus-bound');
      // Đưa focus vào phần tử đầu tiên trong modal (a11y).
      setTimeout(function () {
        typesetMath(content);
        // Ưu tiên ô nhập đầu tiên; nếu không có thì phần tử focus được đầu tiên.
        var f = content.querySelector('input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled])')
          || content.querySelector('button:not([disabled]):not(.modal-close), a[href]')
          || content.querySelector('.modal-close');
        if (f) { try { f.focus(); } catch (e) { } }
      }, 50);
    }
    function closeModal() {
      var overlay = document.getElementById('modalOverlay');
      overlay.classList.remove('open');
      overlay.classList.remove('_focus-bound');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', _modalKeydown, true);
      if (_modalPrevFocus && _modalPrevFocus.focus) { try { _modalPrevFocus.focus(); } catch (e) { } }
      _modalPrevFocus = null;
    }

    // ── IN-APP CONFIRM (thay confirm() gốc trình duyệt) ───────────
    // Hộp thoại xác nhận đồng bộ giao diện app: song ngữ, bẫy focus/Esc
    // (dùng chung openModal/closeModal). onConfirm chỉ chạy khi bấm nút chính.
    // opts: { danger, okText, cancelText, title }.
    function uiConfirm(message, onConfirm, opts) {
      opts = opts || {};
      var en = (typeof currentLang !== 'undefined' && currentLang === 'en');
      var title = opts.title || (en ? 'Please confirm' : 'Xác nhận');
      var okText = opts.okText || (en ? 'Confirm' : 'Xác nhận');
      var cancelText = opts.cancelText || (en ? 'Cancel' : 'Hủy');
      var okClass = opts.danger === false ? 'btn-primary' : 'btn-danger';
      window._uiConfirmCb = function () {
        var cb = onConfirm; closeModal();
        if (typeof cb === 'function') { try { cb(); } catch (e) { console.error(e); } }
      };
      var icon = opts.danger === false ? svgIcon('info', 20) : svgIcon('alert-triangle', 20);
      var iconColor = opts.danger === false ? 'var(--accent)' : 'var(--danger)';
      openModal(
        '<div class="modal-header"><h3 style="display:flex;align-items:center;gap:9px;">' +
        '<span style="color:' + iconColor + ';display:inline-flex;">' + icon + '</span>' + escHtml(title) +
        '</h3><button class="modal-close" onclick="closeModal()" aria-label="' + (en ? 'Close' : 'Đóng') + '">✕</button></div>' +
        '<div class="modal-body"><p style="line-height:1.55;color:var(--text);">' + escHtml(message) + '</p></div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="closeModal()">' + escHtml(cancelText) + '</button>' +
        '<button class="btn ' + okClass + '" onclick="_uiConfirmCb()">' + escHtml(okText) + '</button>' +
        '</div>',
        'modal-sm'
      );
    }

    // ── BUSY OVERLAY (phản hồi khi tải lên / lưu) ─────────────────
    // Dùng chung cho cả modal lẫn thao tác inline. Có timeout an toàn 30s
    // để overlay không bao giờ kẹt nếu lỡ thiếu một nhánh hideBusy().
    var _busyTimer = null;
    function showBusy(msg) {
      var el = document.getElementById('busyOverlay');
      if (!el) {
        var st = document.createElement('style');
        st.textContent = '@keyframes thspin{to{transform:rotate(360deg)}}' +
          '.th-spinner{width:22px;height:22px;border:3px solid rgba(59,130,246,0.25);' +
          'border-top-color:#3b82f6;border-radius:50%;animation:thspin .7s linear infinite;}';
        document.head.appendChild(st);
        el = document.createElement('div');
        el.id = 'busyOverlay';
        el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;' +
          'justify-content:center;background:rgba(15,22,35,0.45);';
        el.innerHTML = '<div style="background:var(--card,#fff);padding:18px 24px;border-radius:14px;' +
          'display:flex;align-items:center;gap:14px;box-shadow:0 20px 50px rgba(0,0,0,0.3);">' +
          '<span class="th-spinner"></span>' +
          '<span id="busyMsg" style="font-weight:600;color:var(--text,#1e2a3a);"></span></div>';
        document.body.appendChild(el);
      }
      document.getElementById('busyMsg').textContent = msg || 'Đang xử lý…';
      el.style.display = 'flex';
      if (_busyTimer) clearTimeout(_busyTimer);
      _busyTimer = setTimeout(hideBusy, 30000);
    }
    function hideBusy() {
      var el = document.getElementById('busyOverlay');
      if (el) el.style.display = 'none';
      if (_busyTimer) { clearTimeout(_busyTimer); _busyTimer = null; }
    }

    // ============================================================
    // CONFETTI ĂN MỪNG (tự chứa, KHÔNG cần CDN → an toàn với CSP + offline)
    // Dùng khi HS nộp bài thành công. Tôn trọng prefers-reduced-motion.
    // ============================================================
    function celebrate() {
      try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) { }
      try {
        var cv = document.createElement('canvas');
        cv.setAttribute('aria-hidden', 'true');
        cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99998;';
        document.body.appendChild(cv);
        var ctx = cv.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        function resize() { cv.width = window.innerWidth * dpr; cv.height = window.innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
        resize();
        var W = window.innerWidth, H = window.innerHeight;
        var colors = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'];
        var N = Math.max(70, Math.min(160, Math.floor(W / 7)));
        var parts = [];
        for (var i = 0; i < N; i++) {
          parts.push({
            x: W / 2 + (Math.random() - 0.5) * W * 0.5,
            y: H * 0.3 + (Math.random() - 0.5) * 60,
            vx: (Math.random() - 0.5) * 11,
            vy: Math.random() * -9 - 3,
            g: 0.26 + Math.random() * 0.12,
            size: 5 + Math.random() * 7,
            rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.34,
            color: colors[i % colors.length],
            rect: Math.random() < 0.55
          });
        }
        var start = performance.now(), DUR = 2200;
        function frame(now) {
          var t = now - start;
          ctx.clearRect(0, 0, W, H);
          ctx.globalAlpha = t > DUR - 500 ? Math.max(0, (DUR - t) / 500) : 1;
          for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
            if (p.rect) ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 6.283); ctx.fill(); }
            ctx.restore();
          }
          if (t < DUR) requestAnimationFrame(frame);
          else if (cv.parentNode) cv.parentNode.removeChild(cv);
        }
        requestAnimationFrame(frame);
      } catch (e) { }
    }

    // ============================================================
    // MOCK DATA
    // ============================================================
    var COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e879f9'];
    var nextStudentId = 13;
    var nextClassId = 5;
    var nextAssignmentId = 3;
    var nextSubmissionId = 10;
    var nextCommentId = 1;

    // ── ASSIGNMENTS DATA ──────────────────────────────────────────
    var assignments = [
      { id: 1, title: 'Bài thi Toán chương 3', subject: 'Math', class: 'Math A', dueDate: '2026-06-20', description: 'Hoàn thành bài tập trang 45-47 SGK Toán 8.', teacherId: null, createdAt: '2026-06-01', status: 'open', gradesPublished: false, attachmentUrl: null },
      { id: 2, title: 'Viết luận tiếng Anh: My Future', subject: 'English', class: 'English A', dueDate: '2026-06-22', description: 'Viết 200 từ về chủ đề "My Future". Nộp file Word hoặc PDF.', teacherId: null, createdAt: '2026-06-02', status: 'open', gradesPublished: false, attachmentUrl: null },
    ];

    var submissions = [
      { id: 1, assignmentId: 1, studentId: 1, studentName: 'Emma Wilson', submittedAt: '2026-06-10', type: 'text', content: 'Bài làm bài toán: x=5, y=3...', grade: null, feedback: null, fileUrl: null },
    ];

    var assignmentComments = [];

    // ── APP USERS (for admin management) ─────────────────────────
    var appUsers = [];
    var nextHwId = 9;
    var nextDeckId = 5;
    var nextCardId = 100;
    var nextMatId = 7;

    var students = [
      { id: 1, name: 'Emma Wilson', class: 'Math A', mathScore: 92, engScore: 88, attendance: 95, gender: 'F', parentContact: 'wilson@email.com', notes: 'Top performer', paymentStatus: 'Paid' },
      { id: 2, name: 'Liam Chen', class: 'Math A', mathScore: 78, engScore: 72, attendance: 83, gender: 'M', parentContact: 'chen@email.com', notes: 'Needs extra practice', paymentStatus: 'Paid' },
      { id: 3, name: 'Sophia Patel', class: 'English A', mathScore: 65, engScore: 94, attendance: 91, gender: 'F', parentContact: 'patel@email.com', notes: 'Excellent in English', paymentStatus: 'Paid' },
      { id: 4, name: 'Noah Kim', class: 'Math B', mathScore: 85, engScore: 76, attendance: 78, gender: 'M', parentContact: 'kim@email.com', notes: 'Improving steadily', paymentStatus: 'Paid' },
      { id: 5, name: 'Olivia Brown', class: 'English A', mathScore: 70, engScore: 89, attendance: 88, gender: 'F', parentContact: 'brown@email.com', notes: '', paymentStatus: 'Paid' },
      { id: 6, name: 'Ethan Davis', class: 'Math B', mathScore: 55, engScore: 63, attendance: 65, gender: 'M', parentContact: 'davis@email.com', notes: 'At risk — follow up', paymentStatus: 'Paid' },
      { id: 7, name: 'Ava Martinez', class: 'English B', mathScore: 81, engScore: 91, attendance: 93, gender: 'F', parentContact: 'martinez@email.com', notes: '', paymentStatus: 'Paid' },
      { id: 8, name: 'Mason Johnson', class: 'Math A', mathScore: 74, engScore: 68, attendance: 80, gender: 'M', parentContact: 'johnson@email.com', notes: '', paymentStatus: 'Pending' },
      { id: 9, name: 'Isabella Lee', class: 'English B', mathScore: 88, engScore: 95, attendance: 97, gender: 'F', parentContact: 'lee@email.com', notes: 'Class leader', paymentStatus: 'Pending' },
      { id: 10, name: 'Lucas Thompson', class: 'Math B', mathScore: 62, engScore: 71, attendance: 70, gender: 'M', parentContact: 'thompson@email.com', notes: '', paymentStatus: 'Pending' },
      { id: 11, name: 'Mia Garcia', class: 'English A', mathScore: 79, engScore: 82, attendance: 86, gender: 'F', parentContact: 'garcia@email.com', notes: '', paymentStatus: 'Overdue' },
      { id: 12, name: 'Aiden White', class: 'English B', mathScore: 90, engScore: 85, attendance: 92, gender: 'M', parentContact: 'white@email.com', notes: '', paymentStatus: 'Overdue' },
    ];

    var classes = [
      { id: 1, name: 'Math A', teacher: 'Ms. Thompson', subject: 'Math', day: 'Mon/Wed', time: '4:00 PM', room: '101', capacity: 4, enrolled: 3, color: 'math' },
      { id: 2, name: 'Math B', teacher: 'Ms. Thompson', subject: 'Math', day: 'Tue/Thu', time: '5:00 PM', room: '101', capacity: 4, enrolled: 3, color: 'math' },
      { id: 3, name: 'English A', teacher: 'Mr. Sanders', subject: 'English', day: 'Mon/Wed', time: '5:30 PM', room: '102', capacity: 4, enrolled: 3, color: 'english' },
      { id: 4, name: 'English B', teacher: 'Mr. Sanders', subject: 'English', day: 'Tue/Thu', time: '4:30 PM', room: '102', capacity: 4, enrolled: 3, color: 'english' },
    ];

    var homework = [
      { id: 1, title: 'Quadratic Equations Worksheet', subject: 'Math', class: 'Math A', assigned: '2026-05-28', due: '2026-06-04', status: 'Graded', completion: 95, description: 'Solve all quadratic equations. Show working for \\(ax^2+bx+c=0\\).' },
      { id: 2, title: 'Reading Comprehension – Chapter 5', subject: 'English', class: 'English A', assigned: '2026-05-29', due: '2026-06-05', status: 'Graded', completion: 88, description: 'Read and answer questions about Chapter 5.' },
      { id: 3, title: 'Algebra Practice Set 3', subject: 'Math', class: 'Math B', assigned: '2026-06-01', due: '2026-06-08', status: 'Assigned', completion: 40, description: 'Complete exercises 1–20. Simplify \\(\\frac{x^2-9}{x-3}\\).' },
      { id: 4, title: 'Essay: My Summer Plan', subject: 'English', class: 'English B', assigned: '2026-06-02', due: '2026-06-09', status: 'Assigned', completion: 65, description: 'Write a 500-word essay about your summer plans.' },
      { id: 5, title: 'Geometry Proofs', subject: 'Math', class: 'Math A', assigned: '2026-06-03', due: '2026-06-10', status: 'Assigned', completion: 20, description: 'Prove theorems 4.1 through 4.5. Use \\(\\triangle ABC \\cong \\triangle DEF\\).' },
      { id: 6, title: 'Vocabulary Builder Unit 7', subject: 'English', class: 'English A', assigned: '2026-06-04', due: '2026-06-11', status: 'Assigned', completion: 10, description: 'Learn and practice all vocabulary words from Unit 7.' },
      { id: 7, title: 'Statistics Intro Problems', subject: 'Math', class: 'Math B', assigned: '2026-05-20', due: '2026-05-27', status: 'Overdue', completion: 0, description: 'Complete problems on mean, median, mode. Calculate \\(\\bar{x}=\\frac{\\sum x_i}{n}\\).' },
      { id: 8, title: 'Short Story Analysis', subject: 'English', class: 'English B', assigned: '2026-05-21', due: '2026-05-28', status: 'Overdue', completion: 0, description: 'Analyze the narrative structure and literary devices.' },
    ];

    var payments = [
      { id: 'INV-001', student: 'Emma Wilson', amount: 320, due: '2026-06-01', paid: '2026-05-30', status: 'Paid' },
      { id: 'INV-002', student: 'Liam Chen', amount: 320, due: '2026-06-01', paid: '2026-06-01', status: 'Paid' },
      { id: 'INV-003', student: 'Sophia Patel', amount: 280, due: '2026-06-01', paid: '2026-05-29', status: 'Paid' },
      { id: 'INV-004', student: 'Noah Kim', amount: 320, due: '2026-06-01', paid: '2026-06-02', status: 'Paid' },
      { id: 'INV-005', student: 'Olivia Brown', amount: 280, due: '2026-06-01', paid: '2026-06-05', status: 'Paid' },
      { id: 'INV-006', student: 'Ethan Davis', amount: 320, due: '2026-06-01', paid: '2026-06-08', status: 'Paid' },
      { id: 'INV-007', student: 'Ava Martinez', amount: 280, due: '2026-06-01', paid: '2026-06-01', status: 'Paid' },
      { id: 'INV-008', student: 'Mason Johnson', amount: 320, due: '2026-06-07', paid: null, status: 'Pending' },
      { id: 'INV-009', student: 'Isabella Lee', amount: 280, due: '2026-06-07', paid: null, status: 'Pending' },
      { id: 'INV-010', student: 'Lucas Thompson', amount: 320, due: '2026-06-07', paid: null, status: 'Pending' },
      { id: 'INV-011', student: 'Mia Garcia', amount: 280, due: '2026-05-25', paid: null, status: 'Overdue' },
      { id: 'INV-012', student: 'Aiden White', amount: 280, due: '2026-05-25', paid: null, status: 'Overdue' },
    ];

    // ====== FLASHCARD DATA ======
    var flashcardDecks = [
      {
        id: 1, title: 'Algebra Fundamentals', subject: 'Math', class: 'Math A',
        tags: ['algebra', 'equations', 'basics'], lastUpdated: '2026-06-05',
        cards: [
          { id: 1, front: 'Solve \\(x^2 - 5x + 6 = 0\\)', back: '\\(x = 2\\) or \\(x = 3\\)', hint: 'Factor the quadratic', example: '\\((x-2)(x-3)=0\\)', difficulty: 'medium' },
          { id: 2, front: 'Derivative of \\(x^3\\)', back: '\\(3x^2\\)', hint: 'Use the power rule', example: '\\(\\frac{d}{dx}x^n = nx^{n-1}\\)', difficulty: 'easy' },
          { id: 3, front: '\\(\\frac{d}{dx}\\sin x\\)', back: '\\(\\cos x\\)', hint: 'Basic trig derivative', example: 'At \\(x=0\\), slope is \\(\\cos(0)=1\\)', difficulty: 'easy' },
          { id: 4, front: 'Evaluate \\(\\int_0^1 x^2\\, dx\\)', back: '\\(\\frac{1}{3}\\)', hint: 'Use the power rule for integration', example: '\\(\\int x^n\\,dx = \\frac{x^{n+1}}{n+1}+C\\)', difficulty: 'medium' },
          { id: 5, front: 'What is \\(\\sqrt{144}\\)?', back: '\\(12\\)', hint: 'Perfect square', example: '\\(12 \\times 12 = 144\\)', difficulty: 'easy' },
          { id: 6, front: 'Simplify \\(\\frac{x^2-9}{x-3}\\)', back: '\\(x+3\\)', hint: 'Factor the numerator as a difference of squares', example: '\\(x^2-9=(x-3)(x+3)\\)', difficulty: 'medium' },
        ]
      },
      {
        id: 2, title: 'Calculus Essentials', subject: 'Math', class: 'Math B',
        tags: ['calculus', 'derivatives', 'integrals'], lastUpdated: '2026-06-07',
        cards: [
          { id: 7, front: 'What is the chain rule?', back: '\\(\\frac{d}{dx}f(g(x)) = f\'(g(x)) \\cdot g\'(x)\\)', hint: 'Derivative of composite functions', example: '\\(\\frac{d}{dx}\\sin(x^2) = \\cos(x^2)\\cdot 2x\\)', difficulty: 'hard' },
          { id: 8, front: '\\(\\int e^x \\, dx\\)', back: '\\(e^x + C\\)', hint: 'The exponential function is its own antiderivative', example: '', difficulty: 'easy' },
          { id: 9, front: 'L\'Hôpital\'s Rule applies when?', back: 'When limit gives \\(\\frac{0}{0}\\) or \\(\\frac{\\infty}{\\infty}\\) form', hint: 'Indeterminate forms', example: '\\(\\lim_{x\\to 0}\\frac{\\sin x}{x} = \\lim_{x\\to 0}\\frac{\\cos x}{1} = 1\\)', difficulty: 'hard' },
          { id: 10, front: '\\(\\frac{d}{dx}\\ln x\\)', back: '\\(\\frac{1}{x}\\)', hint: 'Natural log derivative', example: 'At \\(x=1\\), slope is \\(1\\)', difficulty: 'easy' },
          { id: 11, front: 'What is \\(\\sum_{k=1}^{n} k\\)?', back: '\\(\\frac{n(n+1)}{2}\\)', hint: 'Gauss formula', example: '\\(1+2+3+\\cdots+100 = 5050\\)', difficulty: 'medium' },
          { id: 12, front: 'Matrix multiplication: \\(\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}\\begin{pmatrix}e\\\\f\\end{pmatrix}\\)', back: '\\(\\begin{pmatrix}ae+bf\\\\ce+df\\end{pmatrix}\\)', hint: 'Row times column', example: '', difficulty: 'hard' },
        ]
      },
      {
        id: 3, title: 'English Grammar Mastery', subject: 'English', class: 'English A',
        tags: ['grammar', 'tenses', 'writing'], lastUpdated: '2026-06-06',
        cards: [
          { id: 13, front: 'What is the Present Perfect tense?', back: 'Used for actions linked to the present. Form: have/has + past participle.', hint: 'Think "has done"', example: 'She has visited Paris three times.', difficulty: 'easy' },
          { id: 14, front: 'Define "metaphor"', back: 'A figure of speech that directly compares two unlike things without using "like" or "as".', hint: 'Not a simile!', example: '"Time is money." "The world is a stage."', difficulty: 'easy' },
          { id: 15, front: 'When do you use "whom"?', back: 'Use "whom" when it is the object of a verb or preposition.', hint: 'Replace with him/her — if it fits, use whom', example: 'To whom it may concern. Whom did you see?', difficulty: 'medium' },
          { id: 16, front: 'What is a dangling modifier?', back: 'A modifier that doesn\'t clearly refer to the word it modifies.', hint: 'Usually at the start of a sentence', example: 'Wrong: "Walking to school, the rain started." Correct: "Walking to school, I got caught in the rain."', difficulty: 'hard' },
          { id: 17, front: 'Difference between "affect" and "effect"', back: 'Affect = verb (to influence). Effect = noun (a result).', hint: 'A for Action (verb), E for End result (noun)', example: 'The rain will affect the game. The effect was noticeable.', difficulty: 'easy' },
          { id: 18, front: 'What is the subjunctive mood?', back: 'Used for hypothetical or contrary-to-fact situations. Uses base form of verb.', hint: 'If I were...', example: 'If I were you, I would study harder. She insists that he be present.', difficulty: 'hard' },
        ]
      },
      {
        id: 4, title: 'Vocabulary Power', subject: 'English', class: 'English B',
        tags: ['vocabulary', 'SAT', 'advanced'], lastUpdated: '2026-06-08',
        cards: [
          { id: 19, front: 'Ubiquitous (adjective)', back: 'Present, appearing, or found everywhere.', hint: 'Pronunciation: yoo-BIK-wih-tus', example: 'Smartphones have become ubiquitous in modern society.', difficulty: 'medium' },
          { id: 20, front: 'Ephemeral (adjective)', back: 'Lasting for a very short time.', hint: 'Pronunciation: ih-FEM-er-ul', example: 'The ephemeral beauty of cherry blossoms lasts only a few weeks.', difficulty: 'medium' },
          { id: 21, front: 'Pragmatic (adjective)', back: 'Dealing with things sensibly and realistically.', hint: 'Pronunciation: prag-MAT-ik', example: 'She took a pragmatic approach to solving the budget crisis.', difficulty: 'easy' },
          { id: 22, front: 'Eloquent (adjective)', back: 'Fluent or persuasive in speaking or writing.', hint: 'Pronunciation: EL-oh-kwent', example: 'The president gave an eloquent speech about unity.', difficulty: 'easy' },
          { id: 23, front: 'Juxtaposition (noun)', back: 'The fact of placing two things side by side for comparison or contrast.', hint: 'Pronunciation: juk-stuh-puh-ZI-shun', example: 'The juxtaposition of wealth and poverty in the city was striking.', difficulty: 'hard' },
          { id: 24, front: 'Ameliorate (verb)', back: 'To make something bad or unsatisfactory better.', hint: 'Pronunciation: uh-MEEL-yuh-rayt', example: 'Steps were taken to ameliorate the living conditions of the workers.', difficulty: 'hard' },
        ]
      },
    ];

    // ====== MATERIALS DATA ======
    var materials = [
      { id: 1, title: 'Algebra Basics — Chapter 1 Notes', subject: 'Math', class: 'Math A', fileType: 'PDF', uploadDate: '2026-05-15', description: 'Comprehensive notes covering algebraic expressions, equations, and inequalities. Includes worked examples for \\(ax+b=c\\).', downloadUrl: null, fileName: 'algebra_ch1.pdf' },
      { id: 2, title: 'English Grammar Handbook', subject: 'English', class: 'English A', fileType: 'PDF', uploadDate: '2026-05-18', description: 'Complete grammar reference including tenses, sentence structure, and punctuation rules.', downloadUrl: null, fileName: 'grammar_handbook.pdf' },
      { id: 3, title: 'Calculus Lecture Slides — Week 1', subject: 'Math', class: 'Math B', fileType: 'PPT', uploadDate: '2026-05-22', description: 'Introduction to limits and continuity. Covers \\(\\lim_{x\\to a}f(x)\\) and the epsilon-delta definition.', downloadUrl: null, fileName: 'calculus_week1.pptx' },
      { id: 4, title: 'Vocabulary Practice Worksheet', subject: 'English', class: 'English B', fileType: 'DOC', uploadDate: '2026-05-25', description: 'Vocabulary exercises for Units 5–7 with context clues and usage examples.', downloadUrl: null, fileName: 'vocab_practice.docx' },
      { id: 5, title: 'Trigonometry Quick Reference', subject: 'Math', class: 'Math A', fileType: 'Image', uploadDate: '2026-06-01', description: 'Visual cheat sheet showing trig functions, unit circle, and key identities: \\(\\sin^2\\theta+\\cos^2\\theta=1\\).', downloadUrl: null, fileName: 'trig_reference.png' },
      { id: 6, title: 'Student Grade Tracker Template', subject: 'English', class: 'English A', fileType: 'XLS', uploadDate: '2026-06-03', description: 'Spreadsheet template for tracking student grades, attendance, and progress notes.', downloadUrl: null, fileName: 'grade_tracker.xlsx' },
    ];

    var attendanceWeekly = [72, 78, 83, 80, 87, 90];
    var attendanceLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];

    // ============================================================
    // STATE
    // ============================================================
    var currentHwFilter = 'All';
    var currentMatFilter = 'All';
    var isDark = (function () { try { return localStorage.getItem('th_dark') === '1'; } catch (e) { return false; } })();
    var isCompact = false;
    var editMode = false;
    var currentDeckView = null;
    var studyState = null;

    // ============================================================
    // HELPERS
    // ============================================================
    function getGrade(score) {
      if (score >= 90) return 'A';
      if (score >= 80) return 'B';
      if (score >= 70) return 'C';
      if (score >= 60) return 'D';
      return 'F';
    }
    function gradeClass(g) { return { A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', F: 'grade-d' }[g] || ''; }
    function getInitials(name) { return name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase(); }
    function avgScore(s) { return Math.round((s.mathScore + s.engScore) / 2); }
    function escHtml(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
    function escAttr(str) { return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function getAttendHistory(student) {
      // Lịch sử THẬT từ attendance_records (20 buổi gần nhất của học sinh)
      var byDate = {};
      attendanceRecords.forEach(function (r) {
        if (r.studentRef === String(student.id) || (r.studentName && r.studentName === student.name)) {
          byDate[r.date] = r.status;
        }
      });
      var dates = Object.keys(byDate).sort(); // cũ -> mới
      var arr = dates.slice(-20).map(function (d) { return byDate[d]; });
      var present = 0, absent = 0, late = 0;
      arr.forEach(function (a) { if (a === 'present') present++; else if (a === 'absent') absent++; else late++; });
      return { arr: arr, present: present, absent: absent, late: late, total: dates.length };
    }

    function fileBadgeClass(type) {
      return { PDF: 'pdf', PPT: 'ppt', DOC: 'doc', XLS: 'xls', Image: 'img' }[type] || 'pdf';
    }

    function generateMockBlob(name, type) {
      var content = 'This is a mock file: ' + name + ' (' + type + ')\nGenerated by Tutor Hub for demonstration purposes.\n';
      return URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    }

    // ============================================================
    // EDIT MODE
    // ============================================================
    function toggleEditMode() {
      editMode = !editMode;
      document.body.classList.toggle('edit-mode', editMode);
      var btn = document.getElementById('editModeBtn');
      var badge = document.getElementById('editBadge');
      btn.classList.toggle('active', editMode);
      if (badge) badge.style.display = editMode ? 'inline-flex' : 'none';
      var lbl = document.getElementById('editModeBtnLabel');
      if (lbl) lbl.textContent = editMode ? t('editmode.on') : t('editmode.off');
      showToast(editMode ? 'Edit Mode activated — you can now add, edit, and delete items.' : 'Edit Mode deactivated.', editMode ? 'warning' : 'info');
      var active = document.querySelector('.section.active');
      if (active) {
        var id = active.id.replace('section-', '');
        if (id === 'students') renderStudents();
        if (id === 'classes') renderClasses();
        if (id === 'homework') renderHomework();
        if (id === 'flashcards') renderDecks();
        if (id === 'materials') renderMaterials();
        if (id === 'schedule') renderSchedule();
      }
    }

    // ============================================================
    // NAVIGATION
    // ============================================================
    function showSection(id) {
      if (currentUser && !canAccessSection(id)) {
        showToast('Access restricted for your role.', 'error');
        return;
      }
      currentSection = id;
      history.replaceState(null, '', '#' + id);
      // Persist across full reloads — the iframe reloads without its hash,
      // so localStorage is what actually restores the tab.
      try { localStorage.setItem('th_section', id); } catch (e) { }
      // sessionStorage: nguồn ưu tiên khi khôi phục sau F5 trong CÙNG phiên tab
      // (khác localStorage ở chỗ nó tự xoá khi đóng tab hẳn — không "kẹt" section
      // cũ sang lần đăng nhập mới ở máy khác/tab khác).
      try { sessionStorage.setItem('th_last_section', id); } catch (e) { }
      document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); });
      var secEl = document.getElementById('section-' + id);
      if (secEl) secEl.classList.add('active');
      renderNavigation();
      var titles = {
        'dashboard': 'Tổng quan', 'students': 'Học sinh', 'classes': 'Lớp học', 'homework': 'Bài tập',
        'flashcards': 'Thẻ học', 'pomodoro': 'Pomodoro', 'materials': 'Tài liệu', 'attendance': 'Điểm danh',
        'scores': 'Điểm số', 'payments': 'Thanh toán', 'schedule': 'Lịch học', 'reports': 'Báo cáo',
        'parent-portal': 'Cổng phụ huynh', 'student-portal': 'Cổng học sinh', 'settings': 'Cài đặt',
        'assignments': 'Bài tập & Nộp bài', 'users': 'Quản lý người dùng', 'subjects': 'Môn học'
      };
      document.getElementById('pageTitle').textContent = titles[id] || id;
      closeSidebar();

      // Reset flashcard sub-views
      if (id === 'flashcards') {
        document.getElementById('flashcards-list-view').style.display = '';
        document.getElementById('flashcards-deck-view').style.display = 'none';
        document.getElementById('flashcards-study-view').style.display = 'none';
        currentDeckView = null;
        studyState = null;
      }

      if (id === 'students') renderStudents();
      if (id === 'classes') renderClasses();
      if (id === 'homework') renderHomework();
      if (id === 'flashcards') renderDecks();
      if (id === 'pomodoro') renderPomodoro();
      if (id === 'materials') renderMaterials();
      if (id === 'attendance') renderAttendance();
      if (id === 'scores') renderScores();
      if (id === 'payments') renderPayments();
      if (id === 'parent-portal') initParentPortal();
      if (id === 'student-portal') initStudentPortal();
      if (id === 'schedule') renderSchedule();
      if (id === 'reports') renderReports();
      if (id === 'assignments') renderAssignments();
      if (id === 'users') { loadUsersFromDb(); }
      if (id === 'subjects') { renderSubjects(); }
      if (id === 'settings') { renderSettings(); }
      if (id === 'dashboard') { try { renderDashboard(); } catch (e) { } }
      if (id === 'dashboard') { renderWelcome(); renderDashLists(); renderStudents(); }
      try { injectHelpTips(secEl || document); } catch (e) { }
    }

    function toggleSidebar() {
      if (window.innerWidth > 768) {
        // Desktop: ẩn/hiện hẳn sidebar, nhớ lựa chọn
        var hidden = document.body.classList.toggle('sidebar-hidden');
        try { localStorage.setItem('th_sidebar_hidden', hidden ? '1' : '0'); } catch (e) { }
      } else {
        // Mobile: drawer trượt + overlay
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('overlay').classList.toggle('visible');
      }
    }
    function closeSidebar() {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('overlay').classList.remove('visible');
    }

    // ── FONT SIZE (persisted) ────────────────────────────────────
    var FONT_SIZES = { small: 0.9, normal: 1, large: 1.1, xlarge: 1.25 };
    function setFontSize(key) {
      if (!FONT_SIZES[key]) key = 'normal';
      document.body.style.zoom = FONT_SIZES[key];
      try { localStorage.setItem('th_fontsize', key); } catch (e) { }
      var sel = document.getElementById('settingFontSize');
      if (sel && sel.value !== key) sel.value = key;
    }

    // ============================================================
    // THEME
    // ============================================================
    function toggleTheme() {
      isDark = !isDark;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
      document.getElementById('themeBtn').innerHTML = svgIcon(isDark ? 'sun' : 'moon', 19);
      var t = document.getElementById('darkModeToggle');
      if (t) { if (isDark) t.classList.add('on'); else t.classList.remove('on'); }
      try { localStorage.setItem('th_dark', isDark ? '1' : '0'); } catch (e) { }
      refreshCharts();
    }

    function setAccent(color) {
      document.documentElement.style.setProperty('--accent', color);
      document.documentElement.style.setProperty('--sidebar-active', color);
    }

    function toggleCompact() {
      isCompact = !isCompact;
      document.getElementById('compactToggle').classList.toggle('on', isCompact);
      var sidebar = document.getElementById('sidebar');
      if (isCompact) {
        sidebar.style.width = '64px';
        document.getElementById('main').style.marginLeft = '64px';
        sidebar.querySelectorAll('.logo-text, .sidebar-section, .user-info, .nav-item span:last-child').forEach(function (el) { el.style.display = 'none'; });
      } else {
        sidebar.style.width = '';
        document.getElementById('main').style.marginLeft = '';
        sidebar.querySelectorAll('.logo-text, .sidebar-section, .user-info, .nav-item span:last-child').forEach(function (el) { el.style.display = ''; });
      }
    }

    function renderSettings() {
      if (!currentUser) return;
      var n = document.getElementById('settingName'); if (n) n.value = currentUser.name || '';
      var e = document.getElementById('settingEmail'); if (e) e.value = currentUser.email || '';
      var r = document.getElementById('settingRole'); if (r) r.value = currentUser.role || '';
      // Ẩn "Demo Account Switcher" khi đã đăng nhập thật (có Supabase)
      var demo = document.getElementById('settingsDemoGroup'); if (demo) demo.style.display = _db ? 'none' : '';
      // Dữ liệu mẫu: chỉ hiện cho GV/Admin đã kết nối DB
      var isTA = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      var sdg = document.getElementById('sampleDataGroup'); if (sdg) sdg.style.display = (_db && isTA) ? '' : 'none';
      try { renderSampleDataControls(); } catch (e) { }
      // Đồng bộ ô chọn cỡ chữ + trạng thái dark mode với giá trị đã lưu
      var fs = document.getElementById('settingFontSize');
      if (fs) { try { fs.value = localStorage.getItem('th_fontsize') || 'normal'; } catch (e) { fs.value = 'normal'; } }
      var dt = document.getElementById('darkModeToggle');
      if (dt) dt.classList.toggle('on', isDark);
    }

    function updateProfile() {
      var name = document.getElementById('settingName').value;
      var role = document.getElementById('settingRole').value;
      document.getElementById('sidebarName').textContent = name;
      document.getElementById('sidebarRole').textContent = role;
      // Chỉ đổi chữ cái viết tắt khi CHƯA dùng ảnh đại diện
      if (currentUser && !_isAvatarUrl(currentUser.avatar)) {
        var initials = name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
        currentUser.avatar = initials;
        _setAvatarEl(document.getElementById('sidebarAvatar'), currentUser);
        _setAvatarEl(document.getElementById('topAvatar'), currentUser);
      }
      // Lưu tên mới vào hồ sơ Supabase
      if (_db && _dbUserId && name && name.trim()) {
        _db.from('profiles').update({ name: name.trim() }).eq('id', _dbUserId)
          .then(function (r) { if (r.error) console.warn('save profile name', r.error.message); });
      }
    }

