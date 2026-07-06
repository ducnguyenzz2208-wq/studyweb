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
