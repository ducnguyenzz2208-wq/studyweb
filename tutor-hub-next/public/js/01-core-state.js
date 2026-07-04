    // ============================================================
    // STATE
    // ============================================================
    var currentUser = null;
    var currentLang = 'en';
    var currentSection = 'dashboard';
    var currentClassId = null;   // lớp đang chọn trong feed
    var _savingAssignment = false; // chống bấm Lưu nhiều lần khi đang upload

    // ── SUPABASE INTEGRATION ─────────────────────────────────────
    var _db = null;          // Supabase client (set by postMessage or direct init)
    var _dbUserId = null;    // Auth UID for DB writes

    // ── SUBJECTS ─────────────────────────────────────────────────
    // Default subjects shown before DB loads; replaced when subjects table is fetched.
    var SUBJECTS = ['Math', 'English', 'Physics', 'Chemistry', 'Literature', 'Chinese', 'IT'];


    // Sync section when user hits browser back/forward
    window.addEventListener('hashchange', function () {
      if (!currentUser) return;
      var id = window.location.hash.replace(/^#/, '');
      if (id && id !== currentSection) showSection(id);
    });

    // Receive auth payload from Next.js parent frame
    window.addEventListener('message', function (event) {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== 'TUTOR_HUB_INIT') return;

      var cfg = event.data;
      // Init Supabase client with parent's creds
      if (window.supabase && cfg.supabaseUrl && cfg.supabaseKey) {
        _db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
        _dbUserId = cfg.user.id;
      }

      // Build currentUser from authenticated profile
      var u = cfg.user;
      currentUser = {
        id: u.id,
        email: u.email,
        role: u.role || 'Student',
        name: u.name || u.email.split('@')[0],
        avatar: u.avatar || u.name.replace(/[^A-Z]/g, '').slice(0, 2) || u.name.slice(0, 2).toUpperCase(),
        subject: u.subject || '',
        joined: 'Jan 2024',
        lastLogin: new Date().toLocaleString()
      };

      setLang(u.language || 'vi');
      showApp();

      // Restore the auth session FIRST, then load data.
      // setSession() is async — querying before it resolves sends requests
      // with no JWT and RLS rejects them (401), wiping materials/students.
      if (_db) {
        if (cfg.accessToken && cfg.refreshToken) {
          _db.auth.setSession({ access_token: cfg.accessToken, refresh_token: cfg.refreshToken })
            .then(function () { loadDbData(); })
            .catch(function (err) { console.error('setSession failed:', err); loadDbData(); });
        } else {
          setTimeout(loadDbData, 200);
        }
      }
    });

