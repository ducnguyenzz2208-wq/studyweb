    // ============================================================
    // FLASHCARD PRO — 2 tính năng:
    //  (1) TỰ ĐỘNG PHÁT ÂM khi lật thẻ (Web Speech API) — CHỈ đọc mặt trước;
    //      tự nhận diện ngôn ngữ theo nội dung, ưu tiên giọng chất lượng cao
    //      (Natural/Neural/Online/Google) + xen kẽ hoặc cố định giọng Nam/Nữ.
    //  (2) CHẾ ĐỘ HỌC (Learn) kiểu Quizlet — Leitner (spaced repetition) +
    //      Trắc nghiệm/Tự luận + hàng chờ ôn lại từ sai + thanh tiến trình.
    //
    // Module ĐỘC LẬP: 23-flashcards.js chỉ cần gọi 3 hook —
    //   fcOnFlip()            : lật thẻ  → phát âm mặt đang hiện
    //   fcStudyToolsHtml()    : nút bật/tắt phát âm + chọn ngôn ngữ (header Học)
    //   startLearn(deckId)    : vào chế độ Học
    // Không phụ thuộc module khác (tự có helper localStorage/plain-text).
    // ============================================================

    // ── Helper riêng của module (không phụ thuộc 26-pomodoro) ────
    function _fcLsGet(k, def) { try { var v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } }
    function _fcLsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
    // Khoá localStorage theo TỪNG tài khoản (giống pattern _pk của Pomodoro).
    function _fcPk(base) { return base + ((typeof _dbUserId !== 'undefined' && _dbUserId) ? ('_' + _dbUserId) : ''); }

    // Lấy CHỮ THUẦN từ nội dung thẻ: bỏ thẻ HTML (<img> chèn từ tính năng nhận
    // diện toán học), bỏ LaTeX — nếu không máy sẽ đọc "backslash frac a b".
    // Dùng regex thay vì innerHTML để không kích hoạt side-effect của thẻ ảnh.
    function _fcPlainText(html) {
      if (html == null) return '';
      var s = String(html)
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\\\([\s\S]*?\\\)/g, ' ')
        .replace(/\\\[[\s\S]*?\\\]/g, ' ')
        .replace(/\$\$[\s\S]*?\$\$/g, ' ')
        .replace(/\$[^$\n]*\$/g, ' ')
        .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
      return s.replace(/\s+/g, ' ').trim();
    }
    function _fcHasImage(s) { return /<img/i.test(String(s || '')); }

    // ============================================================
    // (1) TEXT-TO-SPEECH
    // ============================================================
    // Mã BCP-47 dùng THẲNG cho Web Speech API (utterance.lang).
    // Nhãn kèm TÊN GIỌNG gợi ý (♀/♂) — đúng là các giọng Natural/Neural chất
    // lượng cao mà Edge/Chrome/Google cài sẵn cho ngôn ngữ đó, để người tạo thẻ
    // biết trước máy học sinh có thể phát ra giọng gì. Chọn NGÔN NGỮ ở đây,
    // KHÔNG chọn thẳng giọng — hệ thống tự tìm giọng chất lượng cao nhất khớp
    // ngôn ngữ + tuỳ chọn Nam/Nữ (xem `_fcPickVoice`/`FC_VOICE_*_NAMES`).
    var FC_TTS_LANGS = [
      { code: 'auto', label: '🌐 Tự động nhận diện' },
      { code: 'en-US', label: 'English (US) — en-US · ♀Jenny/Aria/Zira ♂Guy/David/Ryan' },
      { code: 'en-GB', label: 'English (UK) — en-GB' },
      { code: 'vi-VN', label: 'Tiếng Việt — vi-VN · ♀HoaiMy ♂NamMinh' },
      { code: 'ja-JP', label: '日本語 Tiếng Nhật — ja-JP · ♀Nanami/Keiko ♂Keita/Naoki' },
      { code: 'ko-KR', label: '한국어 Tiếng Hàn — ko-KR · ♀SunHi/Heami ♂InJoon' },
      { code: 'zh-CN', label: '简体中文 Trung (Giản thể) — zh-CN · ♀Xiaoxiao ♂Yunjian/Yunxi' },
      { code: 'zh-TW', label: '繁體中文 Trung (Phồn thể, Đài Loan) — zh-TW · ♀HsiaoChen ♂Yunjun' },
      { code: 'zh-HK', label: '繁體中文 Trung (Phồn thể, Hồng Kông) — zh-HK · ♀HiuGaai/HiuMaan ♂WanLung' },
      { code: 'fr-FR', label: 'Français — fr-FR' },
      { code: 'de-DE', label: 'Deutsch — de-DE' },
      { code: 'es-ES', label: 'Español — es-ES' },
      { code: 'ru-RU', label: 'Русский — ru-RU' },
      { code: 'th-TH', label: 'ไทย Tiếng Thái — th-TH' }
    ];

    // Phân biệt Trung PHỒN THỂ (zh-TW) với GIẢN THỂ (zh-CN) khi để "tự động".
    // Rất nhiều chữ dùng chung nên chỉ dò được qua các chữ CHỈ CÓ ở một bên;
    // hoà/không thấy chữ đặc trưng → mặc định giản thể (phổ biến hơn).
    // Muốn chắc chắn thì đặt ngôn ngữ cho thẻ lúc tạo (zh-TW / zh-HK).
    var FC_ZH_TRAD = '這個灣學國說們時會對開關麼樣點認為語讀寫聽萬與東車馬鳥魚門長風飛見親愛體齊龍龜歲雞';
    var FC_ZH_SIMP = '这个湾学国说们时会对开关么样点认为语读写听万与东车马鸟鱼门长风飞见亲爱体齐龙龟岁鸡';
    function _fcDetectChinese(s) {
      var trad = 0, simp = 0;
      for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        if (FC_ZH_TRAD.indexOf(ch) >= 0) trad++;
        else if (FC_ZH_SIMP.indexOf(ch) >= 0) simp++;
      }
      return trad > simp ? 'zh-TW' : 'zh-CN';
    }

    function _fcTtsSupported() { return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'; }
    function fcAutoSpeakOn() { return _fcLsGet(_fcPk('th_fc_autospeak'), true) !== false; }

    // ── Chọn giọng đọc: chất lượng cao + Nam/Nữ ──────────────────
    // Cấu hình giọng: 'auto' (mặc định, XEN KẼ Nam/Nữ giữa các thẻ nối tiếp)
    // hoặc cố định 'male'/'female'. Lưu theo tài khoản, đọc/đổi trong header
    // màn Học (và thanh công cụ màn Học thẻ).
    function fcVoiceGenderPref() { return _fcLsGet(_fcPk('th_fc_voice_gender'), 'auto') || 'auto'; }
    function fcSetVoiceGenderPref(v) {
      _fcLsSet(_fcPk('th_fc_voice_gender'), v);
      showToast(v === 'auto' ? '🔀 Giọng đọc: xen kẽ Nam/Nữ giữa các thẻ.' : (v === 'male' ? '♂️ Giọng đọc: cố định Nam.' : '♀️ Giọng đọc: cố định Nữ.'), 'info');
    }
    // Đoán giới tính giọng qua TÊN giọng (Web Speech API không có field giới
    // tính chuẩn) — bảng tên riêng thường gặp ở giọng Natural/Neural của
    // Edge/Chrome/Google cho từng ngôn ngữ (khớp CHUỖI CON, không phân biệt
    // hoa/thường). Đây chính là mapping Nữ/Nam theo từng ngôn ngữ ở
    // `FC_TTS_LANGS` phía trên — sửa/thêm tên ở ĐÂY nếu máy bạn có giọng khác.
    var FC_VOICE_FEMALE_NAMES = [
      'hoaimy',                                   // vi-VN
      'xiaoxiao', 'yaoyao', 'huihui',             // zh-CN
      'hiugaai', 'hiumaan',                       // zh-HK
      'hsiaochen',                                // zh-TW
      'jenny', 'aria', 'zira',                    // en
      'nanami', 'keiko', 'ayumi', 'haruka', 'yuna', // ja-JP
      'sunhi', 'heami',                           // ko-KR
      'hazel', 'susan', 'samantha', 'victoria', 'karen', 'moira', 'tessa',
      'joanna', 'salli', 'kimberly', 'kendra', 'ivy', 'michelle', 'linda',
      'catherine', 'emma', 'olivia', 'sophie', 'mei'
    ];
    var FC_VOICE_MALE_NAMES = [
      'namminh',                                  // vi-VN
      'yunjian', 'yunxi', 'kangkang', 'zhiwei', 'liang', // zh-CN
      'wanlung',                                  // zh-HK
      'yunjun',                                   // zh-TW
      'guy', 'david', 'ryan',                     // en
      'keita', 'naoki', 'ichiro', 'osamu', 'junsu', // ja-JP (junsu dự phòng)
      'injoon',                                   // ko-KR
      'mark', 'matthew', 'brian', 'daniel', 'george', 'james', 'alex', 'fred',
      'tom', 'yunyang'
    ];
    function _fcNameHasAny(name, list) {
      for (var i = 0; i < list.length; i++) if (name.indexOf(list[i]) >= 0) return true;
      return false;
    }
    function _fcVoiceGender(voice) {
      var n = String((voice && voice.name) || '').toLowerCase();
      if (/\bfemale\b/.test(n) || _fcNameHasAny(n, FC_VOICE_FEMALE_NAMES)) return 'female';
      if (/\bmale\b/.test(n) || _fcNameHasAny(n, FC_VOICE_MALE_NAMES)) return 'male';
      return 'unknown';
    }
    // Điểm chất lượng: ưu tiên giọng "Natural"/"Neural"/"Online"/"Google" —
    // các hãng dùng những từ này để đánh dấu giọng tổng hợp bằng AI, nghe tự
    // nhiên hơn hẳn giọng robot mặc định của hệ điều hành.
    function _fcVoiceQuality(voice) {
      var n = String((voice && voice.name) || '');
      var score = 0;
      if (/natural/i.test(n)) score += 4;
      if (/neural/i.test(n)) score += 4;
      if (/online/i.test(n)) score += 2;
      if (/google/i.test(n)) score += 2;
      return score;
    }
    // Xen kẽ Nam/Nữ giữa các THẺ MỚI (không đổi khi đọc lại đúng thẻ đang xem).
    var _fcGenderToggle = 'female', _fcLastCardKey = null;
    function _fcResolveGender(cardKey) {
      var pref = fcVoiceGenderPref();
      if (pref === 'male' || pref === 'female') return pref;
      if (cardKey && cardKey !== _fcLastCardKey) {
        _fcLastCardKey = cardKey;
        _fcGenderToggle = (_fcGenderToggle === 'female') ? 'male' : 'female';
      }
      return _fcGenderToggle;
    }
    // Ngôn ngữ cấu hình THEO TỪNG BỘ THẺ ('auto' = tự nhận diện theo nội dung).
    function fcDeckLang(deckId) { return _fcLsGet(_fcPk('th_fc_lang_' + deckId), 'auto') || 'auto'; }
    function fcSetDeckLang(deckId, code) {
      _fcLsSet(_fcPk('th_fc_lang_' + deckId), code);
      showToast(code === 'auto' ? 'Phát âm: tự động nhận diện ngôn ngữ.' : ('Phát âm: ' + code), 'info');
    }

    // Nhận diện ngôn ngữ theo BẢNG CHỮ trong nội dung (đủ tốt cho flashcard).
    // Thứ tự quan trọng: kana trước Hán tự (tiếng Nhật có cả kanji).
    function fcDetectLang(text) {
      var s = _fcPlainText(text);
      if (!s) return 'en-US';
      if (/[぀-ゟ゠-ヿ]/.test(s)) return 'ja-JP';       // hiragana/katakana
      if (/[가-힯ᄀ-ᇿ]/.test(s)) return 'ko-KR';       // hangul
      if (/[฀-๿]/.test(s)) return 'th-TH';                    // Thai
      if (/[Ѐ-ӿ]/.test(s)) return 'ru-RU';                    // Cyrillic
      if (/[؀-ۿ]/.test(s)) return 'ar-SA';                    // Arabic
      if (/[一-鿿]/.test(s)) return _fcDetectChinese(s);         // Hán tự (không kèm kana)
      // Tiếng Việt — CHỈ dùng ký tự RIÊNG của tiếng Việt, không dùng nguyên âm
      // có dấu dùng chung (à á è é ó ú…) vì Pháp/Tây Ban Nha/Ý cũng có →
      // trước đây "très"/"estás" bị nhận nhầm là tiếng Việt.
      //   U+1EA0–U+1EF9: ạ ả ấ ầ ậ ắ ặ ẹ ẻ ế ề ệ ỉ ị ọ ỏ ố ộ ớ ờ ợ ụ ủ ứ ừ ự ỳ ỵ ỹ…
      //   ă Ă (0102/0103) · đ Đ (0110/0111) · ơ Ơ (01A0/01A1) · ư Ư (01AF/01B0)
      if (/[Ạ-ỹĂăĐđƠơƯư]/.test(s)) return 'vi-VN';
      if (/[äöüßÄÖÜ]/.test(s)) return 'de-DE';
      if (/[ñÑ¿¡]/.test(s)) return 'es-ES';
      if (/[çœëïûÿèêîôàâùÇŒ]/i.test(s)) return 'fr-FR';
      return 'en-US';
    }
    // Ngôn ngữ dùng để đọc 1 đoạn: ưu tiên cấu hình bộ thẻ, sau đó tự nhận diện.
    function fcLangFor(text, deckId) {
      var cfg = deckId != null ? fcDeckLang(deckId) : 'auto';
      return (cfg && cfg !== 'auto') ? cfg : fcDetectLang(text);
    }

    // ── Ngôn ngữ THEO TỪNG THẺ (đặt lúc tạo/sửa thẻ) ─────────────
    // Lưu ở cột `flashcards.front_lang` (migration 028) để ngôn ngữ ĐI THEO THẺ
    // — GV đặt 1 lần, mọi HS mở đều đọc đúng giọng. Chưa chạy 028 thì tự
    // fallback về localStorage của MÁY hiện tại (khoá theo dbId nên bền qua
    // reload; id số trong RAM đổi mỗi lần tải nên KHÔNG dùng làm khoá).
    function fcLangColReady() { return _fcLsGet(_fcPk('th_fc_langcol'), null) === true; }
    function fcSetLangColReady(ok) { _fcLsSet(_fcPk('th_fc_langcol'), !!ok); }
    function _fcCardKey(card) { return String((card && (card.dbId || card.id)) || ''); }
    function _fcCardLangMap(deckId) { return _fcLsGet(_fcPk('th_fc_cardlang_' + deckId), {}) || {}; }
    function fcCardLang(card, deckId) {
      if (card && card.lang) return card.lang;                       // từ DB (front_lang)
      var m = _fcCardLangMap(deckId);
      return m[_fcCardKey(card)] || '';                              // fallback máy hiện tại
    }
    // Gọi từ saveCard (23-flashcards.js) — luôn ghi localStorage để chạy được cả
    // khi chưa có cột DB; có cột thì saveCard ghi thêm vào DB.
    function fcSetCardLang(card, deckId, code) {
      if (!card) return;
      card.lang = (code && code !== 'auto') ? code : '';
      var m = _fcCardLangMap(deckId);
      if (card.lang) m[_fcCardKey(card)] = card.lang; else delete m[_fcCardKey(card)];
      _fcLsSet(_fcPk('th_fc_cardlang_' + deckId), m);
    }
    // THỨ TỰ ƯU TIÊN: ngôn ngữ của THẺ → ngôn ngữ của BỘ THẺ → tự nhận diện.
    function fcLangForCard(card, deckId, text) {
      var cl = fcCardLang(card, deckId);
      if (cl && cl !== 'auto') return cl;
      return fcLangFor(text != null ? text : (card ? card.front : ''), deckId);
    }
    // <option> cho ô chọn ngôn ngữ trong modal tạo/sửa thẻ.
    function fcLangOptionsHtml(selected) {
      var sel = selected || 'auto';
      return FC_TTS_LANGS.map(function (l) {
        return '<option value="' + l.code + '"' + (sel === l.code ? ' selected' : '') + '>' + l.label + '</option>';
      }).join('');
    }

    // Danh sách giọng nạp BẤT ĐỒNG BỘ trên Chrome → cache + nghe voiceschanged.
    var _fcVoiceCache = null;
    function _fcVoices() {
      if (!_fcTtsSupported()) return [];
      if (_fcVoiceCache && _fcVoiceCache.length) return _fcVoiceCache;
      try { _fcVoiceCache = window.speechSynthesis.getVoices() || []; } catch (e) { _fcVoiceCache = []; }
      return _fcVoiceCache;
    }
    // Chọn giọng tốt nhất cho 1 ngôn ngữ + giới tính mong muốn:
    //   1) Lọc theo ngôn ngữ (khớp đúng dialect, rồi mới nới về khớp base — vd 'en').
    //   2) Trong nhóm đó, ưu tiên giọng khớp GIỚI TÍNH yêu cầu; KHÔNG có giọng nào
    //      khớp giới tính → bỏ qua tiêu chí này (fallback êm, không lỗi).
    //   3) Xếp hạng theo CHẤT LƯỢNG (Natural/Neural/Online/Google) — chọn cao nhất.
    // Không có giọng nào khớp ngôn ngữ → trả null, browser tự dùng giọng chuẩn
    // theo `utterance.lang` (fallback mặc định của trình duyệt, không lỗi app).
    function _fcPickVoice(lang, gender) {
      var voices = _fcVoices(); if (!voices.length) return null;
      var want = String(lang || '').toLowerCase().replace('_', '-');
      var base = want.split('-')[0];
      var norm = function (v) { return String(v.lang || '').toLowerCase().replace('_', '-'); };
      var exact = voices.filter(function (v) { return norm(v) === want; });
      var partial = voices.filter(function (v) { return norm(v).split('-')[0] === base; });
      var pool = exact.length ? exact : partial;
      if (!pool.length) return null;
      if (gender === 'male' || gender === 'female') {
        var byGender = pool.filter(function (v) { return _fcVoiceGender(v) === gender; });
        if (byGender.length) pool = byGender;
      }
      return pool.slice().sort(function (a, b) { return _fcVoiceQuality(b) - _fcVoiceQuality(a); })[0];
    }

    // Đọc 1 đoạn văn bản. Tự huỷ câu đang đọc để không chồng tiếng.
    // `gender` (tuỳ chọn): 'male'/'female' — ép giọng + độ trầm/bổng cho lượt đọc
    // này; bỏ trống thì dùng cấu hình cố định (nếu có) hoặc giọng đang xen kẽ.
    function fcSpeak(text, lang, gender) {
      if (!_fcTtsSupported()) { showToast('Trình duyệt không hỗ trợ phát âm.', 'warning'); return; }
      var say = _fcPlainText(text);
      if (!say) { showToast('Mặt thẻ này không có chữ để đọc (chỉ có hình/công thức).', 'info'); return; }
      if (say.length > 400) say = say.slice(0, 400); // chống đọc lê thê
      try {
        window.speechSynthesis.cancel();
        var u = new window.SpeechSynthesisUtterance(say);
        u.lang = lang || fcDetectLang(say);
        var pref = fcVoiceGenderPref();
        var g = gender || (pref !== 'auto' ? pref : _fcGenderToggle);
        var v = _fcPickVoice(u.lang, g);
        // Gán voice trong try RIÊNG: nếu object giọng "hỏng" (một số trình
        // duyệt/thiết bị trả voice không hợp lệ), lỗi ở đây KHÔNG được làm
        // rớt luôn cả câu nói — phải rơi về giọng chuẩn của u.lang mà vẫn đọc.
        if (v) { try { u.voice = v; } catch (e2) { } }
        // rate 0.9–0.95, pitch Nữ 1.05–1.10 / Nam 0.85–0.90 — lấy điểm GIỮA
        // khoảng cho tự nhiên nhất (biên trên/dưới dễ nghe robot hơn).
        u.rate = 0.92;
        u.pitch = (g === 'male') ? 0.88 : 1.08;
        u.volume = 1;
        window.speechSynthesis.speak(u);
      } catch (e) { console.warn('TTS lỗi:', e && e.message); }
    }
    function fcStopSpeak() { if (_fcTtsSupported()) { try { window.speechSynthesis.cancel(); } catch (e) { } } }
    // Đọc theo bộ thẻ (dùng cấu hình ngôn ngữ của bộ thẻ nếu có).
    function fcSpeakFor(text, deckId) { fcSpeak(text, fcLangFor(text, deckId)); }

    function toggleFcAutoSpeak() {
      var on = !fcAutoSpeakOn();
      _fcLsSet(_fcPk('th_fc_autospeak'), on);
      if (!on) fcStopSpeak();
      showToast(on ? '🔊 Đã bật tự động phát âm khi lật thẻ.' : '🔇 Đã tắt tự động phát âm.', on ? 'success' : 'info');
      _fcSyncAutoSpeakBtn();
      // Bật lên giữa chừng → đọc luôn mặt đang hiện cho phản hồi tức thì.
      if (on) fcOnFlip();
    }
    function _fcSyncAutoSpeakBtn() {
      var on = fcAutoSpeakOn();
      ['fcAutoSpeakBtn', 'learnAutoSpeakBtn'].forEach(function (id) {
        var btn = document.getElementById(id); if (!btn) return;
        btn.className = 'btn btn-sm ' + (on ? 'btn-primary' : 'btn-ghost');
        btn.innerHTML = (on ? '🔊' : '🔇') + ' Tự phát âm';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.title = on ? 'Đang BẬT tự động phát âm khi lật thẻ — bấm để tắt' : 'Đang TẮT tự động phát âm — bấm để bật';
      });
    }

    // HOOK cho 23-flashcards.js: gọi mỗi khi lật thẻ / chuyển sang thẻ mới.
    // QUY TẮC: CHỈ tự động đọc MẶT TRƯỚC. Lật sang mặt sau → IM LẶNG
    // (muốn nghe mặt sau thì bấm nút loa 🔊 trên mặt đó).
    function fcOnFlip() {
      if (!fcAutoSpeakOn() || typeof studyState === 'undefined' || !studyState) return;
      var card = studyState.cards[studyState.index]; if (!card) return;
      if (studyState.flipped) { fcStopSpeak(); return; }   // mặt sau: không đọc
      fcSpeakCardFront(card, studyState.deckId);
    }
    // Đọc mặt trước theo ĐÚNG mã lang đã đặt lúc tạo thẻ (nếu có); mỗi THẺ MỚI
    // (khác thẻ vừa đọc trước đó) → xen kẽ giọng Nam/Nữ (trừ khi đã cố định 1 giới).
    function fcSpeakCardFront(card, deckId) {
      if (!card) return;
      var gender = _fcResolveGender(_fcCardKey(card) + '|' + deckId);
      fcSpeak(card.front, fcLangForCard(card, deckId, card.front), gender);
    }

    // <select> chọn giọng Nam/Nữ/Xen kẽ — dùng chung cho thanh công cụ Học thẻ
    // và header Chế độ Học (Cài đặt Flashcard).
    function fcVoiceGenderSelectHtml() {
      if (!_fcTtsSupported()) return '';
      var pref = fcVoiceGenderPref();
      var opt = function (v, label) { return '<option value="' + v + '"' + (pref === v ? ' selected' : '') + '>' + label + '</option>'; };
      return '<select class="filter-select fc-gender-select" aria-label="Giọng đọc" title="Xen kẽ Nam/Nữ giữa các thẻ, hoặc cố định 1 giọng" onchange="fcSetVoiceGenderPref(this.value)">' +
        opt('auto', '🔀 Xen kẽ Nam/Nữ') + opt('female', '♀️ Giọng Nữ') + opt('male', '♂️ Giọng Nam') + '</select>';
    }
    // Nút bật/tắt + chọn ngôn ngữ + chọn giọng — chèn vào header màn Học.
    function fcStudyToolsHtml(deckId) {
      if (!_fcTtsSupported()) return '';
      var on = fcAutoSpeakOn();
      var opts = FC_TTS_LANGS.map(function (l) {
        return '<option value="' + l.code + '"' + (fcDeckLang(deckId) === l.code ? ' selected' : '') + '>' + l.label + '</option>';
      }).join('');
      return '<button class="btn btn-sm ' + (on ? 'btn-primary' : 'btn-ghost') + '" id="fcAutoSpeakBtn" aria-pressed="' + (on ? 'true' : 'false') +
        '" title="' + (on ? 'Đang BẬT tự động phát âm khi lật thẻ — bấm để tắt' : 'Đang TẮT tự động phát âm — bấm để bật') +
        '" onclick="toggleFcAutoSpeak()">' + (on ? '🔊' : '🔇') + ' Tự phát âm</button>' +
        '<select class="filter-select fc-lang-select" aria-label="Ngôn ngữ phát âm của bộ thẻ" onchange="fcSetDeckLang(' + deckId + ',this.value)">' + opts + '</select>' +
        fcVoiceGenderSelectHtml();
    }
    // Nút loa nhỏ đặt trên từng mặt thẻ (đọc THỦ CÔNG — vẫn dùng được cho mặt
    // sau dù mặt sau không còn tự động đọc). `lang` truyền vào thì đọc theo mã
    // đó (mặt trước: mã đặt lúc tạo thẻ); bỏ trống thì theo bộ thẻ/tự nhận diện.
    function fcSpeakBtnHtml(text, deckId, label, lang) {
      if (!_fcTtsSupported()) return '';
      var call = (lang && lang !== 'auto')
        ? 'fcSpeak(' + qid(String(text)) + ',' + qid(String(lang)) + ')'
        : 'fcSpeakFor(' + qid(String(text)) + ',' + deckId + ')';
      return '<button class="fc-tts-btn" title="Phát âm' + (label ? ' ' + label : '') + '" aria-label="Phát âm' + (label ? ' ' + label : '') +
        '" onclick="event.stopPropagation();' + call + '">🔊</button>';
    }

    // ============================================================
    // (2) CHẾ ĐỘ HỌC (LEARN) — Leitner + Trắc nghiệm/Tự luận
    // ------------------------------------------------------------
    // Leitner đơn giản: mỗi thẻ có "box" 0..3.
    //   box 0        → hỏi TRẮC NGHIỆM (làm quen)
    //   box 1,2      → hỏi TỰ LUẬN (gõ lại — nhớ chủ động)
    //   box >= 3     → ĐÃ THUỘC, rời hàng chờ
    // Đúng → box+1 ; Sai → box về 0 và ĐƯA LẠI VÀO HÀNG CHỜ (hiện lại sau ~3 thẻ)
    // → từ sai lặp lại tới khi thuộc hoàn toàn. Box lưu localStorage theo
    // (tài khoản, bộ thẻ) nên đóng trình duyệt mở lại vẫn nhớ tiến độ.
    // ============================================================
    var LEARN_MASTER_BOX = 3;     // đạt box này = đã thuộc
    var LEARN_REQUEUE_GAP = 3;    // trả lời sai → chèn lại cách 3 thẻ
    var LEARN_MC_CHOICES = 4;     // số phương án trắc nghiệm

    var _learnState = null;
    // {deckId, queue:[cardId], byId:{}, cur:card, mode:'mc'|'written',
    //  choices:[], answered:bool, lastCorrect:bool, stats:{correct,wrong}, total}

    function _learnKey(deckId) { return _fcPk('th_fc_learn_' + deckId); }
    function _learnBoxes(deckId) { return _fcLsGet(_learnKey(deckId), {}) || {}; }
    function _learnSaveBoxes(deckId, boxes) { _fcLsSet(_learnKey(deckId), boxes); }
    function _learnBoxOf(deckId, cardId) { var b = _learnBoxes(deckId)[String(cardId)]; return typeof b === 'number' ? b : 0; }
    function _learnSetBox(deckId, cardId, box) {
      var boxes = _learnBoxes(deckId); boxes[String(cardId)] = box; _learnSaveBoxes(deckId, boxes);
    }
    function _fcShuffle(arr) {
      for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
      return arr;
    }

    // Thẻ chỉ hỏi TỰ LUẬN được khi đáp án gõ được: có chữ, không phải ảnh,
    // không quá dài. Ảnh/công thức → luôn hỏi trắc nghiệm (không thể gõ).
    function _learnTypeable(card) {
      var a = _fcPlainText(card.back);
      return !!a && !_fcHasImage(card.back) && a.length <= 60;
    }
    function _learnModeFor(card, deckId, poolSize) {
      var box = _learnBoxOf(deckId, card.id);
      if (box <= 0) return poolSize >= 2 ? 'mc' : (_learnTypeable(card) ? 'written' : 'mc');
      return _learnTypeable(card) ? 'written' : 'mc';
    }

    // ── Bắt đầu / kết thúc ───────────────────────────────────────
    function startLearn(deckId) {
      var d = flashcardDecks.find(function (x) { return x.id === deckId; });
      if (!d || !d.cards.length) { showToast('Bộ thẻ chưa có thẻ để học.', 'warning'); return; }
      var byId = {}; d.cards.forEach(function (c) { byId[String(c.id)] = c; });
      // Hàng chờ = thẻ CHƯA thuộc, xếp thẻ "lạ" (box thấp) lên trước.
      var pending = d.cards.filter(function (c) { return _learnBoxOf(deckId, c.id) < LEARN_MASTER_BOX; });
      _fcShuffle(pending);
      pending.sort(function (a, b) { return _learnBoxOf(deckId, a.id) - _learnBoxOf(deckId, b.id); });

      _learnState = {
        deckId: deckId, byId: byId, total: d.cards.length,
        queue: pending.map(function (c) { return c.id; }),
        cur: null, mode: 'mc', choices: [], answered: false, lastCorrect: false,
        stats: { correct: 0, wrong: 0 }
      };
      document.getElementById('flashcards-list-view').style.display = 'none';
      document.getElementById('flashcards-deck-view').style.display = 'none';
      document.getElementById('flashcards-study-view').style.display = 'none';
      _learnEnsureView().style.display = '';
      document.addEventListener('keydown', _learnKeydown);
      _learnNextQuestion();
    }
    function _learnEnsureView() {
      var v = document.getElementById('flashcards-learn-view');
      if (!v) { // phòng khi HTML chưa có sẵn container
        v = document.createElement('div'); v.id = 'flashcards-learn-view';
        (document.getElementById('section-flashcards') || document.body).appendChild(v);
      }
      return v;
    }
    function exitLearn() {
      fcStopSpeak();
      document.removeEventListener('keydown', _learnKeydown);
      var deckId = _learnState ? _learnState.deckId : null;
      _learnState = null;
      var v = document.getElementById('flashcards-learn-view'); if (v) { v.style.display = 'none'; v.innerHTML = ''; }
      if (deckId != null) openDeckDetail(deckId); else backToDecks();
    }
    function learnRestart() { var id = _learnState ? _learnState.deckId : null; if (id != null) { document.removeEventListener('keydown', _learnKeydown); startLearn(id); } }
    function learnResetProgress() {
      if (!_learnState) return;
      var id = _learnState.deckId;
      uiConfirm('Xoá tiến độ đã thuộc của bộ thẻ này và học lại từ đầu?', function () {
        _learnSaveBoxes(id, {});
        document.removeEventListener('keydown', _learnKeydown);
        showToast('Đã đặt lại tiến độ học.', 'info');
        startLearn(id);
      });
    }

    // ── Sinh câu hỏi ─────────────────────────────────────────────
    function _learnNextQuestion() {
      var st = _learnState; if (!st) return;
      if (!st.queue.length) { _learnRenderDone(); return; }
      var card = st.byId[String(st.queue[0])];
      if (!card) { st.queue.shift(); _learnNextQuestion(); return; }
      st.cur = card;
      st.answered = false; st.lastCorrect = false; st.closeMatch = false;
      st.mode = _learnModeFor(card, st.deckId, st.total);
      st.choices = st.mode === 'mc' ? _learnBuildChoices(card) : [];
      _learnRender();
      // Câu hỏi CHÍNH LÀ mặt trước → được tự động đọc (đúng quy tắc "chỉ đọc
      // mặt trước"); đáp án/mặt sau thì không.
      if (fcAutoSpeakOn()) fcSpeakCardFront(card, st.deckId);
    }
    // Phương án nhiễu lấy từ mặt sau của các thẻ khác trong bộ (bỏ trùng).
    function _learnBuildChoices(card) {
      var st = _learnState;
      var correct = { id: card.id, html: card.back, text: _fcPlainText(card.back) };
      var seen = {}; seen[correct.text.toLowerCase()] = 1;
      var pool = [];
      Object.keys(st.byId).forEach(function (k) {
        var c = st.byId[k]; if (c.id === card.id) return;
        var txt = _fcPlainText(c.back);
        var key = txt.toLowerCase();
        if (!txt && !_fcHasImage(c.back)) return;
        if (key && seen[key]) return;
        if (key) seen[key] = 1;
        pool.push({ id: c.id, html: c.back, text: txt });
      });
      _fcShuffle(pool);
      var choices = pool.slice(0, Math.max(0, LEARN_MC_CHOICES - 1));
      choices.push(correct);
      return _fcShuffle(choices);
    }

    // ── Chấm câu trả lời ─────────────────────────────────────────
    // So khớp tự luận "thông minh": bỏ dấu câu/khoảng trắng thừa, chấp nhận
    // nhiều đáp án ngăn bởi "/" hoặc ";", và tha lỗi gõ nhầm 1 ký tự.
    function _learnNorm(s) {
      return _fcPlainText(s).toLowerCase()
        .replace(/[.,!?;:"'`""''«»。、！？…]/g, ' ')
        .replace(/\s+/g, ' ').trim();
    }
    function _learnAlternatives(back) {
      var whole = _learnNorm(back);
      var parts = _fcPlainText(back).split(/[\/;]/).map(_learnNorm).filter(Boolean);
      var all = [whole].concat(parts);
      // bỏ phần trong ngoặc: "hello (informal)" → cũng chấp nhận "hello"
      var noParen = _learnNorm(String(back).replace(/\([^)]*\)/g, ' '));
      if (noParen) all.push(noParen);
      var uniq = {}, out = [];
      all.forEach(function (a) { if (a && !uniq[a]) { uniq[a] = 1; out.push(a); } });
      return out;
    }
    function _levenshtein(a, b) {
      if (a === b) return 0;
      if (!a.length) return b.length; if (!b.length) return a.length;
      if (Math.abs(a.length - b.length) > 2) return 99; // đủ xa → khỏi tính
      var prev = [], cur = [], i, j;
      for (j = 0; j <= b.length; j++) prev[j] = j;
      for (i = 1; i <= a.length; i++) {
        cur[0] = i;
        for (j = 1; j <= b.length; j++) {
          cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        }
        prev = cur.slice();
      }
      return prev[b.length];
    }
    function _learnCheckWritten(input, back) {
      var given = _learnNorm(input);
      if (!given) return { ok: false, close: false };
      var alts = _learnAlternatives(back);
      for (var i = 0; i < alts.length; i++) if (alts[i] === given) return { ok: true, close: false };
      // gõ gần đúng: sai ≤1 ký tự (đáp án ≥4 ký tự) → tính đúng + nhắc chính tả
      for (var k = 0; k < alts.length; k++) {
        if (alts[k].length >= 4 && _levenshtein(alts[k], given) <= 1) return { ok: true, close: true };
      }
      return { ok: false, close: false };
    }

    function learnAnswerMC(idx) {
      var st = _learnState; if (!st || st.answered) return;
      var choice = st.choices[idx]; if (!choice) return;
      _learnGrade(choice.id === st.cur.id, false);
    }
    function learnSubmitWritten() {
      var st = _learnState; if (!st || st.answered) return;
      var inp = document.getElementById('learnInput'); if (!inp) return;
      if (!inp.value.trim()) { showToast('Nhập câu trả lời hoặc bấm "Tôi chưa biết".', 'info'); return; }
      var res = _learnCheckWritten(inp.value, st.cur.back);
      _learnGrade(res.ok, res.close);
    }
    function learnDontKnow() { var st = _learnState; if (st && !st.answered) _learnGrade(false, false); }

    // Chấm + cập nhật Leitner + xếp lại hàng chờ.
    function _learnGrade(correct, close) {
      var st = _learnState; if (!st) return;
      st.answered = true; st.lastCorrect = correct; st.closeMatch = !!close;
      var id = st.cur.id;
      var box = _learnBoxOf(st.deckId, id);

      if (correct) {
        st.stats.correct++;
        var nb = box + 1;
        _learnSetBox(st.deckId, id, nb);
        st.queue.shift();
        // Chưa đạt ngưỡng thuộc → đẩy xuống cuối hàng chờ để gặp lại.
        if (nb < LEARN_MASTER_BOX) st.queue.push(id);
      } else {
        st.stats.wrong++;
        _learnSetBox(st.deckId, id, 0);   // sai → học lại từ đầu
        st.queue.shift();
        // Đưa vào hàng chờ, hiện lại sau vài thẻ (không ngay lập tức).
        st.queue.splice(Math.min(LEARN_REQUEUE_GAP, st.queue.length), 0, id);
      }
      _learnRender();
      // KHÔNG tự đọc đáp án (mặt sau) — theo quy tắc "chỉ tự động đọc mặt
      // trước". Muốn nghe đáp án thì bấm nút loa 🔊 trong khối phản hồi.
      fcStopSpeak();
    }
    function learnNext() { if (_learnState && _learnState.answered) _learnNextQuestion(); }

    // Phím tắt: 1-4 chọn đáp án, Enter = nộp/tiếp, Esc = thoát.
    function _learnKeydown(e) {
      if (!_learnState) return;
      var view = document.getElementById('flashcards-learn-view');
      if (!view || view.style.display === 'none') return;
      if (e.key === 'Escape') { e.preventDefault(); exitLearn(); return; }
      if (_learnState.answered) {
        if (e.key === 'Enter') { e.preventDefault(); learnNext(); }
        return;
      }
      if (_learnState.mode === 'mc' && /^[1-9]$/.test(e.key)) {
        var i = parseInt(e.key, 10) - 1;
        if (i < _learnState.choices.length) { e.preventDefault(); learnAnswerMC(i); }
      }
    }

    // ── Giao diện ────────────────────────────────────────────────
    function _learnStats() {
      var st = _learnState, boxes = _learnBoxes(st.deckId);
      var mastered = 0, learning = 0;
      Object.keys(st.byId).forEach(function (k) {
        var b = boxes[k]; b = typeof b === 'number' ? b : 0;
        if (b >= LEARN_MASTER_BOX) mastered++; else if (b > 0) learning++;
      });
      return { mastered: mastered, learning: learning, unseen: st.total - mastered - learning, total: st.total };
    }
    function _learnProgressHtml() {
      var s = _learnStats();
      var pct = function (n) { return s.total ? (n / s.total * 100) : 0; };
      return '<div class="learn-progress-wrap">' +
        '<div class="learn-progress-head">' +
        '<span class="learn-chip ok">✅ Đã thuộc <strong>' + s.mastered + '</strong></span>' +
        '<span class="learn-chip mid">📖 Đang học <strong>' + s.learning + '</strong></span>' +
        '<span class="learn-chip new">⬜ Chưa học <strong>' + s.unseen + '</strong></span>' +
        '<span class="learn-chip total">Tổng <strong>' + s.total + '</strong></span>' +
        '</div>' +
        '<div class="learn-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + s.total + '" aria-valuenow="' + s.mastered + '" aria-label="Số từ đã thuộc">' +
        '<div class="learn-seg ok" style="width:' + pct(s.mastered).toFixed(2) + '%"></div>' +
        '<div class="learn-seg mid" style="width:' + pct(s.learning).toFixed(2) + '%"></div>' +
        '</div></div>';
    }
    function _learnHeaderHtml() {
      var st = _learnState;
      var d = flashcardDecks.find(function (x) { return x.id === st.deckId; });
      return '<div class="learn-header">' +
        '<button class="btn btn-ghost" onclick="exitLearn()">← Thoát</button>' +
        '<div class="learn-title">🧠 Chế độ Học<span class="learn-deckname">' + escHtml(d ? d.title : '') + '</span></div>' +
        '<div class="learn-tools">' +
        (_fcTtsSupported() ? '<button class="btn btn-sm ' + (fcAutoSpeakOn() ? 'btn-primary' : 'btn-ghost') + '" id="learnAutoSpeakBtn" aria-pressed="' + (fcAutoSpeakOn() ? 'true' : 'false') + '" onclick="toggleFcAutoSpeak()">' + (fcAutoSpeakOn() ? '🔊' : '🔇') + ' Tự phát âm</button>' + fcVoiceGenderSelectHtml() : '') +
        '<button class="btn btn-sm btn-ghost" title="Học lại từ đầu (xoá tiến độ)" onclick="learnResetProgress()">↺ Đặt lại</button>' +
        '</div></div>';
    }
    function _learnRender() {
      var st = _learnState; if (!st) return;
      var view = _learnEnsureView();
      var card = st.cur;
      // lang cho ô nhập = ngôn ngữ ĐÁP ÁN (mặt sau) — gợi ý bàn phím/IME đúng.
      var qLang = fcLangFor(card.back, st.deckId);

      var html = '<div class="learn-container">' + _learnHeaderHtml() + _learnProgressHtml();

      // Câu hỏi
      html += '<div class="learn-card">' +
        '<div class="learn-qhead"><span class="badge ' + (st.mode === 'mc' ? 'badge-info' : 'badge-purple') + '">' +
        (st.mode === 'mc' ? 'Trắc nghiệm' : 'Tự luận — gõ đáp án') + '</span>' +
        '<span class="learn-remain">Còn ' + st.queue.length + ' thẻ trong lượt</span></div>' +
        '<div class="learn-question">' + card.front +
        (_fcTtsSupported() ? fcSpeakBtnHtml(card.front, st.deckId, 'câu hỏi', fcLangForCard(card, st.deckId, card.front)) : '') + '</div>' +
        (card.hint && !st.answered ? '<div class="learn-hint">💡 ' + escHtml(card.hint) + '</div>' : '');

      // Vùng trả lời
      if (st.mode === 'mc') {
        html += '<div class="learn-choices">' + st.choices.map(function (ch, i) {
          var cls = 'learn-choice';
          if (st.answered) {
            if (ch.id === card.id) cls += ' correct';
            else if (!st.lastCorrect) cls += ' dim';
          }
          return '<button class="' + cls + '"' + (st.answered ? ' disabled' : '') + ' onclick="learnAnswerMC(' + i + ')">' +
            '<span class="learn-choice-key">' + (i + 1) + '</span>' +
            '<span class="learn-choice-body">' + ch.html + '</span></button>';
        }).join('') + '</div>';
      } else {
        html += '<div class="learn-written">' +
          '<input class="form-input learn-input" id="learnInput" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" ' +
          'placeholder="Gõ đáp án rồi nhấn Enter…" lang="' + escAttr(qLang) + '"' + (st.answered ? ' disabled' : '') +
          ' onkeydown="if(event.key===\'Enter\'){event.preventDefault();' + (st.answered ? 'learnNext()' : 'learnSubmitWritten()') + ';}">' +
          (st.answered ? '' :
            '<div class="learn-written-btns">' +
            '<button class="btn btn-ghost btn-sm" onclick="learnDontKnow()">Tôi chưa biết</button>' +
            '<button class="btn btn-primary" onclick="learnSubmitWritten()">Trả lời</button></div>') +
          '</div>';
      }

      // Phản hồi sau khi trả lời — SAI thì hiện ngay đáp án đúng
      if (st.answered) {
        html += '<div class="learn-feedback ' + (st.lastCorrect ? 'ok' : 'bad') + '">' +
          '<div class="learn-fb-title">' +
          (st.lastCorrect ? (st.closeMatch ? '✅ Gần đúng — chú ý chính tả!' : '✅ Chính xác!') : '❌ Chưa đúng — đáp án đúng là:') +
          '</div>' +
          '<div class="learn-fb-answer">' + card.back +
          (_fcTtsSupported() ? fcSpeakBtnHtml(card.back, st.deckId, 'đáp án') : '') + '</div>' +
          (card.example ? '<div class="learn-fb-example">📝 ' + card.example + '</div>' : '') +
          (st.lastCorrect ? '' : '<div class="learn-fb-note">Thẻ này sẽ xuất hiện lại trong lượt tới cho tới khi bạn thuộc.</div>') +
          '<button class="btn btn-primary learn-next-btn" onclick="learnNext()">Tiếp tục ⏎</button>' +
          '</div>';
      }

      html += '</div></div>';
      view.innerHTML = html;
      typesetMath(view);
      _fcSyncAutoSpeakBtn();
      if (st.mode === 'written' && !st.answered) { var inp = document.getElementById('learnInput'); if (inp) setTimeout(function () { try { inp.focus(); } catch (e) { } }, 30); }
    }

    function _learnRenderDone() {
      var st = _learnState; if (!st) return;
      var s = _learnStats();
      var view = _learnEnsureView();
      var acc = (st.stats.correct + st.stats.wrong) > 0 ? Math.round(st.stats.correct / (st.stats.correct + st.stats.wrong) * 100) : 100;
      view.innerHTML = '<div class="learn-container">' + _learnHeaderHtml() + _learnProgressHtml() +
        '<div class="learn-card learn-done">' +
        '<div class="learn-done-ic">🎉</div>' +
        '<div class="learn-done-title">Bạn đã thuộc hết bộ thẻ này!</div>' +
        '<div class="learn-done-sub">Đúng <strong>' + st.stats.correct + '</strong> · Sai <strong>' + st.stats.wrong + '</strong> · Độ chính xác <strong>' + acc + '%</strong></div>' +
        '<div class="learn-done-btns">' +
        '<button class="btn btn-primary" onclick="learnResetProgress()">↺ Học lại từ đầu</button>' +
        '<button class="btn btn-ghost" onclick="exitLearn()">Về bộ thẻ</button>' +
        '</div></div></div>';
      _fcSyncAutoSpeakBtn();
      try { if (typeof celebrate === 'function') celebrate(); } catch (e) { }
      showToast('Hoàn thành! Đã thuộc ' + s.mastered + '/' + s.total + ' thẻ.', 'success');
    }

    // Danh sách giọng nạp muộn trên Chrome → làm mới cache khi có.
    if (_fcTtsSupported()) {
      try { window.speechSynthesis.onvoiceschanged = function () { _fcVoiceCache = null; _fcVoices(); }; } catch (e) { }
    }
