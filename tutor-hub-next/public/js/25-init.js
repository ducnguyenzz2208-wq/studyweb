    // ============================================================
    // ERROR MONITORING (nhẹ) — ghi lỗi JS/promise vào localStorage để
    // gỡ lỗi khi người dùng báo "bị lỗi". Xem bằng: thErrors() trong console.
    // ============================================================
    (function () {
      var LOG_KEY = 'th_errlog';
      function record(kind, msg, src) {
        try {
          var arr = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
          arr.push({ t: new Date().toISOString(), kind: kind, msg: String(msg == null ? '' : msg).slice(0, 300), src: src || '' });
          while (arr.length > 30) arr.shift();
          localStorage.setItem(LOG_KEY, JSON.stringify(arr));
        } catch (e) { }
      }
      window.addEventListener('error', function (e) { record('error', e.message, (e.filename || '') + ':' + (e.lineno || '')); });
      window.addEventListener('unhandledrejection', function (e) {
        var r = e && e.reason; record('promise', (r && (r.message || r)) || 'unhandledrejection', '');
      });
      window.thErrors = function () { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch (e) { return []; } };
      window.thClearErrors = function () { try { localStorage.removeItem(LOG_KEY); } catch (e) { } };
    })();

    // ============================================================
    // TRUY CẬP BÀN PHÍM cho các "nút" không phải thẻ <button>
    // ------------------------------------------------------------
    // App dựng nhiều control bằng div/span + onclick (thẻ bộ thẻ, ô lịch,
    // quick action, hàng chờ nhạc…). Chúng KHÔNG nằm trong luồng Tab nên
    // người dùng bàn phím / trình đọc màn hình không thao tác được
    // (WCAG 2.1.1 Keyboard, mức A).
    // Thay vì sửa tay ~50 chỗ ở 28 module (và lại hỏng khi thêm code mới),
    // nâng cấp tại MỘT nơi: quan sát DOM, gắn tabindex/role cho control mới
    // xuất hiện, và bắt Enter/Space ở tầng document.
    // ============================================================
    (function () {
      var SKIP = /^(button|a|input|select|textarea|label|option)$/;
      // Lớp phủ modal, khung thẻ lật… bấm được nhưng KHÔNG phải control cần Tab
      // (đều đã có control thật bên trong hoặc có phím tắt riêng).
      var SKIP_CLASS = ['modal-overlay', 'flashcard-wrapper'];

      function upgrade(scope) {
        var els = (scope || document).querySelectorAll('[onclick]');
        Array.prototype.forEach.call(els, function (el) {
          if (SKIP.test(el.tagName.toLowerCase())) return;
          if (el.hasAttribute('tabindex')) return;
          for (var i = 0; i < SKIP_CLASS.length; i++) if (el.classList.contains(SKIP_CLASS[i])) return;
          el.setAttribute('tabindex', '0');
          if (!el.getAttribute('role')) el.setAttribute('role', 'button');
        });
      }

      // Enter/Space kích hoạt giống <button>. Space phải preventDefault để
      // trang không bị cuộn xuống.
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
        var el = e.target;
        if (!el || !el.getAttribute || el.getAttribute('role') !== 'button') return;
        if (SKIP.test(el.tagName.toLowerCase())) return;   // <button> tự xử lý
        e.preventDefault();
        el.click();
      });

      // Chỉ theo dõi childList (không theo dõi attributes) → việc tự gắn
      // tabindex/role KHÔNG kích hoạt lại observer, không có vòng lặp.
      // Dùng setTimeout chứ KHÔNG dùng requestAnimationFrame: rAF bị tạm dừng
      // ở tab đang ẩn/nền, khi đó control render lúc tab ẩn sẽ không được nâng
      // cấp cho tới khi người dùng quay lại tab.
      var queued = false;
      function schedule() {
        if (queued) return; queued = true;
        setTimeout(function () { queued = false; upgrade(document); }, 0);
      }
      try {
        new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
      } catch (e) { }
      document.addEventListener('DOMContentLoaded', function () { upgrade(document); });
      upgrade(document);
      window.thA11yUpgrade = upgrade;   // gọi tay khi cần
    })();

    // ============================================================
    // INIT
    // ============================================================
    document.addEventListener('DOMContentLoaded', function () {
      // When running inside the Next.js iframe wrapper, hide everything and wait
      // for the TUTOR_HUB_INIT postMessage from the parent.
      if (window.parent !== window) {
        document.getElementById('sidebar').style.display = 'none';
        document.getElementById('main').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'none';
        return;
      }

      // Standalone / direct-file mode — show mock login screen as before
      document.getElementById('sidebar').style.display = 'none';
      document.getElementById('main').style.display = 'none';
      document.getElementById('loginScreen').style.display = 'flex';
      setLang('vi');
    });
    // Restore UI preferences (persist across reloads)
    try {
      if (localStorage.getItem('th_sidebar_hidden') === '1') document.body.classList.add('sidebar-hidden');
      setFontSize(localStorage.getItem('th_fontsize') || 'normal');
      if (localStorage.getItem('th_dark') === '1') {
        isDark = true;
        document.documentElement.setAttribute('data-theme', 'dark');
        var _tb = document.getElementById('themeBtn'); if (_tb) _tb.innerHTML = svgIcon('sun', 19);
        var _dt = document.getElementById('darkModeToggle'); if (_dt) _dt.classList.add('on');
      }
    } catch (e) { }
