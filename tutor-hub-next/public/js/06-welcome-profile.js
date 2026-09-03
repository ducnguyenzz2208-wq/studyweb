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
          ? '<span style="color:var(--fg-success);font-weight:700;">✓</span>'
          : '<span style="color:var(--text-muted);">○</span>';
        var text = s.done
          ? '<span style="color:var(--text-muted);text-decoration:line-through;">' + s.label + '</span>'
          : '<a href="#" onclick="' + s.fn + ';return false;" style="color:var(--fg-info);text-decoration:none;font-weight:600;">' + s.label + ' →</a>';
        return '<div style="display:flex;align-items:center;gap:10px;padding:6px 0;">' + mark + text + '</div>';
      }).join('');

      box.innerHTML =
        '<div style="background:var(--card,#fff);border:1px solid var(--border,#e2e8f0);border-radius:14px;padding:18px 20px;margin-bottom:18px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<strong style="font-size:15px;display:inline-flex;align-items:center;gap:8px;"><span style="color:var(--accent);">' + svgIcon('scores', 17) + '</span>Bắt đầu nhanh</strong>' +
        '<button onclick="dismissOnboard()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:13px;">Bỏ qua</button>' +
        '</div>' +
        '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Hoàn thành ' + doneCount + '/' + steps.length + ' bước để thiết lập trung tâm của bạn.</div>' +
        '<div style="height:6px;background:var(--bg,#eef2f7);border-radius:999px;overflow:hidden;margin-bottom:12px;">' +
        '<div style="height:100%;width:' + pct + '%;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:999px;"></div></div>' +
        items +
        _onboardSampleRow() +
        '</div>';
    }

    // Gợi ý "nạp/xoá dữ liệu mẫu" ngay trong checklist — chỉ khi đã kết nối DB.
    function _onboardSampleRow() {
      if (typeof _db === 'undefined' || !_db) return '';
      var loaded = (typeof hasSampleData === 'function') && hasSampleData();
      var action = loaded
        ? '<a href="#" onclick="clearSampleData();return false;" style="color:var(--fg-danger);text-decoration:none;font-weight:600;">Xoá dữ liệu mẫu</a>'
        : '<a href="#" onclick="loadSampleData();return false;" style="color:var(--accent);text-decoration:none;font-weight:600;">Nạp dữ liệu mẫu →</a>';
      var hint = loaded ? 'Đã nạp dữ liệu mẫu để xem thử.' : 'Chưa muốn nhập tay? ';
      return '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:13px;color:var(--text-muted);">' +
        hint + action + '</div>';
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
        '<p style="color:var(--text-muted);font-size:13px;margin-top:14px;">Cần trợ giúp? Bấm biểu tượng dấu hỏi ở góc trên bất cứ lúc nào.</p>' +
        '</div>' +
        '<div class="modal-footer"><button class="btn btn-primary" onclick="closeModal()">Bắt đầu</button></div>',
        'modal-sm'
      );
    }

    // ── HELP / FAQ & USER GUIDE (DÀNH CHO HỌC SINH CẤP 2) ───────────
    function switchHelpTab(tabId) {
      var overlay = document.getElementById('modalOverlay');
      if (!overlay) return;
      var tabs = overlay.querySelectorAll('.help-tab-btn');
      var panes = overlay.querySelectorAll('.help-tab-pane');
      Array.prototype.forEach.call(tabs, function (btn) {
        if (btn.getAttribute('data-tab') === tabId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      Array.prototype.forEach.call(panes, function (pane) {
        if (pane.id === 'help-tab-' + tabId) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    }
    window.switchHelpTab = switchHelpTab;

    function filterHelpFaq(q) {
      var query = (q || '').toLowerCase().trim();
      var cards = document.querySelectorAll('.help-faq-card');
      Array.prototype.forEach.call(cards, function (card) {
        var text = card.textContent.toLowerCase();
        card.style.display = (!query || text.includes(query)) ? '' : 'none';
      });
    }
    window.filterHelpFaq = filterHelpFaq;

    function openHelp() {
      var html =
        '<div class="modal-header">' +
          '<div>' +
            '<div class="help-header-title">' + svgIcon('help', 22) + ' Cẩm nang & Hướng dẫn sử dụng</div>' +
            '<div class="help-header-sub">Dành cho các bạn học sinh Tutor Hub — Học vui, nhớ lâu, tự tin điểm cao! ✨</div>' +
          '</div>' +
          '<button class="modal-close" onclick="closeModal()" aria-label="Đóng">✕</button>' +
        '</div>' +
        '<div class="modal-body">' +
          '<div class="help-tabs-bar">' +
            '<button class="help-tab-btn active" data-tab="flashcard" onclick="switchHelpTab(\'flashcard\')">' +
              '🗂️ Bí kíp Thẻ học (Flashcards)' +
            '</button>' +
            '<button class="help-tab-btn" data-tab="homework" onclick="switchHelpTab(\'homework\')">' +
              '📝 Bài tập & Nộp bài' +
            '</button>' +
            '<button class="help-tab-btn" data-tab="focus" onclick="switchHelpTab(\'focus\')">' +
              '⏱️ Góc tập trung & Tiện ích' +
            '</button>' +
            '<button class="help-tab-btn" data-tab="faq" onclick="switchHelpTab(\'faq\')">' +
              '❓ Hỏi đáp thường gặp (FAQ)' +
            '</button>' +
          '</div>' +

          '<div class="help-tab-content-wrap">' +

            // ── TAB 1: FLASHCARD (TRỌNG TÂM) ──
            '<div class="help-tab-pane active" id="help-tab-flashcard">' +
              '<div class="help-hero-banner">' +
                '<div class="help-hero-icon">🗂️</div>' +
                '<div>' +
                  '<div class="help-hero-title">Flashcard là gì? — Bí quyết ghi nhớ từ siêu tốc!</div>' +
                  '<div class="help-hero-desc">Mỗi chiếc thẻ gồm 2 mặt: Mặt trước là <strong>Từ vựng / Câu hỏi / Công thức</strong>, lật sang Mặt sau là <strong>Nghĩa / Đáp án / Ví dụ</strong>. Học bằng cách tự nhớ lại rồi lật kiểm tra giúp não bộ ghi nhớ sâu gấp nhiều lần so với chỉ đọc sách thông thường!</div>' +
                '</div>' +
              '</div>' +

              '<h4 style="font-size:15px;margin:0 0 12px 0;display:flex;align-items:center;gap:8px;">' +
                '🚀 4 Chế độ học siêu đỉnh bạn nhất định phải thử:' +
              '</h4>' +

              '<div class="help-grid-2">' +
                // Chế độ 1: Học ngay
                '<div class="help-card">' +
                  '<div class="help-card-head">' +
                    '<div class="help-card-title">🎯 1. Học ngay (Lật thẻ cơ bản)</div>' +
                    '<span class="help-pill green">Làm quen</span>' +
                  '</div>' +
                  '<div class="help-card-body">' +
                    '<p style="margin:0 0 8px 0;">Dành cho khi bạn mới bắt đầu bài học mới:</p>' +
                    '• Bấm vào thẻ (hoặc phím <span class="help-kbd">Space</span>) để lật xem nghĩa mặt sau.<br>' +
                    '• Bấm mũi tên <span class="help-kbd">←</span> <span class="help-kbd">→</span> để lướt qua các từ.<br>' +
                    '• <strong>Tự động đọc:</strong> Mở thẻ là máy tự phát âm giọng chuẩn bản xứ để bạn bắt chước theo ngay.' +
                  '</div>' +
                '</div>' +

                // Chế độ 2: Chế độ Học
                '<div class="help-card">' +
                  '<div class="help-card-head">' +
                    '<div class="help-card-title">🧠 2. Chế độ Học (Leitner thông minh)</div>' +
                    '<span class="help-pill purple">Nhớ lâu ×3</span>' +
                  '</div>' +
                  '<div class="help-card-body">' +
                    '<p style="margin:0 0 8px 0;">Phương pháp lặp lại ngắt quãng (Spaced Repetition):</p>' +
                    '• <strong>Hộp 0 (Làm quen):</strong> Trắc nghiệm 4 đáp án (bấm số 1, 2, 3, 4).<br>' +
                    '• <strong>Hộp 1 & 2 (Nhớ sâu):</strong> Tự tay gõ từ vào ô để nhớ chắc từng chữ.<br>' +
                    '• <strong>Hộp 3:</strong> Chúc mừng, bạn đã thuộc làu từ này!' +
                    '<div class="help-tip-box">💡 <strong>Sai không sợ:</strong> Nếu trả lời nhầm, máy sẽ hiện ngay đáp án đúng và cho từ đó lặp lại sau 2-3 câu để bạn làm lại tới khi thuộc 100%!</div>' +
                  '</div>' +
                '</div>' +

                // Chế độ 3: Bài kiểm tra
                '<div class="help-card">' +
                  '<div class="help-card-head">' +
                    '<div class="help-card-title">📝 3. Bài kiểm tra (Test Mode)</div>' +
                    '<span class="help-pill amber">Thi thử chấm điểm</span>' +
                  '</div>' +
                  '<div class="help-card-body">' +
                    '<p style="margin:0 0 8px 0;">Tự động sinh đề kiểm tra tổng hợp từ 10 - 20 câu:</p>' +
                    '• Trộn 3 dạng câu: <strong>Trắc nghiệm</strong> + <strong>Đúng/Sai</strong> + <strong>Điền từ</strong>.<br>' +
                    '• Làm xong bấm <strong>Nộp bài</strong>: Xem ngay điểm số %, câu đúng tô xanh ✅, câu sai tô đỏ ❌ kèm lời giải chuẩn.<br>' +
                    '• Đạt điểm từ 80% trở lên sẽ có mưa pháo hoa 🎊 chúc mừng!' +
                  '</div>' +
                '</div>' +

                // Chế độ 4: Ghép thẻ
                '<div class="help-card">' +
                  '<div class="help-card-head">' +
                    '<div class="help-card-title">🎮 4. Trò chơi Ghép thẻ (Matching Game)</div>' +
                    '<span class="help-pill">Đua tốc độ</span>' +
                  '</div>' +
                  '<div class="help-card-body">' +
                    '<p style="margin:0 0 8px 0;">Vừa chơi game vừa ôn tập phản xạ từ vựng:</p>' +
                    '• Lưới gồm các ô từ và nghĩa bị xáo trộn lung tung.<br>' +
                    '• Bấm chọn 1 từ và 1 nghĩa tương ứng để chúng biến mất.<br>' +
                    '• Đồng hồ đếm giây bấm giờ: Cố gắng ghép thật nhanh để phá <strong>Kỷ lục cá nhân (🏆 Best Record)</strong> của chính bạn!' +
                  '</div>' +
                '</div>' +
              '</div>' +

              // Tính năng thông minh: IPA + Fuzzy matching
              '<h4 style="font-size:15px;margin:18px 0 12px 0;display:flex;align-items:center;gap:8px;">' +
                '✨ Các tính năng thông minh hỗ trợ bạn học tập:' +
              '</h4>' +

              '<div class="help-grid-2">' +
                '<div class="help-card">' +
                  '<div class="help-card-title">🤖 Chấm tự luận thông minh (Fuzzy Matching)</div>' +
                  '<div class="help-card-body" style="margin-top:8px;">' +
                    'Không lo bị trừ điểm oan khi gõ câu trả lời:<br>' +
                    '• <strong>Bỏ qua từ chỉ loại:</strong> Đáp án là <em>"con mèo"</em>, bạn gõ <em>"mèo"</em> vẫn tính là <strong>ĐÚNG ✅</strong>!<br>' +
                    '• <strong>Bỏ qua mạo từ tiếng Anh:</strong> Đáp án là <em>"an apple"</em> hay <em>"to study"</em>, bạn chỉ cần gõ <em>"apple"</em> hay <em>"study"</em>.<br>' +
                    '• <strong>Tha thứ lỗi gõ nhầm nhẹ:</strong> Lỡ gõ nhầm 1 chữ cái? Máy báo <strong>"Gần đúng"</strong> và nhắc bạn chú ý chứ không bắt học lại từ đầu!' +
                  '</div>' +
                '</div>' +

                '<div class="help-card">' +
                  '<div class="help-card-title">🔊 Phát âm bản xứ & Phiên âm IPA chuẩn</div>' +
                  '<div class="help-card-body" style="margin-top:8px;">' +
                    '• <strong>Tự sinh phiên âm quốc tế IPA:</strong> Mọi thẻ tiếng Anh đều có phiên âm rõ ràng (ví dụ: <code>dog /dɒɡ/</code>, <code>apple /ˈæp.l̩/</code>) giúp bạn phát âm chuẩn xác.<br>' +
                    '• <strong>Nút loa 🔊:</strong> Bấm vào loa ở bất cứ đâu để nghe lại phát âm.<br>' +
                    '• <strong>Cài đặt giọng đọc:</strong> Bấm nút <em>"🔊 Giọng..."</em> ở thanh công cụ để chọn giọng Nam / Nữ hoặc ghim giọng đọc tự nhiên (Natural Voice) bạn ưng ý nhất.' +
                  '</div>' +
                '</div>' +
              '</div>' +

              // Bảng phím tắt
              '<div class="help-card" style="margin-top:14px;">' +
                '<div class="help-card-title">⌨️ Bảng phím tắt thần tốc (cho máy tính)</div>' +
                '<table class="help-kbd-table">' +
                  '<tbody>' +
                    '<tr><td style="width:160px;"><span class="help-kbd">Space</span> (Phím cách)</td><td>Lật mặt trước ↔ mặt sau của thẻ</td></tr>' +
                    '<tr><td><span class="help-kbd">←</span> và <span class="help-kbd">→</span></td><td>Chuyển sang thẻ trước hoặc thẻ kế tiếp</td></tr>' +
                    '<tr><td><span class="help-kbd">1</span> <span class="help-kbd">2</span> <span class="help-kbd">3</span> <span class="help-kbd">4</span></td><td>Chọn nhanh đáp án trắc nghiệm A, B, C, D</td></tr>' +
                    '<tr><td><span class="help-kbd">Enter</span></td><td>Gửi câu trả lời tự luận hoặc chuyển sang câu tiếp theo</td></tr>' +
                    '<tr><td><span class="help-kbd">Esc</span></td><td>Thoát khỏi chế độ học và quay lại danh sách bộ thẻ</td></tr>' +
                  '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +

            // ── TAB 2: BÀI TẬP & NỘP BÀI ──
            '<div class="help-tab-pane" id="help-tab-homework">' +
              '<div class="help-hero-banner">' +
                '<div class="help-hero-icon">📝</div>' +
                '<div>' +
                  '<div class="help-hero-title">Xem bài tập & Nộp bài cho thầy cô cực kỳ đơn giản!</div>' +
                  '<div class="help-hero-desc">Không lo bị sót bài tập về nhà! Bạn có thể xem đề bài, kiểm tra hạn chót, chụp ảnh bài làm trong vở rồi gửi lên để thầy cô chấm điểm và nhận xét ngay.</div>' +
                '</div>' +
              '</div>' +

              '<div class="help-steps-wrap">' +
                '<div class="help-step-item">' +
                  '<div class="help-step-number">1</div>' +
                  '<div class="help-step-info">' +
                    '<div class="help-step-title">Xem bài tập & Kiểm tra hạn chót</div>' +
                    '<div class="help-step-desc">' +
                      'Vào mục <strong>Bài tập về nhà</strong> ở menu bên trái. Mỗi bài tập đều có huy hiệu đếm ngược hạn nộp:<br>' +
                      '• <span class="help-pill green">Còn 3 ngày</span> hoặc <span class="help-pill amber">Còn vài giờ</span>: Hãy hoàn thành sớm để không bị vội.<br>' +
                      '• <span class="help-pill" style="background:rgba(239,68,68,0.15);color:#ef4444;">Quá hạn</span>: Bài đã trễ hạn, cần nộp bù gấp cho thầy cô!' +
                    '</div>' +
                  '</div>' +
                '</div>' +

                '<div class="help-step-item">' +
                  '<div class="help-step-number">2</div>' +
                  '<div class="help-step-info">' +
                    '<div class="help-step-title">Làm bài & Chụp ảnh / Tải tệp lên</div>' +
                    '<div class="help-step-desc">' +
                      'Bấm vào bài tập để mở trang chi tiết bài nộp:<br>' +
                      '• Nếu dùng điện thoại: Bấm biểu tượng <strong>Máy ảnh 📷</strong> để chụp trực tiếp các trang vở bài làm.<br>' +
                      '• Nếu dùng máy tính: Bấm nút <strong>Chọn tệp</strong> để tải lên ảnh chụp bài làm hoặc file PDF / Word.<br>' +
                      '• Có thể tải nhiều ảnh cùng lúc nếu bài tập dài nhiều trang.' +
                    '</div>' +
                  '</div>' +
                '</div>' +

                '<div class="help-step-item">' +
                  '<div class="help-step-number">3</div>' +
                  '<div class="help-step-info">' +
                    '<div class="help-step-title">Bấm Nộp bài & Cập nhật khi cần</div>' +
                    '<div class="help-step-desc">' +
                      'Bấm nút <strong>Nộp bài</strong> màu xanh. Hệ thống sẽ ghi nhận chính xác ngày giờ nộp của bạn.<br>' +
                      '💡 <em>Mẹo nhỏ:</em> Nếu bạn chụp thiếu trang hoặc muốn sửa lại bài trước hạn chót, chỉ cần bấm vào bài đó và chọn tải lại bản mới rồi bấm <strong>Cập nhật bài nộp</strong>!' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              '<div class="help-card">' +
                '<div class="help-card-title">🎯 Xem Điểm số & Lời phê của Thầy Cô</div>' +
                '<div class="help-card-body" style="margin-top:8px;">' +
                  'Khi thầy cô chấm bài xong, quả chuông 🔔 ở góc trên màn hình sẽ có thông báo đỏ.<br>' +
                  'Bạn bấm vào thông báo hoặc mở bài tập đó ra sẽ thấy ngay: <strong>Điểm số</strong> (thang điểm 10) cùng <strong>Lời nhận xét chi tiết</strong> của thầy cô hướng dẫn bạn sửa những chỗ còn nhầm lẫn.' +
                '</div>' +
              '</div>' +
            '</div>' +

            // ── TAB 3: TẬP TRUNG & TIỆN ÍCH ──
            '<div class="help-tab-pane" id="help-tab-focus">' +
              '<div class="help-hero-banner">' +
                '<div class="help-hero-icon">⏱️</div>' +
                '<div>' +
                  '<div class="help-hero-title">Góc tập trung — Học năng suất, không lo mỏi mắt!</div>' +
                  '<div class="help-hero-desc">Kết hợp phương pháp quả cà chua Pomodoro cùng âm nhạc không lời giúp bạn giải bài nhanh hơn mà không bị cảm giác buồn ngủ hay mệt mỏi.</div>' +
                '</div>' +
              '</div>' +

              '<div class="help-grid-2">' +
                '<div class="help-card">' +
                  '<div class="help-card-head">' +
                    '<div class="help-card-title">🍅 Đồng hồ Pomodoro (25 phút)</div>' +
                    '<span class="help-pill">Tập trung</span>' +
                  '</div>' +
                  '<div class="help-card-body">' +
                    'Bí quyết học của các thủ khoa:<br>' +
                    '• <strong>25 phút học tập trung:</strong> Tắt hết thông báo, chỉ tập trung giải quyết bài tập.<br>' +
                    '• <strong>5 phút nghỉ giải lao:</strong> Đứng dậy uống nước, vươn vai, hít thở sâu.<br>' +
                    '• Sau 4 phiên học thì nghỉ dài 15 - 20 phút. Vừa học nhanh vừa không bị mỏi não!' +
                  '</div>' +
                '</div>' +

                '<div class="help-card">' +
                  '<div class="help-card-head">' +
                    '<div class="help-card-title">🎵 Góc âm nhạc Lo-Fi không lời</div>' +
                    '<span class="help-pill purple">Thư giãn</span>' +
                  '</div>' +
                  '<div class="help-card-body">' +
                    'Tích hợp sẵn ngay trong app không cần mở tab mới:<br>' +
                    '• Nghe các danh sách nhạc nhẹ nhàng, Lo-Fi từ YouTube Music hoặc SoundCloud.<br>' +
                    '• Nhạc không lời giúp át đi tiếng ồn xung quanh và kích thích não bộ tập trung giải đề nhanh hơn.' +
                  '</div>' +
                '</div>' +

                '<div class="help-card">' +
                  '<div class="help-card-head">' +
                    '<div class="help-card-title">📅 Lịch học & Điểm danh</div>' +
                    '<span class="help-pill green">Chuyên cần</span>' +
                  '</div>' +
                  '<div class="help-card-body">' +
                    '• Vào mục <strong>Lịch học</strong> để xem thời khoá biểu các buổi học trong tuần, phòng học và thời gian bắt đầu.<br>' +
                    '• Xem tỷ lệ chuyên cần (%) và lịch sử điểm danh từng buổi để luôn đi học đúng giờ.' +
                  '</div>' +
                '</div>' +

                '<div class="help-card">' +
                  '<div class="help-card-head">' +
                    '<div class="help-card-title">🌙 Giao diện Tối (Dark Mode)</div>' +
                    '<span class="help-pill amber">Bảo vệ mắt</span>' +
                  '</div>' +
                  '<div class="help-card-body">' +
                    '• Bấm vào biểu tượng Mặt trăng / Mặt trời ở góc trên bên phải màn hình để đổi chế độ sáng/tối.<br>' +
                    '• Khi học bài vào buổi tối, bạn nên bật <strong>Chế độ Tối</strong> để ánh sáng màn hình dịu nhẹ, không gây chói hay mỏi mắt.' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            // ── TAB 4: HỎI ĐÁP FAQ ──
            '<div class="help-tab-pane" id="help-tab-faq">' +
              '<div class="help-hero-banner">' +
                '<div class="help-hero-icon">❓</div>' +
                '<div>' +
                  '<div class="help-hero-title">Giải đáp thắc mắc thường gặp (FAQ)</div>' +
                  '<div class="help-hero-desc">Bấm vào từng câu hỏi bên dưới để xem lời giải đáp, hoặc nhập từ khoá vào ô tìm kiếm để tìm nhanh nhé!</div>' +
                '</div>' +
              '</div>' +

              '<input type="text" class="help-faq-search" placeholder="🔍 Nhập từ khoá tìm kiếm (ví dụ: phát âm, bài tập, mật khẩu, lặp lại)..." oninput="filterHelpFaq(this.value)">' +

              '<details class="help-faq-card" open>' +
                '<summary class="help-faq-q">1. Em gõ câu trả lời thiếu dấu hoặc nhầm 1 chữ cái có bị tính là sai không?</summary>' +
                '<div class="help-faq-a">' +
                  'Không bị phạt sai đâu nhé! Hệ thống có cơ chế so khớp thông minh (Fuzzy Answer Matching): nếu chỉ gõ nhầm 1 chữ cái nhỏ (sai số chính tả nhẹ) hoặc thiếu các từ chỉ loại tiếng Việt (như <em>"con", "cái", "quả"</em>) hoặc mạo từ tiếng Anh (<em>"a", "an", "the"</em>), máy vẫn tính là <strong>Gần đúng</strong> và nhắc bạn chú ý để rút kinh nghiệm chứ không trừ điểm oan!' +
                '</div>' +
              '</details>' +

              '<details class="help-faq-card">' +
                '<summary class="help-faq-q">2. Tại sao trong Chế độ Học (Learn Mode), có những từ cứ lặp đi lặp lại nhiều lần?</summary>' +
                '<div class="help-faq-a">' +
                  'Đây chính là bí quyết của phương pháp học ngắt quãng Leitner! Những từ bạn trả lời chưa đúng hoặc chưa chắc chắn sẽ được xếp vào hàng chờ và xuất hiện lại sau khoảng 2-3 câu hỏi để bạn luyện tập lại. Khi bạn trả lời đúng liên tục đến Hộp 3, từ đó mới được tính là <strong>"Đã thuộc làu"</strong>!' +
                '</div>' +
              '</details>' +

              '<details class="help-faq-card">' +
                '<summary class="help-faq-q">3. Em làm xong bài kiểm tra (Test Mode) có được làm lại không?</summary>' +
                '<div class="help-faq-a">' +
                  'Hoàn toàn được nhé! Mỗi lần bạn bấm nút <strong>"Làm lại bài test"</strong> hoặc <strong>"Đề mới"</strong>, hệ thống sẽ xáo trộn ngẫu nhiên bộ câu hỏi để bạn tha hồ thử sức lại đến khi nào đạt điểm 10 tuyệt đối thì thôi!' +
                '</div>' +
              '</details>' +

              '<details class="help-faq-card">' +
                '<summary class="help-faq-q">4. Tại sao máy em bấm nút loa 🔊 lại không nghe thấy tiếng phát âm?</summary>' +
                '<div class="help-faq-a">' +
                  'Bạn kiểm tra các bước sau nhé:<br>' +
                  '1. Kiểm tra xem loa máy tính hoặc tai nghe đã bật âm lượng chưa.<br>' +
                  '2. Kiểm tra xem tab trình duyệt có bị bấm tắt tiếng (Mute) không.<br>' +
                  '3. Nên dùng trình duyệt <strong>Microsoft Edge</strong> hoặc <strong>Google Chrome</strong> vì các trình duyệt này có sẵn các giọng đọc tự nhiên (Natural/Neural Voice) rất trong trẻo và chuẩn xác.' +
                '</div>' +
              '</details>' +

              '<details class="help-faq-card">' +
                '<summary class="help-faq-q">5. Em nộp bài tập rồi nhưng phát hiện chụp thiếu 1 trang thì làm sao?</summary>' +
                '<div class="help-faq-a">' +
                  'Đừng lo! Miễn là bài tập đó chưa hết hạn nộp, bạn chỉ cần bấm lại vào bài tập đó, tải thêm trang ảnh bị thiếu lên và bấm <strong>"Cập nhật bài nộp"</strong>. Thầy cô sẽ chấm theo bản nộp mới nhất của bạn!' +
                '</div>' +
              '</details>' +

              '<details class="help-faq-card">' +
                '<summary class="help-faq-q">6. Em quên mật khẩu đăng nhập vào app thì phải làm thế nào?</summary>' +
                '<div class="help-faq-a">' +
                  'Rất nhanh và đơn giản: Bạn hãy nhắn tin hoặc báo cho thầy cô giáo hoặc người quản lý trung tâm. Thầy cô có thể đặt lại mật khẩu mới cho bạn trong vòng 30 giây!' +
                '</div>' +
              '</details>' +

              '<details class="help-faq-card">' +
                '<summary class="help-faq-q">7. Em dùng điện thoại thông minh thì có vào học được không?</summary>' +
                '<div class="help-faq-a">' +
                  'Có nhé! Trang web Tutor Hub chạy rất mượt trên cả điện thoại (iPhone, Samsung, Xiaomi...), iPad lẫn máy tính. Bạn có thể mở web trên điện thoại để lướt thẻ học và chụp ảnh bài tập nộp bất cứ lúc nào.' +
                '</div>' +
              '</details>' +

              '<details class="help-faq-card">' +
                '<summary class="help-faq-q">8. Làm sao để em tự tạo một bộ thẻ Flashcard mới theo ý mình?</summary>' +
                '<div class="help-faq-a">' +
                  'Vào mục <strong>Thẻ ghi nhớ (Flashcards)</strong> ở menu bên trái. Bạn có thể bấm nút <strong>"+ Tạo bộ thẻ"</strong> hoặc nếu đã mở một bộ thẻ, bấm <strong>"+ Thêm thẻ"</strong> hoặc <strong>"📋 Nhập hàng loạt"</strong> để dán nhanh danh sách từ vựng theo mẫu <em>Từ vựng - Định nghĩa</em> chỉ trong nháy mắt.' +
                '</div>' +
              '</details>' +
            '</div>' +

          '</div>' +
        '</div>';

      openModal(html, 'help-modal');
    }

    function renderQuickActions() {
      var qa = document.getElementById('quickActionsBlock');
      if (!qa || !currentUser) return;
      var role = currentUser.role;
      var actions = [];
      if (role === 'Teacher' || role === 'Admin') {
        actions = [
          { icon: 'user-plus', label: t('qa.addStudent'), fn: "openStudentModal()" },
          { icon: 'file-plus', label: t('qa.addHomework'), fn: "showSection('assignments')" },
          { icon: 'plus-square', label: t('qa.addClass'), fn: "openClassModal()" },
          { icon: 'reports', label: t('qa.viewReports'), fn: "showSection('reports')" },
          { icon: 'folder-plus', label: t('qa.addMaterial'), fn: "openMaterialModal()" },
          { icon: 'flashcards', label: t('qa.addDeck'), fn: "openDeckModal()" },
        ];
      } else if (role === 'Student') {
        actions = [
          { icon: 'flashcards', label: 'Học Flashcards', fn: "showSection('flashcards')" },
          { icon: 'assignments', label: 'Xem bài tập', fn: "showSection('student-portal')" },
          { icon: 'schedule', label: 'Lịch của tôi', fn: "showSection('schedule')" },
          { icon: 'materials', label: 'Tài liệu', fn: "showSection('materials')" },
        ];
      } else if (role === 'Parent') {
        actions = [
          { icon: 'reports', label: 'Tiến độ của con', fn: "showSection('parent-portal')" },
          { icon: 'schedule', label: 'Lịch học', fn: "showSection('schedule')" },
          { icon: 'payments', label: 'Học phí', fn: "showSection('payments')" },
          { icon: 'materials', label: 'Tài liệu', fn: "showSection('materials')" },
        ];
      }
      if (!actions.length) { qa.innerHTML = ''; return; }
      qa.innerHTML = '<div class="quick-actions">' + actions.map(function (a) {
        return '<div class="qa-btn" onclick="' + a.fn + '"><div class="qa-icon">' + svgIcon(a.icon, 22) + '</div><div class="qa-label">' + a.label + '</div></div>';
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

