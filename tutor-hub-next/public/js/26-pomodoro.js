    // ============================================================
    // POMODORO / STUDY TOOLS (port từ my-clone, viết lại theo kiến trúc
    // classic-JS của Tutor Hub — global scope, lưu localStorage).
    // Gồm: Pomodoro timer, Focus Lock, Bảng ghi chú, Nhạc (YouTube), Chuỗi tập trung.
    // Dùng chung cho Giáo viên + Học sinh (ROLE_SECTIONS).
    // ============================================================
    function _lsGet(k, def) { try { var v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } }
    function _lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }

    // ── Helpers ngày/giờ ─────────────────────────────────────────
    function _pad2(n) { return String(n).padStart(2, '0'); }
    function _dateKey(d) { return d.getFullYear() + '-' + _pad2(d.getMonth() + 1) + '-' + _pad2(d.getDate()); }
    function _pomoTodayKey() { return _dateKey(new Date()); }
    function _fmtMinutes(t) { var h = Math.floor(t / 60), m = t % 60; if (h <= 0) return m + ' phút'; if (m === 0) return h + ' giờ'; return h + ' giờ ' + m + ' phút'; }
    function _fmtClock(ms) { var s = Math.max(0, Math.round(ms / 1000)); return _pad2(Math.floor(s / 60)) + ':' + _pad2(s % 60); }

    // ── State + settings ─────────────────────────────────────────
    var POMO_DEFAULTS = { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 };
    var POMO_PHASE_LABEL = { focus: 'Tập trung', shortBreak: 'Nghỉ ngắn', longBreak: 'Nghỉ dài' };
    function _pomoSettings() { var s = _lsGet('th_pomo_settings', {}); return { focusMinutes: +s.focusMinutes || POMO_DEFAULTS.focusMinutes, shortBreakMinutes: +s.shortBreakMinutes || POMO_DEFAULTS.shortBreakMinutes, longBreakMinutes: +s.longBreakMinutes || POMO_DEFAULTS.longBreakMinutes, sessionsBeforeLongBreak: +s.sessionsBeforeLongBreak || POMO_DEFAULTS.sessionsBeforeLongBreak }; }
    function _pomoState() { return _lsGet('th_pomo_state', { phase: 'focus', isRunning: false, phaseEndAt: null, remainingMs: POMO_DEFAULTS.focusMinutes * 60000, loggedMinutes: 0, completedFocusSessions: 0 }); }
    function _pomoSaveState(st) { _lsSet('th_pomo_state', st); }
    function _pomoPhaseDur(phase, s) { s = s || _pomoSettings(); return (phase === 'focus' ? s.focusMinutes : phase === 'shortBreak' ? s.shortBreakMinutes : s.longBreakMinutes) * 60000; }
    function _pomoAdvance(st, s) {
      if (st.phase === 'focus') { var c = st.completedFocusSessions + 1; var isLong = c % s.sessionsBeforeLongBreak === 0; return { phase: isLong ? 'longBreak' : 'shortBreak', completedFocusSessions: c }; }
      return { phase: 'focus', completedFocusSessions: st.completedFocusSessions };
    }

    // ── Nhật ký tập trung (theo ngày, phút) ──────────────────────
    function _focusLog() { return _lsGet('th_focus_log', {}); }
    function _focusAdd(key, mins) { if (mins <= 0) return; var l = _focusLog(); l[key] = (l[key] || 0) + mins; _lsSet('th_focus_log', l); }
    function _focusMinutesFor(key) { return _focusLog()[key] || 0; }

    function _pomoActive() { var el = document.getElementById('section-pomodoro'); return !!(el && el.classList.contains('active')); }

    // ── Vòng đếm (drift-resistant: dựa vào phaseEndAt = wall-clock) ──
    var _pomoInterval = null;
    function _pomoStartTimer() { if (_pomoInterval) return; _pomoInterval = setInterval(_pomoTick, 250); }
    function _pomoStopTimer() { if (_pomoInterval) { clearInterval(_pomoInterval); _pomoInterval = null; } }

    function _pomoTick() {
      var st = _pomoState();
      if (!st.isRunning || st.phaseEndAt == null) { _pomoStopTimer(); return; }
      var s = _pomoSettings();
      var dur = _pomoPhaseDur(st.phase, s);
      var remaining = Math.max(0, st.phaseEndAt - Date.now());
      var elapsedMin = Math.min(Math.floor(dur / 60000), Math.floor((dur - remaining) / 60000));
      // Cộng dồn phút tập trung vào nhật ký (mỗi phút 1 lần)
      if (st.phase === 'focus' && elapsedMin > st.loggedMinutes) {
        _focusAdd(_pomoTodayKey(), elapsedMin - st.loggedMinutes);
        st.loggedMinutes = elapsedMin; _pomoSaveState(st);
        if (_pomoActive()) _renderPomoStreak();
      }
      if (remaining <= 0) {
        var ended = st.phase;
        var adv = _pomoAdvance(st, s);
        _pomoSaveState({ phase: adv.phase, isRunning: false, phaseEndAt: null, remainingMs: _pomoPhaseDur(adv.phase, s), loggedMinutes: 0, completedFocusSessions: adv.completedFocusSessions });
        _pomoStopTimer();
        _pomoPhaseEndFeedback(ended, adv.phase);
        if (_pomoActive()) { _renderPomoTimer(); _renderPomoStreak(); }
        return;
      }
      if (_pomoActive()) _pomoUpdateTimerUI(remaining, dur, st);
    }

    function _pomoPhaseEndFeedback(endedPhase, nextPhase) {
      var msg = endedPhase === 'focus' ? 'Hết phiên tập trung — nghỉ một chút nhé! 🎉' : 'Hết giờ nghỉ — quay lại tập trung nào! 💪';
      try { showToast(msg, endedPhase === 'focus' ? 'success' : 'info'); } catch (e) { }
      try {
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        var ctx = new AC(); var o = ctx.createOscillator(); var g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = endedPhase === 'focus' ? 660 : 440;
        g.gain.setValueAtTime(0.001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        o.start(); o.stop(ctx.currentTime + 0.55); setTimeout(function () { try { ctx.close(); } catch (e) { } }, 800);
      } catch (e) { }
    }

    // ── Điều khiển ───────────────────────────────────────────────
    // Lưu ý: các thao tác hẹn giờ chỉ vẽ lại THẺ TIMER (không đụng nhạc/ghi chú)
    // để không làm gián đoạn nhạc đang phát.
    function startPomo() {
      var st = _pomoState(); if (st.isRunning) return;
      var remaining = st.remainingMs > 0 ? st.remainingMs : _pomoPhaseDur(st.phase);
      st.isRunning = true; st.remainingMs = remaining; st.phaseEndAt = Date.now() + remaining;
      _pomoSaveState(st); _pomoStartTimer(); _renderPomoTimer();
    }
    function pausePomo() {
      var st = _pomoState(); if (!st.isRunning || st.phaseEndAt == null) return;
      st.remainingMs = Math.max(0, st.phaseEndAt - Date.now()); st.isRunning = false; st.phaseEndAt = null;
      _pomoSaveState(st); _pomoStopTimer(); _renderPomoTimer();
    }
    function resetPomo() {
      var st = _pomoState(); st.isRunning = false; st.phaseEndAt = null; st.remainingMs = _pomoPhaseDur(st.phase); st.loggedMinutes = 0;
      _pomoSaveState(st); _pomoStopTimer(); _renderPomoTimer();
    }
    function skipPomo() {
      var st = _pomoState(); var s = _pomoSettings(); var adv = _pomoAdvance(st, s);
      _pomoSaveState({ phase: adv.phase, isRunning: false, phaseEndAt: null, remainingMs: _pomoPhaseDur(adv.phase, s), loggedMinutes: 0, completedFocusSessions: adv.completedFocusSessions });
      _pomoStopTimer(); _renderPomoTimer();
    }
    function openPomoSettings() {
      var s = _pomoSettings();
      var row = function (id, label, val, min, max) {
        return '<div class="form-group"><label>' + label + '</label>' +
          '<input class="form-input" type="number" id="' + id + '" min="' + min + '" max="' + max + '" value="' + val + '"></div>';
      };
      openModal('<div class="modal-header"><h3 style="display:flex;align-items:center;gap:8px;">' + svgIcon('pomodoro', 18) + 'Cài đặt Pomodoro</h3><button class="modal-close" onclick="closeModal()" aria-label="Đóng">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-row">' + row('pomoSetFocus', 'Tập trung (phút)', s.focusMinutes, 1, 120) + row('pomoSetShort', 'Nghỉ ngắn (phút)', s.shortBreakMinutes, 1, 60) + '</div>' +
        '<div class="form-row">' + row('pomoSetLong', 'Nghỉ dài (phút)', s.longBreakMinutes, 1, 60) + row('pomoSetCycle', 'Số phiên → nghỉ dài', s.sessionsBeforeLongBreak, 1, 12) + '</div>' +
        '</div><div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="savePomoSettings()">Lưu</button></div>', 'modal-sm');
    }
    function savePomoSettings() {
      var g = function (id, d) { var v = parseInt((document.getElementById(id) || {}).value, 10); return (isNaN(v) || v < 1) ? d : v; };
      var ns = { focusMinutes: g('pomoSetFocus', 25), shortBreakMinutes: g('pomoSetShort', 5), longBreakMinutes: g('pomoSetLong', 15), sessionsBeforeLongBreak: g('pomoSetCycle', 4) };
      _lsSet('th_pomo_settings', ns);
      var st = _pomoState();
      if (!st.isRunning) { st.remainingMs = _pomoPhaseDur(st.phase, ns); _pomoSaveState(st); }
      closeModal(); showToast('Đã lưu cài đặt Pomodoro.', 'success'); _renderPomoTimer();
    }

    // ── Vẽ đồng hồ (ring SVG) ────────────────────────────────────
    var POMO_R = 52, POMO_C = 2 * Math.PI * 52;
    function _pomoTimerCardHtml() {
      var st = _pomoState(); var s = _pomoSettings();
      var dur = _pomoPhaseDur(st.phase, s);
      var progress = dur > 0 ? 1 - st.remainingMs / dur : 0;
      var off = POMO_C * (1 - Math.min(1, Math.max(0, progress)));
      var isFocus = st.phase === 'focus';
      var stroke = isFocus ? 'var(--accent)' : 'var(--streak-3)';
      return '<div class="card pomo-card">' +
        '<div class="card-header"><div class="card-title" style="display:flex;align-items:center;gap:8px;">Pomodoro' +
        '<span class="badge ' + (isFocus ? 'badge-info' : 'badge-success') + '" id="pomoPhaseBadge">' + POMO_PHASE_LABEL[st.phase] + '</span></div>' +
        '<button class="btn btn-sm btn-ghost" aria-label="Cài đặt Pomodoro" onclick="openPomoSettings()">' + svgIcon('settings', 16) + '</button></div>' +
        '<div class="pomo-ring-wrap">' +
        '<svg viewBox="0 0 120 120" class="pomo-ring" aria-hidden="true">' +
        '<circle cx="60" cy="60" r="' + POMO_R + '" fill="none" stroke="var(--nav-hover-bg)" stroke-width="9"/>' +
        '<circle id="pomoRingFg" cx="60" cy="60" r="' + POMO_R + '" fill="none" stroke="' + stroke + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + POMO_C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 60 60)"/>' +
        '</svg>' +
        '<div class="pomo-ring-center"><div class="pomo-clock" id="pomoClock">' + _fmtClock(st.remainingMs) + '</div>' +
        '<div class="pomo-sessions" id="pomoSessions">' + st.completedFocusSessions + ' phiên hôm nay</div></div></div>' +
        '<div class="pomo-controls">' +
        '<button class="btn btn-ghost" aria-label="Đặt lại" onclick="resetPomo()">' + svgIcon('rotate', 18) + '</button>' +
        '<button class="btn btn-primary pomo-main-btn" onclick="' + (st.isRunning ? 'pausePomo()' : 'startPomo()') + '">' + (st.isRunning ? svgIcon('pause', 18) + ' Tạm dừng' : svgIcon('play', 18) + ' Bắt đầu') + '</button>' +
        '<button class="btn btn-ghost" aria-label="Bỏ qua phiên" onclick="skipPomo()">' + svgIcon('skip', 18) + '</button>' +
        '</div></div>';
    }
    function _pomoUpdateTimerUI(remaining, dur, st) {
      var clock = document.getElementById('pomoClock'); if (clock) clock.textContent = _fmtClock(remaining);
      var ring = document.getElementById('pomoRingFg');
      if (ring) { var progress = dur > 0 ? 1 - remaining / dur : 0; ring.setAttribute('stroke-dashoffset', (POMO_C * (1 - Math.min(1, Math.max(0, progress)))).toFixed(1)); }
    }
    function _renderPomoTimer() { var box = document.getElementById('pomoTimerCard'); if (box) box.innerHTML = _pomoTimerCardHtml(); }

    // ── Focus Lock ───────────────────────────────────────────────
    var _pomoFocusActive = false, _pomoFocusWarn = null;
    function togglePomoFocusLock() {
      if (_pomoFocusActive) {
        _pomoFocusActive = false; _pomoFocusWarn = null;
        if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) { } }
      } else {
        _pomoFocusActive = true; _pomoFocusWarn = null;
        try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () { }); } catch (e) { }
      }
      _renderPomoFocusBar();
    }
    function _pomoOnVisibility() { if (_pomoFocusActive && document.hidden) { _pomoFocusWarn = 'Bạn vừa rời khỏi tab trong lúc Khoá tập trung.'; _renderPomoFocusBar(); } }
    function _pomoOnFullscreen() { if (_pomoFocusActive && !document.fullscreenElement) { _pomoFocusWarn = 'Bạn vừa thoát toàn màn hình trong lúc Khoá tập trung.'; _renderPomoFocusBar(); } }
    function dismissPomoWarn() { _pomoFocusWarn = null; _renderPomoFocusBar(); }
    function _renderPomoFocusBar() {
      var btn = document.getElementById('pomoFocusBtn');
      if (btn) {
        btn.className = 'btn ' + (_pomoFocusActive ? 'btn-danger' : 'btn-ghost');
        btn.innerHTML = svgIcon(_pomoFocusActive ? 'lock' : 'unlock', 16) + ' ' + (_pomoFocusActive ? 'Tắt khoá tập trung' : 'Khoá tập trung');
      }
      var warn = document.getElementById('pomoWarnBar');
      if (warn) {
        warn.style.display = _pomoFocusWarn ? '' : 'none';
        warn.innerHTML = _pomoFocusWarn ? (svgIcon('alert-triangle', 16) + '<span>' + escHtml(_pomoFocusWarn) + '</span><button class="btn btn-sm btn-ghost" onclick="dismissPomoWarn()">Bỏ qua</button>') : '';
      }
    }

    // ── Ghi chú (sticky notes, tối đa 8) ─────────────────────────
    var POMO_MAX_NOTES = 8;
    var POMO_NOTE_COLORS = ['#fef9c3', '#fee2e2', '#dcfce7', '#dbeafe', '#f3e8ff', '#ffedd5', '#ccfbf1', '#fce7f3'];
    function _pomoNotes() { return _lsGet('th_notes', []); }
    function _pomoSaveNotes(n) { _lsSet('th_notes', n); }
    function addPomoNote() {
      var n = _pomoNotes(); if (n.length >= POMO_MAX_NOTES) { showToast('Tối đa ' + POMO_MAX_NOTES + ' ghi chú.', 'info'); return; }
      n.push({ id: 'note-' + Date.now() + '-' + Math.floor(Math.random() * 1e6), text: '', color: n.length % POMO_NOTE_COLORS.length, completed: false, createdAt: Date.now() });
      _pomoSaveNotes(n); _renderPomoNotes();
    }
    function updatePomoNote(id, text) { var n = _pomoNotes(); for (var i = 0; i < n.length; i++) if (n[i].id === id) { n[i].text = text; break; } _pomoSaveNotes(n); }
    function togglePomoNote(id) { var n = _pomoNotes(); for (var i = 0; i < n.length; i++) if (n[i].id === id) { n[i].completed = !n[i].completed; break; } _pomoSaveNotes(n); _renderPomoNotes(); }
    function removePomoNote(id) { _pomoSaveNotes(_pomoNotes().filter(function (x) { return x.id !== id; })); _renderPomoNotes(); }
    function _renderPomoNotes() {
      var box = document.getElementById('pomoNotes'); if (!box) return;
      var notes = _pomoNotes().slice().sort(function (a, b) { return (a.completed ? 1 : 0) - (b.completed ? 1 : 0); });
      var canAdd = _pomoNotes().length < POMO_MAX_NOTES;
      var head = '<div class="card-header"><div class="card-title">Ghi chú nhanh</div>' +
        '<button class="btn btn-sm btn-primary"' + (canAdd ? '' : ' disabled') + ' onclick="addPomoNote()">' + svgIcon('plus-square', 15) + ' Thêm</button></div>';
      var body;
      if (!notes.length) {
        body = '<div class="empty-state" style="padding:28px 16px;"><span class="empty-state-ic">' + svgIcon('materials', 24) + '</span><div class="empty-state-title">Chưa có ghi chú</div><div class="empty-state-hint">Ghi lại việc cần làm trong phiên học.</div></div>';
      } else {
        body = '<div class="pomo-notes-grid">' + notes.map(function (n) {
          return '<div class="pomo-note' + (n.completed ? ' done' : '') + '" style="background:' + POMO_NOTE_COLORS[n.color % POMO_NOTE_COLORS.length] + ';">' +
            '<div class="pomo-note-top">' +
            '<button class="pomo-note-check" aria-label="' + (n.completed ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành') + '" onclick="togglePomoNote(' + qid(n.id) + ')">' + (n.completed ? '✓' : '') + '</button>' +
            '<button class="pomo-note-del" aria-label="Xoá ghi chú" onclick="removePomoNote(' + qid(n.id) + ')">✕</button></div>' +
            '<textarea class="pomo-note-text" rows="3" placeholder="Viết ghi chú…" oninput="updatePomoNote(' + qid(n.id) + ',this.value)">' + escHtml(n.text) + '</textarea>' +
            '</div>';
        }).join('') + '</div>';
      }
      box.innerHTML = '<div class="card">' + head + body + '</div>';
    }

    // ── Nhạc nền (đa nền tảng: YouTube / Spotify / SoundCloud) ───
    // YouTube dùng IFrame API (điều khiển phát/dừng/âm lượng + tự chuyển bài).
    // Spotify & SoundCloud dùng khung nhúng CHÍNH THỨC (điều khiển ngay trong khung).
    var POMO_PROV_NAME = { youtube: 'YouTube', spotify: 'Spotify', soundcloud: 'SoundCloud' };
    // Chuẩn hoá track cũ (chỉ có videoId) → có provider.
    function _pomoTracks() {
      var t = _lsGet('th_music_queue', []);
      var changed = false;
      t.forEach(function (x) { if (!x.provider) { x.provider = 'youtube'; x.ref = x.ref || x.videoId; changed = true; } });
      if (changed) _lsSet('th_music_queue', t);
      return t;
    }
    function _pomoSaveTracks(t) { _lsSet('th_music_queue', t); }
    function _pomoIdx() { var i = _lsGet('th_music_index', 0); return (typeof i === 'number' && i >= 0) ? i : 0; }
    function _pomoSaveIdx(i) { _lsSet('th_music_index', i); }
    function _parseYtId(url) {
      var pats = [/youtube\.com\/watch\?v=([\w-]{11})/, /youtu\.be\/([\w-]{11})/, /youtube\.com\/embed\/([\w-]{11})/, /youtube\.com\/shorts\/([\w-]{11})/];
      var t = (url || '').trim();
      for (var i = 0; i < pats.length; i++) { var m = t.match(pats[i]); if (m) return m[1]; }
      return null;
    }
    // Nhận diện nguồn nhạc từ link. Trả về {provider, ref, url} hoặc null.
    function _parseMusicUrl(raw) {
      var url = (raw || '').trim(); if (!url) return null;
      var yt = _parseYtId(url); if (yt) return { provider: 'youtube', ref: yt, url: url };
      var sp = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/);
      if (sp) return { provider: 'spotify', ref: sp[1] + '/' + sp[2], url: url };
      if (/(?:https?:\/\/)?(?:www\.|m\.)?soundcloud\.com\/[^\/\s]+\/[^\/\s]+/.test(url)) return { provider: 'soundcloud', ref: url, url: url };
      return null;
    }
    // URL khung nhúng cho Spotify/SoundCloud (YouTube xử lý riêng qua IFrame API).
    function _pomoEmbedSrc(t) {
      if (t.provider === 'spotify') return 'https://open.spotify.com/embed/' + t.ref + '?utm_source=tutorhub';
      if (t.provider === 'soundcloud') return 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(t.ref) + '&auto_play=false&hide_related=true&show_comments=false&visual=true&color=%234f46e5';
      return null;
    }
    function pomoAddTrack() {
      var inp = document.getElementById('pomoMusicUrl'); var url = inp ? inp.value : '';
      var p = _parseMusicUrl(url);
      if (!p) { showToast('Chỉ hỗ trợ link YouTube, Spotify hoặc SoundCloud.', 'error'); return; }
      var fallbackTitle = POMO_PROV_NAME[p.provider] || 'Bài nhạc';
      var ytThumb = p.provider === 'youtube' ? 'https://i.ytimg.com/vi/' + p.ref + '/hqdefault.jpg' : '';
      var oembed = p.provider === 'youtube'
        ? 'https://www.youtube.com/oembed?url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + p.ref) + '&format=json'
        : p.provider === 'spotify'
          ? 'https://open.spotify.com/oembed?url=' + encodeURIComponent(p.url)
          : 'https://soundcloud.com/oembed?format=json&url=' + encodeURIComponent(p.url);
      function _add(title, thumb) {
        var t = _pomoTracks();
        t.push({ id: 'track-' + Date.now() + '-' + Math.floor(Math.random() * 1e6), provider: p.provider, ref: p.ref, url: p.url, title: title || fallbackTitle, thumbnailUrl: thumb || ytThumb || '', addedAt: Date.now() });
        _pomoSaveTracks(t); if (inp) inp.value = ''; _renderPomoMusic(); showToast('Đã thêm vào hàng chờ.', 'success');
      }
      // oEmbed công khai (không cần key) để lấy tiêu đề + ảnh; lỗi thì dùng tên nguồn.
      try {
        fetch(oembed).then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) { _add(d && d.title ? d.title : fallbackTitle, d && d.thumbnail_url ? d.thumbnail_url : ''); })
          .catch(function () { _add(fallbackTitle, ''); });
      } catch (e) { _add(fallbackTitle, ''); }
    }
    function removePomoTrack(id) {
      var tracks = _pomoTracks(); var index = -1; for (var i = 0; i < tracks.length; i++) if (tracks[i].id === id) { index = i; break; }
      if (index === -1) return;
      var remaining = tracks.length - 1; var ci = _pomoIdx();
      _pomoSaveTracks(tracks.filter(function (t) { return t.id !== id; }));
      if (remaining <= 0) _pomoSaveIdx(0);
      else if (index < ci) _pomoSaveIdx(ci - 1);
      else if (index === ci) _pomoSaveIdx(Math.min(ci, remaining - 1));
      _renderPomoMusic();
    }
    function pomoMusicSelect(i) { _pomoSaveIdx(i); _renderPomoMusic(); _pomoPlayCurrent(true); }
    function pomoMusicNext() { var t = _pomoTracks(); if (!t.length) return; _pomoSaveIdx((_pomoIdx() + 1) % t.length); _renderPomoMusic(); _pomoPlayCurrent(true); }
    function pomoMusicPrev() { var t = _pomoTracks(); if (!t.length) return; _pomoSaveIdx((_pomoIdx() - 1 + t.length) % t.length); _renderPomoMusic(); _pomoPlayCurrent(true); }

    var _ytPlayer = null, _ytOnReady = null;
    function _loadYtApi(cb) {
      if (window.YT && window.YT.Player) { cb(); return; }
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (prev) try { prev(); } catch (e) { } cb(); };
      if (!document.getElementById('yt-iframe-api')) { var s = document.createElement('script'); s.id = 'yt-iframe-api'; s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s); }
    }
    function _pomoCurrentTrack() { var t = _pomoTracks(); var i = _pomoIdx(); return t[i] || null; }
    function _pomoPlayCurrent(autoplay) {
      var track = _pomoCurrentTrack(); if (!track || track.provider !== 'youtube') return;
      var host = document.getElementById('pomoYtPlayer'); if (!host) return;
      _loadYtApi(function () {
        if (_ytPlayer && _ytPlayer.loadVideoById) {
          _ytPlayer.loadVideoById(track.videoId); if (!autoplay && _ytPlayer.pauseVideo) _ytPlayer.pauseVideo();
        } else {
          _ytPlayer = new window.YT.Player('pomoYtPlayer', {
            videoId: track.videoId, playerVars: { rel: 0, modestbranding: 1 },
            events: {
              onReady: function (e) { try { var v = document.getElementById('pomoVol'); if (v) e.target.setVolume(+v.value); } catch (er) { } if (autoplay) try { e.target.playVideo(); } catch (er) { } },
              onStateChange: function (e) { if (e.data === window.YT.PlayerState.ENDED) pomoMusicNext(); _pomoSyncPlayBtn(); }
            }
          });
        }
      });
    }
    function pomoMusicPlayPause() {
      if (!_pomoCurrentTrack()) return;
      if (!_ytPlayer || !_ytPlayer.getPlayerState) { _pomoPlayCurrent(true); return; }
      var st = _ytPlayer.getPlayerState();
      if (st === 1) _ytPlayer.pauseVideo(); else _ytPlayer.playVideo();
      setTimeout(_pomoSyncPlayBtn, 200);
    }
    function pomoMusicVolume(v) { if (_ytPlayer && _ytPlayer.setVolume) try { _ytPlayer.setVolume(+v); } catch (e) { } }
    function _pomoSyncPlayBtn() {
      var btn = document.getElementById('pomoPlayBtn'); if (!btn) return;
      var playing = _ytPlayer && _ytPlayer.getPlayerState && _ytPlayer.getPlayerState() === 1;
      btn.innerHTML = playing ? svgIcon('pause', 18) : svgIcon('play', 18);
      btn.setAttribute('aria-label', playing ? 'Tạm dừng nhạc' : 'Phát nhạc');
    }
    function _renderPomoMusic() {
      var box = document.getElementById('pomoMusic'); if (!box) return;
      // Huỷ player cũ trước khi thay DOM để tránh tham chiếu tới iframe đã gỡ.
      try { if (_ytPlayer && _ytPlayer.destroy) _ytPlayer.destroy(); } catch (e) { } _ytPlayer = null;
      var tracks = _pomoTracks(); var ci = _pomoIdx(); var cur = tracks[ci] || null;
      var addBar = '<div class="pomo-music-add"><input class="form-input" id="pomoMusicUrl" placeholder="Dán link YouTube / Spotify / SoundCloud…" aria-label="Link nhạc (YouTube, Spotify, SoundCloud)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();pomoAddTrack();}">' +
        '<button class="btn btn-primary" onclick="pomoAddTrack()">' + svgIcon('plus-square', 15) + ' Thêm</button></div>';
      var player;
      if (!cur) {
        player = '<div class="empty-state" style="padding:24px 16px;"><span class="empty-state-ic">' + svgIcon('flashcards', 24) + '</span><div class="empty-state-title">Chưa có nhạc</div><div class="empty-state-hint">Dán link YouTube, Spotify hoặc SoundCloud để nghe nhạc học tập.</div></div>';
      } else if (cur.provider === 'youtube') {
        player = '<div class="pomo-player"><div id="pomoYtPlayer"></div></div>' +
          '<div class="pomo-music-ctrl">' +
          '<button class="btn btn-ghost" aria-label="Bài trước" onclick="pomoMusicPrev()">' + svgIcon('skipback', 18) + '</button>' +
          '<button class="btn btn-primary" id="pomoPlayBtn" aria-label="Phát nhạc" onclick="pomoMusicPlayPause()">' + svgIcon('play', 18) + '</button>' +
          '<button class="btn btn-ghost" aria-label="Bài sau" onclick="pomoMusicNext()">' + svgIcon('skip', 18) + '</button>' +
          '<span class="pomo-vol-ic" aria-hidden="true">' + svgIcon('volume', 16) + '</span>' +
          '<input type="range" id="pomoVol" min="0" max="100" value="70" class="pomo-vol" aria-label="Âm lượng" oninput="pomoMusicVolume(this.value)"></div>';
      } else {
        // Spotify / SoundCloud: khung nhúng chính thức (điều khiển phát trong khung) + nút chuyển bài.
        player = '<div class="pomo-embed-wrap prov-' + cur.provider + '"><iframe class="pomo-embed" src="' + escAttr(_pomoEmbedSrc(cur)) + '" allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture" loading="lazy" title="' + escAttr(POMO_PROV_NAME[cur.provider] + ': ' + cur.title) + '"></iframe></div>' +
          '<div class="pomo-music-ctrl">' +
          '<button class="btn btn-ghost" aria-label="Bài trước" onclick="pomoMusicPrev()">' + svgIcon('skipback', 18) + '</button>' +
          '<span style="flex:1;text-align:center;font-size:12px;color:var(--text-muted);">Bấm phát ngay trong khung ' + POMO_PROV_NAME[cur.provider] + '</span>' +
          '<button class="btn btn-ghost" aria-label="Bài sau" onclick="pomoMusicNext()">' + svgIcon('skip', 18) + '</button></div>';
      }
      var list = tracks.length ? '<div class="pomo-queue">' + tracks.map(function (t, i) {
        var prov = t.provider || 'youtube';
        var thumb = t.thumbnailUrl
          ? '<img src="' + escAttr(t.thumbnailUrl) + '" alt="" loading="lazy">'
          : '<span class="pomo-track-noimg prov-' + prov + '">' + (POMO_PROV_NAME[prov] || '?').charAt(0) + '</span>';
        return '<div class="pomo-track' + (i === ci ? ' current' : '') + '" onclick="pomoMusicSelect(' + i + ')">' +
          thumb +
          '<div class="pomo-track-meta"><div class="pomo-track-title">' + escHtml(t.title) + '</div>' +
          '<span class="pomo-track-prov prov-' + prov + '">' + (POMO_PROV_NAME[prov] || prov) + '</span></div>' +
          '<button class="pomo-track-del" aria-label="Xoá khỏi hàng chờ" onclick="event.stopPropagation();removePomoTrack(' + qid(t.id) + ')">✕</button>' +
          '</div>';
      }).join('') + '</div>' : '';
      box.innerHTML = '<div class="card"><div class="card-header"><div class="card-title">Nhạc học tập</div></div>' + addBar + player + list + '</div>';
      if (cur && cur.provider === 'youtube') { _pomoPlayCurrent(false); setTimeout(_pomoSyncPlayBtn, 400); }
    }

    // ── Chuỗi tập trung (lịch tháng heatmap) ─────────────────────
    var _pomoStreakView = null; // {y, m}
    function _pomoBuildGrid(y, m) {
      var first = new Date(y, m, 1); var fw = (first.getDay() + 6) % 7; var start = new Date(y, m, 1 - fw);
      var today = _pomoTodayKey(); var out = [];
      for (var i = 0; i < 42; i++) { var d = new Date(start); d.setDate(start.getDate() + i); var k = _dateKey(d); out.push({ date: d, key: k, inMonth: d.getMonth() === m, isToday: k === today }); }
      return out;
    }
    function _streakLevel(min) { if (min <= 0) return 0; if (min <= 90) return 1; if (min <= 150) return 2; if (min <= 270) return 3; return 4; }
    function pomoStreakMonth(delta) { if (!_pomoStreakView) { var n = new Date(); _pomoStreakView = { y: n.getFullYear(), m: n.getMonth() }; } var d = new Date(_pomoStreakView.y, _pomoStreakView.m + delta, 1); _pomoStreakView = { y: d.getFullYear(), m: d.getMonth() }; _renderPomoStreak(); }
    function _renderPomoStreak() {
      var box = document.getElementById('pomoStreak'); if (!box) return;
      if (!_pomoStreakView) { var n = new Date(); _pomoStreakView = { y: n.getFullYear(), m: n.getMonth() }; }
      var y = _pomoStreakView.y, m = _pomoStreakView.m;
      var label = new Date(y, m, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
      var days = _pomoBuildGrid(y, m);
      var wd = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      var cells = wd.map(function (w) { return '<div class="pomo-cal-wd">' + w + '</div>'; }).join('') +
        days.map(function (d) {
          var min = _focusMinutesFor(d.key); var lv = _streakLevel(min);
          var tip = d.date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }) + ' — ' + (min > 0 ? _fmtMinutes(min) : 'Chưa tập trung');
          return '<div class="pomo-cal-cell lvl' + lv + (d.inMonth ? '' : ' out') + (d.isToday ? ' today' : '') + '" title="' + escAttr(tip) + '">' + d.date.getDate() + '</div>';
        }).join('');
      box.innerHTML = '<div class="card"><div class="card-header"><div class="card-title">Chuỗi tập trung</div>' +
        '<div class="pomo-cal-nav"><button class="btn btn-sm btn-ghost" aria-label="Tháng trước" onclick="pomoStreakMonth(-1)">' + svgIcon('skipback', 14) + '</button>' +
        '<span class="pomo-cal-label">' + label + '</span>' +
        '<button class="btn btn-sm btn-ghost" aria-label="Tháng sau" onclick="pomoStreakMonth(1)">' + svgIcon('skip', 14) + '</button></div></div>' +
        '<div class="pomo-cal-grid">' + cells + '</div>' +
        '<div class="pomo-cal-legend"><span>Ít</span><span class="pomo-cal-cell lvl0"></span><span class="pomo-cal-cell lvl1"></span><span class="pomo-cal-cell lvl2"></span><span class="pomo-cal-cell lvl3"></span><span class="pomo-cal-cell lvl4"></span><span>Nhiều</span></div>' +
        '</div>';
    }

    // ── Render toàn mục + init ───────────────────────────────────
    function renderPomodoro() {
      _renderPomoTimer();
      _renderPomoNotes();
      _renderPomoMusic();
      _renderPomoStreak();
      _renderPomoFocusBar();
      var st = _pomoState();
      if (st.isRunning) _pomoStartTimer();
    }

    function initPomodoro() {
      document.addEventListener('visibilitychange', function () {
        _pomoOnVisibility();
        if (document.visibilityState === 'visible') _pomoTick(); // bắt kịp thời gian khi quay lại tab
      });
      document.addEventListener('fullscreenchange', _pomoOnFullscreen);
      var st = _pomoState();
      if (st.isRunning && st.phaseEndAt != null) _pomoStartTimer(); // tiếp tục đếm nền sau khi tải lại
    }
    initPomodoro();
