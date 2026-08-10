    // ============================================================
    // FLASHCARD — 2 CHẾ ĐỘ ÔN TẬP MỚI
    //  (1) BÀI KIỂM TRA (Test): 10–20 câu trộn 3 dạng — Trắc nghiệm (4 lựa
    //      chọn) / Đúng-Sai / Tự luận ngắn. Làm hết rồi bấm NỘP BÀI → điểm %,
    //      chi tiết đúng/sai từng câu, nút Làm lại.
    //  (2) TRÒ CHƠI GHÉP THẺ (Matching): 6–8 cặp → lưới 12–16 ô xáo trộn, bấm
    //      2 ô để ghép Thuật ngữ ↔ Định nghĩa, có đồng hồ giây + kỷ lục bộ thẻ.
    //
    // TÁI SỬ DỤNG helper của 27-flashcard-learn.js (không nhân đôi logic):
    //   fcBuildChoices()   dựng 4 lựa chọn + nhiễu (đã xử lý thẻ LaTeX/ảnh)
    //   _learnCheckWritten() chấm tự luận thông minh (bỏ dấu câu, tha lỗi 1 ký tự)
    //   _learnTypeable()   đáp án có gõ được không (LaTeX/ảnh/quá dài → không)
    //   _fcPlainText/_fcShuffle/_fcCardHasContent/_learnChoiceKey/_fcLs*/_fcPk
    //   fcSpeakBtnHtml()   nút loa đọc thủ công theo đúng mã lang của thẻ
    // Hiển thị: mọi nội dung chèn RAW HTML rồi gọi typesetMath() → công thức
    // Toán ($a^2+b^2=c^2$), chữ Trung (zh-CN/zh-TW) và Tiếng Việt đều đúng.
    // ============================================================

    // Ẩn 2 màn này (gọi từ 23-flashcards.js khi chuyển view khác).
    function fcHideTestGame() {
      _matchStopTimer();
      ['flashcards-test-view', 'flashcards-match-view'].forEach(function (id) {
        var v = document.getElementById(id);
        if (v) { v.style.display = 'none'; v.innerHTML = ''; }
      });
      _testState = null; _matchState = null;
    }
    // Ẩn mọi màn khác của mục Flashcard trước khi mở 1 màn mới.
    // DỌN LUÔN state + DOM của màn động bị ẩn: không để lại bài kiểm tra cũ
    // trong bộ nhớ, và bắt buộc dừng đồng hồ trò chơi (nếu không interval vẫn
    // chạy nền sau khi đã chuyển sang chế độ khác).
    function _fcOnlyView(showId) {
      ['flashcards-list-view', 'flashcards-deck-view', 'flashcards-study-view',
        'flashcards-learn-view', 'flashcards-test-view', 'flashcards-match-view'
      ].forEach(function (id) {
        var v = document.getElementById(id); if (!v) return;
        if (id === showId) { v.style.display = ''; return; }
        v.style.display = 'none';
        // Giữ list/deck view để không mất trạng thái; dọn các màn động.
        if (id === 'flashcards-learn-view') v.innerHTML = '';
        if (id === 'flashcards-test-view') { v.innerHTML = ''; _testState = null; }
        if (id === 'flashcards-match-view') { v.innerHTML = ''; _matchStopTimer(); _matchState = null; }
      });
      if (typeof fcStopSpeak === 'function') fcStopSpeak();
    }
    function _fcEnsureView(id) {
      var v = document.getElementById(id);
      if (!v) {
        v = document.createElement('div'); v.id = id;
        (document.getElementById('section-flashcards') || document.body).appendChild(v);
      }
      return v;
    }
    function _fcDeck(deckId) { return flashcardDecks.find(function (d) { return d.id === deckId; }); }
    // Thẻ dùng được cho Test/Game: phải có nội dung ở CẢ 2 mặt.
    function _fcUsableCards(deck) {
      return (deck && deck.cards ? deck.cards : []).filter(function (c) {
        return _fcCardHasContent(c.front) && _fcCardHasContent(c.back);
      });
    }

    // ============================================================
    // (1) BÀI KIỂM TRA (TEST MODE)
    // ============================================================
    var FC_TEST_MAX = 20;              // tối đa 20 câu / bài
    var _testState = null;
    // {deckId, questions:[{type,cardId,card,choices?,shown?,expected?,correct?,close?}],
    //  answers:{qi:value}, submitted:bool}

    function startTest(deckId, mcOnly) {
      var d = _fcDeck(deckId);
      var cards = _fcUsableCards(d);
      if (!cards.length) { showToast('Bộ thẻ chưa có thẻ đủ 2 mặt để làm bài kiểm tra.', 'warning'); return; }
      _matchStopTimer();
      _testState = { deckId: deckId, mcOnly: mcOnly, questions: _testBuildQuestions(d, cards, mcOnly), answers: {}, submitted: false };
      _fcOnlyView('flashcards-test-view');
      _renderTest();
      try { _fcEnsureView('flashcards-test-view').scrollIntoView({ block: 'start' }); } catch (e) { }
    }
    // Trộn 3 dạng câu hỏi: ~40% trắc nghiệm · ~30% đúng/sai · ~30% tự luận.
    // Thẻ KHÔNG gõ được (LaTeX/ảnh/đáp án dài) không nhận dạng tự luận → đổi
    // sang trắc nghiệm (nếu không sẽ bắt học sinh gõ công thức, gần như luôn sai).
    function _testBuildQuestions(deck, cards, mcOnly) {
      var pool = cards.slice(); _fcShuffle(pool);
      var picked = pool.slice(0, Math.min(FC_TEST_MAX, pool.length));
      var all = deck.cards || [];
      var qs = picked.map(function (card, i) {
        var r = i % 10;
        var type = mcOnly ? 'mc' : (r < 4 ? 'mc' : (r < 7 ? 'tf' : 'written'));
        if (type === 'written' && !_learnTypeable(card)) type = 'mc';
        var q = { type: type, cardId: card.id, card: card };
        if (type === 'mc') q.choices = fcBuildChoices(card, all, deck.id, 4);
        if (type === 'tf') {
          // 50/50 hiện đúng định nghĩa của thẻ, hoặc định nghĩa của thẻ KHÁC.
          var showTrue = Math.random() < 0.5;
          q.shown = card.back; q.expected = true;
          if (!showTrue) {
            var mine = _learnChoiceKey(card.back);
            var others = all.filter(function (c) {
              return c.id !== card.id && _fcCardHasContent(c.back) && _learnChoiceKey(c.back) !== mine;
            });
            if (others.length) {
              q.shown = others[Math.floor(Math.random() * others.length)].back;
              q.expected = false;
            }
          }
        }
        return q;
      });
      _fcShuffle(qs);
      return qs;
    }

    // ── Nhận câu trả lời (KHÔNG vẽ lại cả bài để không mất focus ô đang gõ) ──
    function testSetMC(qi, ci) {
      var st = _testState; if (!st || st.submitted) return;
      st.answers[qi] = ci;
      var box = document.getElementById('testQ' + qi); if (!box) return;
      Array.prototype.forEach.call(box.querySelectorAll('.test-choice'), function (b, k) {
        b.classList.toggle('picked', k === ci);
      });
    }
    function testSetTF(qi, val) {
      var st = _testState; if (!st || st.submitted) return;
      st.answers[qi] = val;
      var box = document.getElementById('testQ' + qi); if (!box) return;
      Array.prototype.forEach.call(box.querySelectorAll('.test-tf-btn'), function (b) {
        b.classList.toggle('picked', b.getAttribute('data-val') === String(val));
      });
    }
    function testSetWritten(qi, val) {
      var st = _testState; if (!st || st.submitted) return;
      st.answers[qi] = val;
    }

    function _testAnswered() {
      var st = _testState, n = 0;
      st.questions.forEach(function (q, i) {
        var a = st.answers[i];
        if (q.type === 'written') { if (a != null && String(a).trim()) n++; }
        else if (a != null) n++;
      });
      return n;
    }
    // Chấm bài: trắc nghiệm so id, đúng/sai so boolean, tự luận dùng bộ so khớp
    // thông minh của Chế độ Học (bỏ hoa/thường + dấu câu, tha lỗi gõ 1 ký tự).
    function _testGrade() {
      var st = _testState;
      st.questions.forEach(function (q, i) {
        var a = st.answers[i];
        if (q.type === 'mc') {
          q.correct = a != null && !!q.choices[a] && q.choices[a].id === q.cardId;
        } else if (q.type === 'tf') {
          q.correct = a === q.expected;
        } else {
          var res = (a != null && String(a).trim()) ? _learnCheckWritten(String(a), q.card.back) : { ok: false, close: false };
          q.correct = res.ok; q.close = res.close;
        }
      });
    }
    function submitTest() {
      var st = _testState; if (!st || st.submitted) return;
      var left = st.questions.length - _testAnswered();
      var go = function () {
        _testGrade(); st.submitted = true; _renderTest();
        var score = _testScore();
        try { if (score.pct >= 80 && typeof celebrate === 'function') celebrate(); } catch (e) { }
        showToast('Đã nộp bài: ' + score.correct + '/' + score.total + ' câu đúng (' + score.pct + '%).',
          score.pct >= 50 ? 'success' : 'warning');
        try { _fcEnsureView('flashcards-test-view').scrollIntoView({ block: 'start' }); } catch (e) { }
      };
      if (left > 0) uiConfirm('Còn ' + left + ' câu chưa trả lời. Nộp bài luôn?', go);
      else go();
    }
    function _testScore() {
      var st = _testState, c = 0;
      st.questions.forEach(function (q) { if (q.correct) c++; });
      var total = st.questions.length;
      return { correct: c, wrong: total - c, total: total, pct: total ? Math.round(c / total * 100) : 0 };
    }
    function retakeTest() { var st = _testState; if (st && st.deckId != null) startTest(st.deckId, st.mcOnly); }
    function exitTest() {
      var id = _testState ? _testState.deckId : null;
      _testState = null;
      var v = document.getElementById('flashcards-test-view'); if (v) { v.style.display = 'none'; v.innerHTML = ''; }
      if (typeof fcStopSpeak === 'function') fcStopSpeak();
      if (id != null) openDeckDetail(id); else backToDecks();
    }

    // ── Giao diện bài kiểm tra ───────────────────────────────────
    var FC_TEST_TYPE_LABEL = { mc: 'Trắc nghiệm', tf: 'Đúng / Sai', written: 'Tự luận' };
    var FC_TEST_TYPE_BADGE = { mc: 'badge-info', tf: 'badge-warning', written: 'badge-purple' };

    function _renderTest() {
      var st = _testState; if (!st) return;
      var view = _fcEnsureView('flashcards-test-view');
      var d = _fcDeck(st.deckId);
      var html = '<div class="test-container">' +
        '<div class="learn-header">' +
        '<button class="btn btn-ghost" onclick="exitTest()">← Thoát</button>' +
        '<div class="learn-title">📝 Bài kiểm tra<span class="learn-deckname">' + escHtml(d ? d.title : '') + '</span></div>' +
        '<div class="learn-tools"><button class="btn btn-sm btn-ghost" onclick="retakeTest()">↺ Đề mới</button></div>' +
        '</div>';

      if (st.submitted) html += _testResultHtml();
      else html += '<div class="test-intro">' + st.questions.length + ' câu · trộn Trắc nghiệm, Đúng/Sai và Tự luận. ' +
        'Làm xong bấm <strong>Nộp bài</strong> ở cuối trang.</div>';

      html += '<div class="test-qlist">' +
        st.questions.map(function (q, i) { return _testQuestionHtml(q, i, st.submitted); }).join('') +
        '</div>';

      if (!st.submitted) {
        html += '<div class="test-submit-bar">' +
          '<span class="test-progress" id="testProgress">Đã trả lời ' + _testAnswered() + '/' + st.questions.length + '</span>' +
          '<button class="btn btn-primary" onclick="submitTest()">✓ Nộp bài</button></div>';
      } else {
        html += '<div class="test-submit-bar">' +
          '<button class="btn btn-ghost" onclick="exitTest()">Về bộ thẻ</button>' +
          '<button class="btn btn-primary" onclick="retakeTest()">↺ Làm lại bài test</button></div>';
      }
      html += '</div>';
      view.innerHTML = html;
      typesetMath(view);           // render công thức Toán trong câu hỏi/đáp án
    }

    function _testResultHtml() {
      var s = _testScore();
      var tone = s.pct >= 80 ? 'ok' : (s.pct >= 50 ? 'mid' : 'bad');
      return '<div class="test-result ' + tone + '">' +
        '<div class="test-score">' + s.pct + '%</div>' +
        '<div class="test-score-sub"><strong>' + s.correct + '</strong> câu đúng · <strong>' + s.wrong + '</strong> câu sai · ' + s.total + ' câu</div>' +
        '<div class="learn-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + s.pct + '" aria-label="Điểm bài kiểm tra">' +
        '<div class="learn-seg ok" style="width:' + s.pct + '%"></div></div>' +
        '</div>';
    }

    function _testQuestionHtml(q, i, review) {
      var st = _testState;
      var a = st.answers[i];
      var card = q.card;
      var lang = (typeof fcLangForCard === 'function') ? fcLangForCard(card, st.deckId, card.front) : '';
      var speaker = (typeof fcSpeakBtnHtml === 'function') ? fcSpeakBtnHtml(card.front, st.deckId, 'câu hỏi', lang) : '';

      var head = '<div class="test-qhead">' +
        '<span class="test-qnum">Câu ' + (i + 1) + '</span>' +
        '<span class="badge ' + FC_TEST_TYPE_BADGE[q.type] + '">' + FC_TEST_TYPE_LABEL[q.type] + '</span>' +
        (review ? '<span class="test-mark ' + (q.correct ? 'ok' : 'bad') + '">' + (q.correct ? (q.close ? '✅ Gần đúng' : '✅ Đúng') : '❌ Sai') + '</span>' : '') +
        '</div>';

      var phoneticFront = (typeof fcPhoneticBadgeHtml === 'function') ? fcPhoneticBadgeHtml(card.front, st.deckId, card) : '';
      var phoneticBack = (typeof fcPhoneticBadgeHtml === 'function') ? fcPhoneticBadgeHtml(card.back, st.deckId, card) : '';

      var body = '';
      if (q.type === 'mc') {
        body = '<div class="test-prompt">' + card.front + phoneticFront + speaker + '</div>' +
          '<div class="learn-choices test-choices">' + q.choices.map(function (ch, k) {
            var cls = 'learn-choice test-choice' + (a === k ? ' picked' : '');
            if (review) {
              if (ch.id === q.cardId) cls += ' correct';
              else if (a === k) cls += ' chosen-wrong';
              else cls += ' dim';
            }
            return '<button class="' + cls + '"' + (review ? ' disabled' : '') + ' onclick="testSetMC(' + i + ',' + k + ')">' +
              '<span class="learn-choice-key">' + (k + 1) + '</span>' +
              '<span class="learn-choice-body">' + ch.html + '</span></button>';
          }).join('') + '</div>';
      } else if (q.type === 'tf') {
        body = '<div class="test-prompt">' + card.front + phoneticFront + speaker + '</div>' +
          '<div class="test-tf-claim">có nghĩa là: <span class="test-tf-def">' + q.shown + '</span></div>' +
          '<div class="test-tf-btns">' +
          ['true', 'false'].map(function (v) {
            var val = v === 'true';
            var cls = 'btn test-tf-btn' + (a === val ? ' picked' : '');
            if (review) {
              if (val === q.expected) cls += ' correct';
              else if (a === val) cls += ' chosen-wrong';
            }
            return '<button class="' + cls + '" data-val="' + v + '"' + (review ? ' disabled' : '') +
              ' onclick="testSetTF(' + i + ',' + v + ')">' + (val ? '✔ Đúng' : '✘ Sai') + '</button>';
          }).join('') + '</div>';
      } else {
        var val = a != null ? String(a) : '';
        body = '<div class="test-prompt">' + card.front + phoneticFront + speaker + '</div>' +
          (review
            ? '<div class="test-written-review"><div class="test-your">Bạn trả lời: <strong>' + (val ? escHtml(val) : '<em>(bỏ trống)</em>') + '</strong></div></div>'
            : '<input class="form-input test-input" id="testIn' + i + '" autocomplete="off" spellcheck="false" ' +
              'placeholder="Gõ đáp án…" value="' + escAttr(val) + '" oninput="testSetWritten(' + i + ',this.value);_testSyncProgress()">');
      }

      // Khi đã nộp: luôn hiện đáp án đúng để học lại.
      var answer = review && !q.correct
        ? '<div class="test-answer">Đáp án đúng: <span class="test-answer-val">' + card.back + phoneticBack + '</span></div>'
        : '';

      return '<div class="test-q' + (review ? (q.correct ? ' r-ok' : ' r-bad') : '') + '" id="testQ' + i + '">' + head + body + answer + '</div>';
    }
    // Cập nhật nhãn tiến độ khi gõ tự luận (không vẽ lại cả bài).
    function _testSyncProgress() {
      var el = document.getElementById('testProgress');
      if (el && _testState) el.textContent = 'Đã trả lời ' + _testAnswered() + '/' + _testState.questions.length;
    }

    // ============================================================
    // (2) TRÒ CHƠI GHÉP THẺ (MATCHING GAME)
    // ============================================================
    var FC_MATCH_MIN_PAIRS = 6, FC_MATCH_MAX_PAIRS = 8;
    var _matchState = null, _matchTimer = null;
    // {deckId, tiles:[{key,cardId,kind,html,matched,wrong}], first:idx|null,
    //  lock:bool, matched:0, pairs:n, startAt, endMs, done}

    function startMatchGame(deckId) {
      var d = _fcDeck(deckId);
      var cards = _fcUsableCards(d);
      if (cards.length < 2) { showToast('Cần ít nhất 2 thẻ đủ 2 mặt để chơi ghép thẻ.', 'warning'); return; }
      _matchStopTimer();
      var pool = cards.slice(); _fcShuffle(pool);
      // 6–8 cặp → 12–16 ô. Bộ ít thẻ hơn thì lấy hết những gì có.
      var pairs = Math.min(FC_MATCH_MAX_PAIRS, pool.length);
      if (pool.length >= FC_MATCH_MIN_PAIRS) pairs = Math.max(FC_MATCH_MIN_PAIRS, Math.min(FC_MATCH_MAX_PAIRS, pairs));
      var picked = pool.slice(0, pairs);
      var tiles = [];
      picked.forEach(function (c) {
        tiles.push({ key: 't' + c.id, cardId: c.id, kind: 'term', html: c.front, matched: false, wrong: false });
        tiles.push({ key: 'd' + c.id, cardId: c.id, kind: 'def', html: c.back, matched: false, wrong: false });
      });
      _fcShuffle(tiles);

      _matchState = {
        deckId: deckId, tiles: tiles, first: null, lock: false,
        matched: 0, pairs: picked.length, tries: 0,
        startAt: Date.now(), endMs: 0, done: false
      };
      _fcOnlyView('flashcards-match-view');
      _renderMatch();
      _matchStartTimer();
    }

    function _matchStartTimer() {
      _matchStopTimer();
      _matchTimer = setInterval(function () {
        if (!_matchState || _matchState.done) { _matchStopTimer(); return; }
        var el = document.getElementById('matchTimer');
        if (el) el.textContent = _matchFmt(Date.now() - _matchState.startAt);
      }, 100);
    }
    function _matchStopTimer() { if (_matchTimer) { clearInterval(_matchTimer); _matchTimer = null; } }
    function _matchFmt(ms) {
      var s = Math.max(0, ms) / 1000;
      return s.toFixed(1) + 's';
    }
    function _matchBestKey(deckId) { return _fcPk('th_fc_match_best_' + deckId); }
    function _matchBest(deckId) { var v = _fcLsGet(_matchBestKey(deckId), null); return (typeof v === 'number' && v > 0) ? v : null; }

    // Bấm 1 ô: ô thứ nhất → chọn; ô thứ hai → so cặp.
    function matchPick(i) {
      var st = _matchState; if (!st || st.done || st.lock) return;
      var t = st.tiles[i]; if (!t || t.matched) return;
      if (st.first === i) { st.first = null; _renderMatch(); return; }   // bấm lại để bỏ chọn
      if (st.first == null) { st.first = i; _renderMatch(); return; }

      var a = st.tiles[st.first], b = t;
      st.tries++;
      // Ghép đúng = CÙNG thẻ nhưng KHÁC mặt (thuật ngữ ↔ định nghĩa).
      if (a.cardId === b.cardId && a.kind !== b.kind) {
        a.matched = b.matched = true;
        st.first = null; st.matched++;
        if (st.matched >= st.pairs) {
          st.done = true; st.endMs = Date.now() - st.startAt; _matchStopTimer();
          var best = _matchBest(st.deckId);
          st.isRecord = (best == null || st.endMs < best);
          if (st.isRecord) _fcLsSet(_matchBestKey(st.deckId), st.endMs);
          _renderMatch();
          try { if (typeof celebrate === 'function') celebrate(); } catch (e) { }
          showToast('Hoàn thành trong ' + _matchFmt(st.endMs) + (st.isRecord ? ' — kỷ lục mới! 🏆' : ''), 'success');
          return;
        }
        _renderMatch();
      } else {
        // Sai → nháy đỏ rồi ĐẢO LẠI (bỏ chọn cả 2), chặn click trong lúc nháy.
        a.wrong = b.wrong = true; st.lock = true; _renderMatch();
        setTimeout(function () {
          if (!_matchState) return;
          a.wrong = b.wrong = false;
          _matchState.first = null; _matchState.lock = false;
          _renderMatch();
        }, 700);
      }
    }
    function matchRestart() { var id = _matchState ? _matchState.deckId : null; if (id != null) startMatchGame(id); }
    function exitMatchGame() {
      _matchStopTimer();
      var id = _matchState ? _matchState.deckId : null;
      _matchState = null;
      var v = document.getElementById('flashcards-match-view'); if (v) { v.style.display = 'none'; v.innerHTML = ''; }
      if (typeof fcStopSpeak === 'function') fcStopSpeak();
      if (id != null) openDeckDetail(id); else backToDecks();
    }

    function _renderMatch() {
      var st = _matchState; if (!st) return;
      var view = _fcEnsureView('flashcards-match-view');
      var d = _fcDeck(st.deckId);
      var best = _matchBest(st.deckId);

      var html = '<div class="match-container">' +
        '<div class="learn-header">' +
        '<button class="btn btn-ghost" onclick="exitMatchGame()">← Thoát</button>' +
        '<div class="learn-title">🎮 Ghép thẻ<span class="learn-deckname">' + escHtml(d ? d.title : '') + '</span></div>' +
        '<div class="learn-tools"><button class="btn btn-sm btn-ghost" onclick="matchRestart()">↺ Chơi lại</button></div>' +
        '</div>' +
        '<div class="match-bar">' +
        '<span class="match-stat">⏱ <strong id="matchTimer">' + _matchFmt(st.done ? st.endMs : Date.now() - st.startAt) + '</strong></span>' +
        '<span class="match-stat">✅ <strong>' + st.matched + '/' + st.pairs + '</strong> cặp</span>' +
        '<span class="match-stat">🎯 <strong>' + st.tries + '</strong> lượt thử</span>' +
        (best != null ? '<span class="match-stat">🏆 Kỷ lục <strong>' + _matchFmt(best) + '</strong></span>' : '') +
        '</div>';

      if (st.done) {
        html += '<div class="match-done">' +
          '<div class="match-done-ic">🎉</div>' +
          '<div class="match-done-title">Xong! ' + _matchFmt(st.endMs) + '</div>' +
          '<div class="match-done-sub">' + st.pairs + ' cặp · ' + st.tries + ' lượt thử' +
          (st.isRecord ? ' · <strong>Kỷ lục mới! 🏆</strong>' : (best != null ? ' · Kỷ lục: ' + _matchFmt(best) : '')) + '</div>' +
          '<div class="match-done-btns">' +
          '<button class="btn btn-primary" onclick="matchRestart()">↺ Chơi lại</button>' +
          '<button class="btn btn-ghost" onclick="exitMatchGame()">Về bộ thẻ</button>' +
          '</div></div>';
      } else {
        html += '<div class="match-hint">Bấm 1 <strong>thuật ngữ</strong> rồi bấm <strong>định nghĩa</strong> tương ứng để ghép cặp.</div>';
      }

      html += '<div class="match-grid">' + st.tiles.map(function (t, i) {
        var cls = 'match-tile' + (t.matched ? ' matched' : '') + (t.wrong ? ' wrong' : '') +
          (st.first === i ? ' picked' : '') + (t.kind === 'term' ? ' is-term' : ' is-def');
        return '<button class="' + cls + '"' + (t.matched || st.done ? ' disabled' : '') +
          ' onclick="matchPick(' + i + ')" aria-label="' + escAttr(t.kind === 'term' ? 'Thuật ngữ' : 'Định nghĩa') + '">' +
          '<span class="match-tile-body">' + t.html + '</span></button>';
      }).join('') + '</div></div>';

      view.innerHTML = html;
      typesetMath(view);           // công thức Toán trong ô ghép
    }
