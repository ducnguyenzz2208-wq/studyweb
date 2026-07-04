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
        var _tb = document.getElementById('themeBtn'); if (_tb) _tb.textContent = '☀️';
        var _dt = document.getElementById('darkModeToggle'); if (_dt) _dt.classList.add('on');
      }
    } catch (e) { }
