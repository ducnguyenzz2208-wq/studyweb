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
      { code: 'fr-FR', label: 'Français — fr-FR · ♀Denise/Eloise ♂Henri' },
      { code: 'de-DE', label: 'Deutsch — de-DE · ♀Katja/Amala ♂Conrad' },
      { code: 'es-ES', label: 'Español (España) — es-ES · ♀Elvira ♂Alvaro' },
      { code: 'es-MX', label: 'Español (México) — es-MX · ♀Dalia ♂Jorge' },
      { code: 'it-IT', label: 'Italiano — it-IT · ♀Elsa/Isabella ♂Diego' },
      { code: 'pt-BR', label: 'Português (Brasil) — pt-BR · ♀Francisca ♂Antonio' },
      { code: 'ru-RU', label: 'Русский — ru-RU · ♀Svetlana/Dariya ♂Dmitry' },
      { code: 'th-TH', label: 'ไทย Tiếng Thái — th-TH · ♀Premwadee ♂Niwat' },
      { code: 'id-ID', label: 'Bahasa Indonesia — id-ID · ♀Gadis ♂Ardi' },
      { code: 'hi-IN', label: 'हिन्दी Tiếng Hindi — hi-IN · ♀Swara ♂Madhur' },
      { code: 'ar-SA', label: 'العربية Tiếng Ả Rập — ar-SA · ♀Zariyah ♂Hamed' }
    ];

    // Câu mẫu để NGHE THỬ giọng trong bảng cài đặt giọng đọc.
    var FC_SAMPLE = {
      'en': 'Hello, this is a sample sentence for the flashcard.',
      'vi': 'Xin chào, đây là câu đọc thử cho thẻ ghi nhớ.',
      'ja': 'こんにちは、これは読み上げのテストです。',
      'ko': '안녕하세요, 이것은 음성 테스트입니다.',
      'zh': '你好，这是一个朗读测试。',
      'fr': 'Bonjour, ceci est un exemple de lecture.',
      'de': 'Hallo, dies ist ein Beispielsatz.',
      'es': 'Hola, esta es una frase de ejemplo.',
      'it': 'Ciao, questa è una frase di esempio.',
      'pt': 'Olá, esta é uma frase de exemplo.',
      'ru': 'Привет, это пример чтения.',
      'th': 'สวัสดี นี่คือประโยคตัวอย่าง',
      'id': 'Halo, ini contoh kalimat.',
      'hi': 'नमस्ते, यह एक उदाहरण वाक्य है।',
      'ar': 'مرحبا، هذه جملة تجريبية.'
    };
    // Tên tiếng Việt gọn cho từng mã, dùng ở bảng cài đặt giọng.
    var FC_LANG_SHORT = {
      'en-US': 'Tiếng Anh (Mỹ)', 'en-GB': 'Tiếng Anh (Anh)', 'vi-VN': 'Tiếng Việt',
      'ja-JP': 'Tiếng Nhật', 'ko-KR': 'Tiếng Hàn', 'zh-CN': 'Trung (Giản thể)',
      'zh-TW': 'Trung (Phồn thể, Đài Loan)', 'zh-HK': 'Trung (Phồn thể, Hồng Kông)',
      'fr-FR': 'Tiếng Pháp', 'de-DE': 'Tiếng Đức', 'es-ES': 'Tiếng Tây Ban Nha',
      'es-MX': 'Tiếng Tây Ban Nha (Mexico)', 'it-IT': 'Tiếng Ý', 'pt-BR': 'Tiếng Bồ Đào Nha',
      'ru-RU': 'Tiếng Nga', 'th-TH': 'Tiếng Thái', 'id-ID': 'Tiếng Indonesia',
      'hi-IN': 'Tiếng Hindi', 'ar-SA': 'Tiếng Ả Rập'
    };

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
      'xiaoxiao', 'xiaoyi', 'yaoyao', 'huihui',   // zh-CN
      'hiugaai', 'hiumaan',                       // zh-HK
      'hsiaochen', 'hsiaoyu',                     // zh-TW
      'jenny', 'aria', 'zira', 'michelle', 'ana', 'sonia', 'libby', 'maisie', // en
      'nanami', 'keiko', 'ayumi', 'haruka', 'yuna', 'mayu', 'shiori', // ja-JP
      'sunhi', 'heami', 'jimin', 'seoyeon',       // ko-KR
      'denise', 'eloise', 'jacqueline', 'yvette', 'brigitte', // fr
      'katja', 'amala', 'elke', 'klarissa', 'louisa', 'maja', 'tanja', // de
      'elvira', 'dalia', 'paloma', 'abril', 'estrella', 'irene', // es
      'elsa', 'isabella', 'fabiola', 'fiamma', 'imelda', 'palmira', // it
      'francisca', 'brenda', 'giovanna', 'leila', 'yara', 'raquel', // pt
      'svetlana', 'dariya',                       // ru
      'premwadee', 'achara',                      // th
      'gadis', 'siti',                            // id
      'swara', 'ananya', 'kavya',                 // hi
      'zariyah', 'amany', 'fatima', 'salma',      // ar
      'hazel', 'susan', 'samantha', 'victoria', 'karen', 'moira', 'tessa',
      'joanna', 'salli', 'kimberly', 'kendra', 'ivy', 'linda',
      'catherine', 'emma', 'olivia', 'sophie', 'mei'
    ];
    var FC_VOICE_MALE_NAMES = [
      'namminh',                                  // vi-VN
      'yunjian', 'yunxi', 'yunyang', 'yunxia', 'kangkang', 'zhiwei', 'liang', // zh-CN
      'wanlung',                                  // zh-HK
      'yunjhe', 'yunjun',                         // zh-TW
      'guy', 'david', 'ryan', 'christopher', 'eric', 'roger', 'steffan', 'thomas', // en
      'keita', 'naoki', 'ichiro', 'osamu', 'daichi', // ja-JP
      'injoon', 'bongjin', 'gookmin',             // ko-KR
      'henri', 'alain', 'claude', 'jerome', 'maurice', 'yves', // fr
      'conrad', 'bernd', 'christoph', 'kasper', 'killian', 'ralf', // de
      'alvaro', 'jorge', 'dario', 'elias', 'liberto', 'nil', // es
      'diego', 'benigno', 'calimero', 'cataldo', 'gianni', // it
      'antonio', 'donato', 'fabio', 'julio', 'valerio', // pt
      'dmitry',                                   // ru
      'niwat',                                    // th
      'ardi',                                     // id
      'madhur', 'arjun', 'rehaan',                // hi
      'hamed', 'shakir', 'ali',                   // ar
      'mark', 'matthew', 'brian', 'daniel', 'george', 'james', 'alex', 'fred',
      'tom'
    ];
    // So khớp theo TỪ, không phải chuỗi con. Bắt buộc phải vậy: tên giọng luôn
    // kèm tên ngôn ngữ, nên khớp chuỗi con sẽ sai nặng —
    //   'ali' nằm trong "Italian", 'ana' nằm trong "Canada",
    //   'eric' nằm trong "America"
    // → mọi giọng Ý sẽ bị coi là Nam. Tách tên thành các từ rồi so bằng nhau.
    function _fcNameTokens(name) { return String(name || '').toLowerCase().split(/[^a-zà-ỹ]+/).filter(Boolean); }
    function _fcTokensHitAny(tokens, list) {
      for (var i = 0; i < tokens.length; i++) if (list.indexOf(tokens[i]) >= 0) return true;
      return false;
    }
    function _fcVoiceGender(voice) {
      var toks = _fcNameTokens((voice && voice.name) || '');
      if (toks.indexOf('female') >= 0 || _fcTokensHitAny(toks, FC_VOICE_FEMALE_NAMES)) return 'female';
      if (toks.indexOf('male') >= 0 || _fcTokensHitAny(toks, FC_VOICE_MALE_NAMES)) return 'male';
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
    // Chờ danh sách giọng sẵn sàng rồi mới đọc. Đã có giọng → gọi lại NGAY
    // (đồng bộ, không làm trễ luồng thường). Chưa có → chờ `voiceschanged`,
    // tối đa 1.2s rồi vẫn đọc bằng giọng mặc định (thà trễ còn hơn sai giọng).
    var _fcVoiceWaiters = [];
    function _fcEnsureVoices(cb) {
      if (!_fcTtsSupported() || _fcVoices().length) { cb(); return; }
      var done = false;
      var fire = function () { if (done) return; done = true; cb(); };
      _fcVoiceWaiters.push(fire);
      setTimeout(fire, 1200);
    }
    function _fcFlushVoiceWaiters() {
      var list = _fcVoiceWaiters; _fcVoiceWaiters = [];
      list.forEach(function (f) { try { f(); } catch (e) { } });
    }
    // Máy KHÔNG có giọng nào cho ngôn ngữ này → trình duyệt sẽ đọc bằng giọng
    // mặc định (thường là tiếng Anh), nghe sai hẳn tiếng. Đây là giới hạn của
    // HĐH/trình duyệt chứ không phải lỗi app → báo 1 LẦN cho mỗi ngôn ngữ mỗi
    // phiên để người dùng biết đường cài voice pack, không spam mỗi thẻ.
    var _fcWarnedLangs = {};
    var FC_LANG_VN_NAME = {
      vi: 'tiếng Việt', zh: 'tiếng Trung', ja: 'tiếng Nhật', ko: 'tiếng Hàn',
      en: 'tiếng Anh', fr: 'tiếng Pháp', de: 'tiếng Đức', es: 'tiếng Tây Ban Nha',
      ru: 'tiếng Nga', th: 'tiếng Thái', ar: 'tiếng Ả Rập'
    };
    function _fcWarnMissingVoice(lang) {
      var base = _fcLangBase(lang);
      if (!base || _fcWarnedLangs[base]) return;
      _fcWarnedLangs[base] = 1;
      var name = FC_LANG_VN_NAME[base] || lang;
      try {
        showToast('Máy chưa cài giọng đọc ' + name + ' (' + lang + ') — đang đọc tạm bằng giọng mặc định. Cài thêm giọng trong Cài đặt hệ điều hành để nghe đúng tiếng.', 'warning');
      } catch (e) { }
    }
    // ── Chuẩn hoá mã ngôn ngữ để so khớp giọng ───────────────────
    // Trình duyệt/HĐH báo `voice.lang` rất lộn xộn: 'zh_TW' (Android, gạch
    // dưới), 'cmn-Hans-CN' (giọng Quan thoại của Google), 'yue-HK' (Quảng
    // Đông), 'zh-Hant-TW' (có subtag hệ chữ). So khớp thô theo 'zh-tw' sẽ
    // TRƯỢT hết các dạng này → rơi về giọng mặc định (tiếng Anh).
    function _fcNormLang(code) {
      var s = String(code || '').toLowerCase().replace(/_/g, '-');
      return s.replace(/^cmn/, 'zh').replace(/^yue/, 'zh'); // cmn/yue đều là tiếng Trung
    }
    function _fcLangBase(code) { return _fcNormLang(code).split('-')[0]; }
    // Mã vùng, bỏ qua subtag hệ chữ: 'zh-hant-tw' → 'tw'.
    function _fcLangRegion(code) {
      var p = _fcNormLang(code).split('-');
      for (var i = p.length - 1; i >= 1; i--) if (!/^(hans|hant|latn|cyrl)$/.test(p[i])) return p[i];
      return '';
    }
    // Hệ chữ Trung: phồn thể (hant) hay giản thể (hans) — suy từ subtag hoặc vùng.
    function _fcLangScript(code) {
      var s = _fcNormLang(code);
      if (s.indexOf('hant') >= 0) return 'hant';
      if (s.indexOf('hans') >= 0) return 'hans';
      var r = _fcLangRegion(s);
      if (r === 'tw' || r === 'hk' || r === 'mo') return 'hant';
      if (r === 'cn' || r === 'sg') return 'hans';
      return '';
    }
    // Điểm khớp NGÔN NGỮ giữa giọng và mã mong muốn. <0 = khác ngôn ngữ (loại).
    function _fcVoiceLangScore(voiceLang, want) {
      if (_fcLangBase(voiceLang) !== _fcLangBase(want)) return -1;
      if (_fcNormLang(voiceLang) === _fcNormLang(want)) return 100;   // khớp tuyệt đối
      var score = 50;                                                  // cùng ngôn ngữ (vd zh)
      if (_fcLangRegion(voiceLang) && _fcLangRegion(voiceLang) === _fcLangRegion(want)) score += 30;
      var vs = _fcLangScript(voiceLang), ws = _fcLangScript(want);
      if (vs && ws) score += (vs === ws) ? 20 : -10;                    // cùng/khác hệ chữ
      return score;
    }
    // Chọn giọng tốt nhất cho 1 ngôn ngữ + giới tính mong muốn.
    // Loại thẳng giọng KHÁC ngôn ngữ; mọi biến thể cùng ngôn ngữ đều được giữ
    // (zh-TW, zh_TW, zh-HK, cmn-Hans-CN, yue-HK… đều là 'zh') → luôn đọc đúng tiếng.
    // Xếp hạng bằng ĐIỂM TỔNG HỢP, có trọng số theo đúng thứ tự quan trọng:
    //   ngôn ngữ/vùng/hệ chữ (×10)  >  đúng giới tính (+25)  >  chất lượng giọng.
    // Vì sao KHÔNG lọc cứng theo giới tính trước: khi xin 'zh-HK' giọng nữ mà
    // máy có giọng Quảng Đông HK (không đoán được giới tính) và một giọng nữ
    // Đài Loan, lọc cứng sẽ chọn giọng Đài Loan → SAI vùng tiếng. Đọc đúng tiếng
    // quan trọng hơn đúng giới tính; giới tính chỉ phân thắng bại khi ngang ngôn ngữ.
    // Không có giọng nào cùng ngôn ngữ → trả null; `fcSpeak` vẫn đọc bằng giọng
    // mặc định theo `utterance.lang` và báo 1 lần để người dùng biết cần cài voice.
    function _fcPickVoice(lang, gender) {
      var voices = _fcVoices(); if (!voices.length) return null;
      // (0) Người dùng đã GHIM giọng cho ngôn ngữ này ở bảng Cài đặt giọng đọc
      //     → tôn trọng tuyệt đối, không đoán nữa. Tự chọn chỉ là phỏng đoán;
      //     tai người dùng mới là chuẩn cuối.
      var pinned = fcPinnedVoice(lang);
      if (pinned) {
        for (var p = 0; p < voices.length; p++) if (voices[p].name === pinned) return voices[p];
      }
      var wantG = (gender === 'male' || gender === 'female') ? gender : null;
      var best = null, bestScore = -1;
      voices.forEach(function (v) {
        var ls = _fcVoiceLangScore(v.lang, lang);
        if (ls < 0) return;                                   // khác ngôn ngữ → loại
        var score = ls * 10 + _fcVoiceQuality(v);
        if (wantG && _fcVoiceGender(v) === wantG) score += 25;
        if (score > bestScore) { bestScore = score; best = v; }
      });
      return best;
    }

    // Đọc 1 đoạn văn bản. Tự huỷ câu đang đọc để không chồng tiếng.
    // `gender` (tuỳ chọn): 'male'/'female' — ép giọng + độ trầm/bổng cho lượt đọc
    // này; bỏ trống thì dùng cấu hình cố định (nếu có) hoặc giọng đang xen kẽ.
    function fcSpeak(text, lang, gender) {
      if (!_fcTtsSupported()) { showToast('Trình duyệt không hỗ trợ phát âm.', 'warning'); return; }
      var say = _fcPlainText(text);
      if (!say) { showToast('Mặt thẻ này không có chữ để đọc (chỉ có hình/công thức).', 'info'); return; }
      if (say.length > 400) say = say.slice(0, 400); // chống đọc lê thê
      // Cắt tiếng đang đọc NGAY (kể cả khi phải chờ nạp giọng bên dưới).
      try { window.speechSynthesis.cancel(); } catch (e0) { }
      // Chrome nạp danh sách giọng BẤT ĐỒNG BỘ: câu đầu tiên sau khi tải trang
      // thường gặp getVoices() rỗng → không gán được giọng đúng ngôn ngữ →
      // đọc bằng giọng mặc định (tiếng Anh). Chờ giọng sẵn sàng rồi mới đọc.
      _fcEnsureVoices(function () { _fcSpeakNow(say, lang, gender); });
    }
    function _fcSpeakNow(say, lang, gender) {
      try {
        var u = new window.SpeechSynthesisUtterance(say);
        // 'auto'/rỗng KHÔNG phải mã hợp lệ → phải tự nhận diện, nếu không
        // utterance.lang='auto' làm trình duyệt rơi về giọng mặc định.
        u.lang = (lang && lang !== 'auto') ? lang : fcDetectLang(say);
        var pref = fcVoiceGenderPref();
        var g = gender || (pref !== 'auto' ? pref : _fcGenderToggle);
        var v = _fcPickVoice(u.lang, g);
        if (!v) _fcWarnMissingVoice(u.lang);
        // Gán voice trong try RIÊNG: nếu object giọng "hỏng" (một số trình
        // duyệt/thiết bị trả voice không hợp lệ), lỗi ở đây KHÔNG được làm
        // rớt luôn cả câu nói — phải rơi về giọng chuẩn của u.lang mà vẫn đọc.
        if (v) { try { u.voice = v; } catch (e2) { } }
        // rate 0.9–0.95, pitch Nữ 1.05–1.10 / Nam 0.85–0.90 — lấy điểm GIỮA
        // khoảng cho tự nhiên nhất (biên trên/dưới dễ nghe robot hơn).
        // QUAN TRỌNG: pitch phải theo GIỌNG THỰC SỰ được dùng, không theo giới
        // tính vừa yêu cầu. Khi người dùng ghim một giọng nam mà lượt này đang
        // xin giọng nữ, lấy pitch 1.08 sẽ đẩy giọng nam cao lên nghe rất giả.
        var actual = v ? _fcVoiceGender(v) : 'unknown';
        var pitchG = (actual === 'unknown') ? g : actual;
        u.rate = 0.92;
        u.pitch = (pitchG === 'male') ? 0.88 : 1.08;
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

    // ============================================================
    // CÀI ĐẶT GIỌNG ĐỌC — chọn & nghe thử giọng THẬT của máy
    // ------------------------------------------------------------
    // Web Speech API CHỈ dùng được giọng đã cài trên máy: không có cách nào
    // "tải thêm giọng" bằng JavaScript. Nên thay vì đoán mãi, bảng này cho
    // người dùng thấy máy mình thực sự có giọng gì cho từng ngôn ngữ, tự nghe
    // thử, và GHIM giọng mình thích — lựa chọn đó thắng mọi phỏng đoán.
    // Ngôn ngữ nào máy chưa có giọng thì nói thẳng + chỉ cách cài thêm.
    // ============================================================
    function _fcVoiceMap() { return _fcLsGet(_fcPk('th_fc_voicemap'), {}) || {}; }
    function fcPinnedVoice(lang) {
      var m = _fcVoiceMap();
      return m[_fcNormLang(lang)] || '';
    }
    function fcPinVoice(lang, voiceName) {
      var key = _fcNormLang(lang), m = _fcVoiceMap();
      if (voiceName) m[key] = voiceName; else delete m[key];
      _fcLsSet(_fcPk('th_fc_voicemap'), m);
      showToast(voiceName ? ('Đã ghim giọng cho ' + (FC_LANG_SHORT[lang] || lang) + '.') : ('Đã bỏ ghim — tự chọn lại cho ' + (FC_LANG_SHORT[lang] || lang) + '.'), 'success');
      _fcRenderVoiceRows();
    }
    // Các giọng dùng được cho 1 mã ngôn ngữ, xếp giọng tốt nhất lên đầu.
    function fcVoicesFor(lang) {
      return _fcVoices()
        .map(function (v) { return { v: v, s: _fcVoiceLangScore(v.lang, lang) }; })
        .filter(function (x) { return x.s >= 0; })
        .sort(function (a, b) { return (b.s - a.s) || (_fcVoiceQuality(b.v) - _fcVoiceQuality(a.v)); })
        .map(function (x) { return x.v; });
    }
    function _fcSampleFor(lang) { return FC_SAMPLE[_fcLangBase(lang)] || FC_SAMPLE.en; }
    // Nghe thử: đọc câu mẫu bằng ĐÚNG giọng của dòng đó (không qua bộ tự chọn).
    function fcPreviewVoice(lang, voiceName) {
      if (!_fcTtsSupported()) { showToast('Trình duyệt không hỗ trợ phát âm.', 'warning'); return; }
      var voices = _fcVoices(), target = null;
      for (var i = 0; i < voices.length; i++) if (voices[i].name === voiceName) { target = voices[i]; break; }
      try {
        window.speechSynthesis.cancel();
        var u = new window.SpeechSynthesisUtterance(_fcSampleFor(lang));
        u.lang = lang;
        if (target) { try { u.voice = target; } catch (e) { } }
        var g = target ? _fcVoiceGender(target) : 'unknown';
        u.rate = 0.92; u.pitch = (g === 'male') ? 0.88 : 1.08; u.volume = 1;
        window.speechSynthesis.speak(u);
      } catch (e) { console.warn('preview lỗi:', e && e.message); }
    }
    function _fcQualityTag(v) {
      var q = _fcVoiceQuality(v);
      if (q >= 4) return '<span class="badge badge-success fc-vq">Tự nhiên</span>';
      if (q >= 2) return '<span class="badge badge-info fc-vq">Khá</span>';
      return '<span class="badge badge-gray fc-vq">Cơ bản</span>';
    }
    function _fcGenderTag(v) {
      var g = _fcVoiceGender(v);
      return g === 'female' ? '♀' : (g === 'male' ? '♂' : '·');
    }
    // Chỉ hiện ngôn ngữ ĐANG DÙNG trong app + ngôn ngữ máy có giọng, để bảng
    // không dài vô ích với 19 dòng phần lớn trống.
    function _fcRelevantLangs() {
      var used = {};
      (typeof flashcardDecks !== 'undefined' ? flashcardDecks : []).forEach(function (d) {
        var dl = fcDeckLang(d.id); if (dl && dl !== 'auto') used[dl] = 1;
        (d.cards || []).forEach(function (c) { var cl = fcCardLang(c, d.id); if (cl) used[cl] = 1; });
      });
      _fcVoices().forEach(function (v) {
        // gán giọng của máy về mã chuẩn gần nhất trong danh sách
        FC_TTS_LANGS.forEach(function (l) { if (l.code !== 'auto' && _fcVoiceLangScore(v.lang, l.code) >= 50) used[l.code] = 1; });
      });
      ['en-US', 'vi-VN'].forEach(function (c) { used[c] = 1; });   // luôn hiện 2 mã chính
      return FC_TTS_LANGS.filter(function (l) { return l.code !== 'auto' && used[l.code]; }).map(function (l) { return l.code; });
    }
    function _fcVoiceRowsHtml() {
      var langs = _fcRelevantLangs();
      var rows = langs.map(function (code) {
        var list = fcVoicesFor(code);
        var pinned = fcPinnedVoice(code);
        var name = FC_LANG_SHORT[code] || code;
        if (!list.length) {
          return '<div class="fc-voice-row missing">' +
            '<div class="fc-voice-lang">' + escHtml(name) + '<span class="fc-voice-code">' + code + '</span></div>' +
            '<div class="fc-voice-none">Máy chưa có giọng cho ngôn ngữ này — sẽ đọc bằng giọng mặc định (nghe sai tiếng).</div>' +
            '</div>';
        }
        var opts = '<option value="">Tự chọn (giọng tốt nhất)</option>' + list.map(function (v) {
          return '<option value="' + escAttr(v.name) + '"' + (pinned === v.name ? ' selected' : '') + '>' +
            _fcGenderTag(v) + ' ' + escHtml(v.name.replace(/Microsoft |Online \(Natural\) |\(Natural\) /g, '')) + '</option>';
        }).join('');
        var top = list[0];
        return '<div class="fc-voice-row">' +
          '<div class="fc-voice-lang">' + escHtml(name) + '<span class="fc-voice-code">' + code + '</span></div>' +
          '<div class="fc-voice-pick">' +
          '<select class="form-select" aria-label="Giọng cho ' + escAttr(name) + '" onchange="fcPinVoice(' + qid(code) + ',this.value)">' + opts + '</select>' +
          '<button class="btn btn-sm btn-ghost" title="Nghe thử" onclick="fcPreviewVoice(' + qid(code) + ',this.previousElementSibling.value)">🔊 Thử</button>' +
          '</div>' +
          '<div class="fc-voice-meta">' + _fcQualityTag(pinned ? (list.filter(function (v) { return v.name === pinned; })[0] || top) : top) +
          '<span class="fc-voice-count">' + list.length + ' giọng</span></div>' +
          '</div>';
      }).join('');
      var have = langs.filter(function (c) { return fcVoicesFor(c).length; }).length;
      return '<div class="fc-voice-summary">Máy đang có giọng cho <strong>' + have + '/' + langs.length + '</strong> ngôn ngữ · tổng <strong>' + _fcVoices().length + '</strong> giọng.</div>' +
        '<div class="fc-voice-list">' + rows + '</div>';
    }
    function _fcRenderVoiceRows() {
      var box = document.getElementById('fcVoiceBody');
      if (box) box.innerHTML = _fcVoiceRowsHtml();
    }
    function openFcVoiceSettings() {
      if (!_fcTtsSupported()) { showToast('Trình duyệt không hỗ trợ phát âm.', 'warning'); return; }
      var render = function () {
        openModal('<div class="modal-header"><h3>🔊 Cài đặt giọng đọc</h3>' +
          '<button class="modal-close" onclick="closeModal()" aria-label="Đóng">✕</button></div>' +
          '<div class="modal-body"><div id="fcVoiceBody">' + _fcVoiceRowsHtml() + '</div>' +
          '<div class="fc-voice-help">Giọng đọc do <strong>hệ điều hành / trình duyệt</strong> cung cấp — trang web không tải thêm giọng được. ' +
          'Muốn có giọng tự nhiên cho tiếng Việt, Trung, Nhật, Hàn: mở <strong>Edge</strong> (có sẵn giọng “Online (Natural)”), ' +
          'hoặc trên Windows vào <em>Cài đặt → Thời gian &amp; Ngôn ngữ → Giọng nói → Thêm giọng</em>.</div>' +
          '</div><div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Đóng</button></div>', 'modal-lg');
      };
      // Chrome nạp giọng bất đồng bộ — chờ có danh sách rồi mới mở bảng.
      if (_fcVoices().length) render();
      else { showBusy('Đang lấy danh sách giọng…'); _fcEnsureVoices(function () { hideBusy(); render(); }); }
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
        fcVoiceGenderSelectHtml() +
        '<button class="btn btn-sm btn-ghost" title="Chọn & nghe thử giọng đọc theo từng ngôn ngữ" onclick="openFcVoiceSettings()">🔊 Giọng…</button>';
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

    // Có công thức LaTeX trong nội dung hay không (\( \) · \[ \] · $…$ · $$…$$).
    function _fcHasMath(s) {
      var t = String(s || '');
      return /\\\(|\\\[|\$\$|\$[^$\n]*\$/.test(t);
    }
    // Thẻ chỉ hỏi TỰ LUẬN được khi đáp án GÕ ĐƯỢC: có chữ, không phải ảnh,
    // KHÔNG chứa công thức, và không quá dài. Ảnh/công thức → luôn trắc nghiệm.
    // Lưu ý phần công thức: đáp án kiểu `\(x = 2\) or \(x = 3\)` sau khi lột
    // LaTeX chỉ còn chữ "or" → bản cũ tưởng gõ được và bắt học sinh gõ "or"
    // (vô nghĩa, gần như luôn sai). Có LaTeX là ép trắc nghiệm.
    function _learnTypeable(card) {
      var a = _fcPlainText(card.back);
      return !!a && !_fcHasImage(card.back) && !_fcHasMath(card.back) && a.length <= 60;
    }
    function _learnModeFor(card, deckId) {
      var box = _learnBoxOf(deckId, card.id);
      // box 0 LUÔN trắc nghiệm được — `_learnBuildChoices` bảo đảm đủ 4 ô kể cả
      // khi bộ thẻ ít thẻ (mượn bộ khác / ô giữ chỗ).
      if (box <= 0) return 'mc';
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
      if (typeof fcHideTestGame === 'function') fcHideTestGame(); // ẩn Bài kiểm tra/Trò chơi + dừng đồng hồ
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
      st.mode = _learnModeFor(card, st.deckId);
      st.choices = st.mode === 'mc' ? _learnBuildChoices(card) : [];
      _learnRender();
      // Câu hỏi CHÍNH LÀ mặt trước → được tự động đọc (đúng quy tắc "chỉ đọc
      // mặt trước"); đáp án/mặt sau thì không.
      if (fcAutoSpeakOn()) fcSpeakCardFront(card, st.deckId);
    }
    // Thẻ có nội dung hiển thị được hay không. LƯU Ý: KHÔNG dùng `_fcPlainText`
    // để xét — thẻ Toán mặt sau là LaTeX thuần (vd `\(3x^2\)`) sẽ cho chuỗi
    // RỖNG sau khi lột LaTeX, nên bản cũ loại sạch thẻ Toán khỏi pool nhiễu →
    // trắc nghiệm chỉ còn 1 ô. Ở đây chỉ cần mặt sau có ký tự bất kỳ.
    function _fcCardHasContent(html) { return !!String(html == null ? '' : html).trim(); }
    // Khoá chống trùng: ưu tiên chữ thuần; LaTeX/ảnh (chữ thuần rỗng) thì so
    // theo chính chuỗi HTML đã chuẩn hoá.
    function _learnChoiceKey(back) {
      var t = _fcPlainText(back);
      return t ? ('t:' + t.toLowerCase()) : ('h:' + String(back || '').replace(/\s+/g, ' ').trim().toLowerCase());
    }
    // Mượn đáp án nhiễu từ bộ thẻ KHÁC khi bộ hiện tại quá ít thẻ — ưu tiên bộ
    // CÙNG MÔN để phương án nhiễu còn hợp lý (Toán lẫn Toán, không lẫn từ vựng).
    // id dạng chuỗi 'x<deck>_<card>' → không bao giờ trùng id số của đáp án đúng.
    function _learnBorrowDistractors(deckId, seen, count) {
      var out = [];
      if (count <= 0 || typeof flashcardDecks === 'undefined') return out;
      var cur = flashcardDecks.find(function (d) { return d.id === deckId; });
      var subject = cur ? cur.subject : '';
      var decks = flashcardDecks.filter(function (d) { return d.id !== deckId && d.cards && d.cards.length; })
        .sort(function (a, b) { return (b.subject === subject ? 1 : 0) - (a.subject === subject ? 1 : 0); });
      decks.forEach(function (d) {
        d.cards.forEach(function (c) {
          if (!_fcCardHasContent(c.back)) return;
          var key = _learnChoiceKey(c.back);
          if (seen[key]) return;
          seen[key] = 1;
          out.push({ id: 'x' + d.id + '_' + c.id, html: c.back, text: _fcPlainText(c.back) });
        });
      });
      _fcShuffle(out);
      return out.slice(0, count);
    }
    // LUÔN trả về đủ `count` (mặc định 4) lựa chọn: 1 đáp án đúng + nhiễu, vị
    // trí đáp án đúng được xáo ngẫu nhiên (lưới 2x2).
    // DÙNG CHUNG cho Chế độ Học và Bài kiểm tra (28-flashcard-test-game.js).
    function fcBuildChoices(card, cards, deckId, count) {
      count = count || LEARN_MC_CHOICES;
      var mk = function (c) { return { id: c.id, html: c.back, text: _fcPlainText(c.back) }; };
      var correct = mk(card);
      var seen = {}; seen[_learnChoiceKey(card.back)] = 1;
      var need = count - 1;

      // 1) Nhiễu từ CHÍNH bộ thẻ đang học.
      var pool = [];
      (cards || []).forEach(function (c) {
        if (!c || c.id === card.id || !_fcCardHasContent(c.back)) return;
        var key = _learnChoiceKey(c.back);
        if (seen[key]) return;
        seen[key] = 1;
        pool.push(mk(c));
      });
      _fcShuffle(pool);

      // 2) Chưa đủ (bộ ít thẻ / nhiều thẻ trùng đáp án) → mượn bộ khác.
      if (pool.length < need) pool = pool.concat(_learnBorrowDistractors(deckId, seen, need - pool.length));
      // 3) Vẫn chưa đủ (cả app chỉ có vài thẻ) → ô giữ chỗ để lưới luôn 2x2.
      while (pool.length < need) {
        pool.push({ id: '__filler' + pool.length, html: '<span class="learn-filler">— không có lựa chọn khác —</span>', text: '' });
      }

      var choices = pool.slice(0, need);
      choices.push(correct);
      return _fcShuffle(choices); // xáo vị trí đáp án đúng trong các ô
    }
    function _learnBuildChoices(card) {
      var st = _learnState;
      var arr = Object.keys(st.byId).map(function (k) { return st.byId[k]; });
      return fcBuildChoices(card, arr, st.deckId, LEARN_MC_CHOICES);
    }

    // ── Chấm câu trả lời ─────────────────────────────────────────
    // So khớp tự luận "thông minh": bỏ dấu câu/khoảng trắng thừa, chấp nhận
    // nhiều đáp án ngăn bởi "/" hoặc ";", và tha lỗi gõ nhầm 1 ký tự.
    var _FC_STOP_WORDS_RE = /^(con|cái|quả|trái|chiếc|bức|cây|bông|ngôi|căn|cuốn|quyển|bài|tấm|lá|viên|toà|tờ|hạt|sợi|mẩu|người|sự|việc|đồ|vị|chú|anh|chị|ông|bà|cô|thầy|em|bác|cậu|bộ|loại|thẻ|a|an|the|to)\s+/gi;

    function _learnStripClassifiers(str) {
      if (!str) return '';
      var s = String(str).trim();
      var prev;
      do {
        prev = s;
        s = s.replace(_FC_STOP_WORDS_RE, '').trim();
      } while (s !== prev);
      return s;
    }

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

      // Thêm dạng đã lọc từ chỉ loại/lượng từ (ví dụ "Con chó" -> "chó")
      var strippedAll = [];
      all.forEach(function (a) {
        if (a) {
          strippedAll.push(a);
          var strp = _learnStripClassifiers(a);
          if (strp && strp !== a) strippedAll.push(strp);
        }
      });

      var uniq = {}, out = [];
      strippedAll.forEach(function (a) { if (a && !uniq[a]) { uniq[a] = 1; out.push(a); } });
      return out;
    }
    function _levenshtein(a, b) {
      if (a === b) return 0;
      if (!a.length) return b.length; if (!b.length) return a.length;
      if (Math.abs(a.length - b.length) > 3) return 99; // đủ xa → khỏi tính
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
      var rawGiven = _learnNorm(input);
      if (!rawGiven) return { ok: false, close: false };
      var givenStripped = _learnStripClassifiers(rawGiven);

      var alts = _learnAlternatives(back);
      
      // 1. Chính xác tuyệt đối (gốc hoặc đã lọc từ chỉ loại/mạo từ)
      for (var i = 0; i < alts.length; i++) {
        var alt = alts[i];
        if (alt === rawGiven || alt === givenStripped) return { ok: true, close: false };
      }

      // 2. Chấp nhận dạng từ con / chứa từ khoá chính (sub-phrase / token overlap)
      // Ví dụ: người dùng gõ "chó", đáp án "con chó" hoặc ngược lại
      for (var j = 0; j < alts.length; j++) {
        var a = alts[j];
        var aStrp = _learnStripClassifiers(a);
        if (a === givenStripped || aStrp === rawGiven || aStrp === givenStripped) return { ok: true, close: true };
        
        if (rawGiven.length >= 2 && a.length >= 2) {
          if (a.indexOf(rawGiven) >= 0 || rawGiven.indexOf(a) >= 0 ||
              aStrp.indexOf(givenStripped) >= 0 || givenStripped.indexOf(aStrp) >= 0) {
            return { ok: true, close: true };
          }
        }
      }

      // 3. gõ gần đúng theo khoảng cách Levenshtein (sai ≤1-2 ký tự tuỳ độ dài)
      for (var k = 0; k < alts.length; k++) {
        var targetAlt = alts[k];
        var maxDist = targetAlt.length >= 8 ? 2 : (targetAlt.length >= 4 ? 1 : 0);
        if (maxDist > 0) {
          if (_levenshtein(targetAlt, rawGiven) <= maxDist || _levenshtein(targetAlt, givenStripped) <= maxDist) {
            return { ok: true, close: true };
          }
        }
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
        (_fcTtsSupported() ? '<button class="btn btn-sm ' + (fcAutoSpeakOn() ? 'btn-primary' : 'btn-ghost') + '" id="learnAutoSpeakBtn" aria-pressed="' + (fcAutoSpeakOn() ? 'true' : 'false') + '" onclick="toggleFcAutoSpeak()">' + (fcAutoSpeakOn() ? '🔊' : '🔇') + ' Tự phát âm</button>' + fcVoiceGenderSelectHtml() +
          '<button class="btn btn-sm btn-ghost" title="Chọn & nghe thử giọng đọc" onclick="openFcVoiceSettings()">🔊 Giọng…</button>' : '') +
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
        (typeof fcPhoneticBadgeHtml === 'function' ? fcPhoneticBadgeHtml(card.front, st.deckId, card) : '') +
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
          (typeof fcPhoneticBadgeHtml === 'function' ? fcPhoneticBadgeHtml(card.back, st.deckId, card) : '') +
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
        '<button class="btn btn-warning" onclick="startTest(' + st.deckId + ', true)">📝 Làm bài trắc nghiệm</button>' +
        '<button class="btn btn-primary" onclick="learnResetProgress()">↺ Học lại từ đầu</button>' +
        '<button class="btn btn-ghost" onclick="exitLearn()">Về bộ thẻ</button>' +
        '</div></div></div>';
      _fcSyncAutoSpeakBtn();
      try { if (typeof celebrate === 'function') celebrate(); } catch (e) { }
      showToast('Hoàn thành! Đã thuộc ' + s.mastered + '/' + s.total + ' thẻ.', 'success');
    }

    // Danh sách giọng nạp muộn trên Chrome → làm mới cache khi có.
    if (_fcTtsSupported()) {
      try {
        window.speechSynthesis.onvoiceschanged = function () {
          _fcVoiceCache = null; _fcVoices();
          _fcFlushVoiceWaiters();   // câu đang chờ giọng → đọc ngay với giọng đúng
        };
      } catch (e) { }
    }
