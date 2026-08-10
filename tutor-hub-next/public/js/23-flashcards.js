    // ============================================================
    // FLASHCARDS — DECK LIST
    // ============================================================
    function renderDecks() {
      var q = document.getElementById('deckSearch').value.toLowerCase();
      var subj = document.getElementById('deckSubjectFilter').value;
      var list = flashcardDecks.filter(function (d) {
        return (!q || d.title.toLowerCase().includes(q)) && (!subj || d.subject === subj);
      });
      var grid = document.getElementById('deckGrid');
      if (_dbError && _dbError.flashcards && !flashcardDecks.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;">' + errorBlock(_dbError.flashcards, 'retryLoad()') + '</div>';
        return;
      }
      if (_dbLoading && !flashcardDecks.length) { grid.innerHTML = skelCards(6); return; }
      if (!list.length) {
        var isTA = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
        var body = flashcardDecks.length === 0
          ? emptyBlock('flashcards', 'Chưa có bộ thẻ nào',
              'Tạo bộ thẻ để học sinh ôn tập từ vựng, khái niệm.',
              isTA ? '<button class="btn btn-primary" onclick="openDeckModal()">＋ Tạo bộ thẻ</button>' : '')
          : emptyBlock('flashcards', 'Không tìm thấy bộ thẻ phù hợp', 'Thử đổi từ khoá hoặc bộ lọc.', '');
        grid.innerHTML = '<div style="grid-column:1/-1;">' + body + '</div>';
        return;
      }
      grid.innerHTML = list.map(function (d) {
        var difficult = d.cards.filter(function (c) { return c.difficulty === 'hard'; }).length;
        var editBtns = editMode ? '<div class="deck-actions"><button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();openDeckModal(' + d.id + ')">✏️</button><button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteDeck(' + d.id + ')">🗑</button></div>' : '';
        return '<div class="deck-card" onclick="openDeckDetail(' + d.id + ')">' + editBtns +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<span class="badge ' + (d.subject === 'Math' ? 'badge-purple' : 'badge-success') + '">' + escHtml(d.subject) + '</span>' +
          '<span class="badge badge-info">' + escHtml(d.class) + '</span>' +
          '</div>' +
          '<div class="deck-title">' + escHtml(d.title) + '</div>' +
          '<div class="deck-meta">Last updated: ' + escHtml(d.lastUpdated) + '</div>' +
          '<div class="deck-stats">' +
          '<div class="deck-stat"><strong>' + d.cards.length + '</strong>Cards</div>' +
          '<div class="deck-stat"><strong>' + difficult + '</strong>Difficult</div>' +
          '</div>' +
          '<div class="deck-tags">' + d.tags.map(function (t) { return '<span class="deck-tag">' + escHtml(t) + '</span>'; }).join('') + '</div>' +
          '</div>';
      }).join('');
    }

    // ============================================================
    // FLASHCARDS — DECK DETAIL
    // ============================================================
    function openDeckDetail(deckId) {
      currentDeckView = deckId;
      var d = flashcardDecks.find(function (x) { return x.id === deckId; });
      if (!d) return;
      document.getElementById('flashcards-list-view').style.display = 'none';
      document.getElementById('flashcards-study-view').style.display = 'none';
      _hideLearnView();
      var view = document.getElementById('flashcards-deck-view');
      view.style.display = '';

      var difficult = d.cards.filter(function (c) { return c.difficulty === 'hard'; }).length;
      var editBtns = editMode ? '<button class="btn btn-primary btn-sm" onclick="openCardModal(' + d.id + ')">+ Thêm thẻ</button> <button class="btn btn-ghost btn-sm" onclick="openBulkImportModal(' + d.id + ')">📋 Nhập hàng loạt</button>' : '';

      var html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">' +
        '<button class="btn btn-ghost" onclick="backToDecks()">← Quay lại</button>' +
        '<div style="flex:1;min-width:200px;"><h2 class="deck-detail-title">' + escHtml(d.title) + '</h2></div>' +
        '<button class="btn btn-primary" onclick="startStudy(' + d.id + ')">🎯 Học ngay</button>' +
        '<button class="btn btn-primary" onclick="startLearn(' + d.id + ')" title="Ôn tập lặp lại: trắc nghiệm + tự luận, từ sai lặp lại tới khi thuộc">🧠 Chế độ Học</button>' +
        '<button class="btn btn-ghost" onclick="startTest(' + d.id + ')" title="Bài kiểm tra trộn 3 dạng câu hỏi, nộp bài và tính điểm %">📝 Bài kiểm tra</button>' +
        '<button class="btn btn-ghost" onclick="startMatchGame(' + d.id + ')" title="Trò chơi ghép thuật ngữ với định nghĩa, tính thời gian">🎮 Trò chơi</button>' +
        editBtns +
        '</div>';

      // Thông tin bộ thẻ: MỘT dải gọn thay cho 4 thẻ KPI cỡ lớn.
      // 4 thẻ cũ vừa chiếm gần hết màn hình đầu, vừa LẶP LẠI y nguyên dòng
      // phụ đề ngay trên nó (môn · lớp · N thẻ) — giờ chỉ còn một chỗ nói.
      html += '<div class="deck-detail-meta">' +
        '<span class="deck-detail-meta-item"><strong>' + d.cards.length + '</strong> thẻ</span>' +
        (difficult ? '<span class="deck-detail-meta-item"><strong class="col-amber">' + difficult + '</strong> thẻ khó</span>' : '') +
        '<span class="deck-detail-meta-item">' + escHtml(d.subject) + '</span>' +
        (d.class ? '<span class="deck-detail-meta-item">' + escHtml(d.class) + '</span>' : '') +
        '</div>';

      // Danh sách thẻ. Số lượng đã có ở dải thông tin trên nên bỏ badge "N total".
      html += '<div class="card"><div class="card-header"><div class="card-title">Tất cả thẻ</div></div>';
      if (d.cards.length) {
        html += d.cards.map(function (c, idx) {
          var diffBadge = { easy: 'badge-success', medium: 'badge-warning', hard: 'badge-danger' }[c.difficulty] || 'badge-gray';
          // Nhãn tiếng Việt — trước đây hiện thẳng giá trị máy ("medium") giữa
          // một giao diện tiếng Việt.
          var diffLabel = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' }[c.difficulty] || c.difficulty;
          var editCardBtns = editMode ? '<div class="card-list-actions">' +
            (idx > 0 ? '<button class="btn btn-sm btn-ghost" title="Chuyển lên" onclick="moveCard(' + d.id + ',' + c.id + ',-1)">↑</button>' : '') +
            (idx < d.cards.length - 1 ? '<button class="btn btn-sm btn-ghost" title="Chuyển xuống" onclick="moveCard(' + d.id + ',' + c.id + ',1)">↓</button>' : '') +
            '<button class="btn btn-sm btn-ghost" title="Sửa thẻ" onclick="openCardModal(' + d.id + ',' + c.id + ')">✏️</button>' +
            '<button class="btn btn-sm btn-ghost" title="Nhân đôi thẻ" onclick="duplicateCard(' + d.id + ',' + c.id + ')">📋</button>' +
            '<button class="btn btn-sm btn-danger" title="Xoá thẻ" onclick="deleteCard(' + d.id + ',' + c.id + ')">🗑</button></div>' : '';
          return '<div class="card-list-item">' +
            '<span class="card-num">' + (idx + 1) + '</span>' +
            '<div class="card-list-term">' + c.front + (typeof fcPhoneticBadgeHtml === 'function' ? fcPhoneticBadgeHtml(c.front, d.id, c) : '') + '</div>' +
            '<div class="card-list-def">' + c.back + (typeof fcPhoneticBadgeHtml === 'function' ? fcPhoneticBadgeHtml(c.back, d.id, c) : '') + '</div>' +
            '<span class="badge ' + diffBadge + ' card-list-diff">' + escHtml(diffLabel) + '</span>' +
            editCardBtns +
            '</div>';
        }).join('');
      } else {
        html += emptyBlock('flashcards', 'Bộ thẻ này chưa có thẻ nào',
          'Thêm thẻ hoặc dùng "Nhập hàng loạt" để tạo nhanh nhiều thẻ.',
          (editMode ? '<button class="btn btn-primary" onclick="openCardModal(' + d.id + ')">＋ Thêm thẻ đầu tiên</button>' : ''));
      }
      html += '</div>';
      view.innerHTML = html;
      typesetMath(view);
    }

    // Ẩn các màn phụ của Flashcard khi chuyển view khác: "Chế độ Học"
    // (27-flashcard-learn.js) + "Bài kiểm tra"/"Trò chơi" (28-flashcard-test-game.js).
    // Quan trọng: fcHideTestGame() còn DỪNG đồng hồ trò chơi (tránh interval chạy nền).
    function _hideLearnView() {
      var lv = document.getElementById('flashcards-learn-view');
      if (lv) { lv.style.display = 'none'; lv.innerHTML = ''; }
      if (typeof fcHideTestGame === 'function') fcHideTestGame();
      if (typeof fcStopSpeak === 'function') fcStopSpeak();
    }

    function backToDecks() {
      currentDeckView = null;
      document.getElementById('flashcards-list-view').style.display = '';
      document.getElementById('flashcards-deck-view').style.display = 'none';
      document.getElementById('flashcards-study-view').style.display = 'none';
      _hideLearnView();
      renderDecks();
    }

    // ============================================================
    // FLASHCARDS — STUDY MODE
    // ============================================================
    function startStudy(deckId) {
      var d = flashcardDecks.find(function (x) { return x.id === deckId; });
      if (!d || !d.cards.length) { showToast('No cards to study.', 'warning'); return; }
      studyState = { deckId: deckId, index: 0, flipped: false, shuffled: false, cards: d.cards.slice() };
      document.getElementById('flashcards-list-view').style.display = 'none';
      document.getElementById('flashcards-deck-view').style.display = 'none';
      _hideLearnView();
      document.getElementById('flashcards-study-view').style.display = '';
      renderStudyCard();
      if (typeof fcOnFlip === 'function') fcOnFlip(); // đọc mặt trước thẻ đầu tiên
    }

    function renderStudyCard() {
      if (!studyState) return;
      var d = flashcardDecks.find(function (x) { return x.id === studyState.deckId; });
      var cards = studyState.cards;
      var card = cards[studyState.index];
      var view = document.getElementById('flashcards-study-view');

      var html = '<div class="study-container">' +
        '<div class="study-header">' +
        '<button class="btn btn-ghost" onclick="exitStudy()">← Exit Study</button>' +
        '<div class="study-progress">Card <strong>' + (studyState.index + 1) + '</strong> of <strong>' + cards.length + '</strong></div>' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
        (typeof fcStudyToolsHtml === 'function' ? fcStudyToolsHtml(studyState.deckId) : '') +
        '<button class="btn btn-sm btn-ghost" onclick="shuffleCards()" title="Shuffle">🔀</button>' +
        '<button class="btn btn-sm ' + (card.difficulty === 'hard' ? 'btn-danger' : 'btn-ghost') + '" onclick="toggleDifficult()" title="Mark Difficult">⭐</button>' +
        '</div>' +
        '</div>' +
        '<div style="background:var(--bg);border-radius:10px;height:6px;margin-bottom:20px;overflow:hidden;">' +
        '<div style="height:100%;background:var(--accent);border-radius:10px;width:' + ((studyState.index + 1) / cards.length * 100) + '%;transition:width 0.3s;"></div>' +
        '</div>' +
        '<div class="flashcard-wrapper" onclick="flipStudyCard()">' +
        '<div class="flashcard' + (studyState.flipped ? ' flipped' : '') + '" id="studyFlashcard">' +
        '<div class="flashcard-face">' +
        '<div class="flashcard-label">Front' + (typeof fcSpeakBtnHtml === 'function' ? fcSpeakBtnHtml(card.front, studyState.deckId, 'mặt trước', fcLangForCard(card, studyState.deckId, card.front)) : '') + '</div>' +
        '<div class="flashcard-text">' + card.front + (typeof fcPhoneticBadgeHtml === 'function' ? fcPhoneticBadgeHtml(card.front, studyState.deckId, card) : '') + '</div>' +
        (card.hint ? '<div class="flashcard-hint">💡 ' + escHtml(card.hint) + '</div>' : '') +
        '<div style="margin-top:16px;font-size:11px;color:var(--text-muted);">Click to flip</div>' +
        '</div>' +
        '<div class="flashcard-face flashcard-back">' +
        '<div class="flashcard-label">Back' + (typeof fcSpeakBtnHtml === 'function' ? fcSpeakBtnHtml(card.back, studyState.deckId, 'mặt sau') : '') + '</div>' +
        '<div class="flashcard-text">' + card.back + (typeof fcPhoneticBadgeHtml === 'function' ? fcPhoneticBadgeHtml(card.back, studyState.deckId, card) : '') + '</div>' +
        (card.example ? '<div class="flashcard-example">📝 ' + card.example + '</div>' : '') +
        '<div style="margin-top:12px;"><span class="badge ' + ({ easy: 'badge-success', medium: 'badge-warning', hard: 'badge-danger' }[card.difficulty] || 'badge-gray') + '">' + card.difficulty + '</span></div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="study-controls">' +
        '<button class="study-btn" onclick="prevStudyCard()" title="Previous"' + (studyState.index === 0 ? ' disabled style="opacity:0.3"' : '') + '>◀</button>' +
        '<button class="study-btn" onclick="flipStudyCard()" title="Flip">🔄</button>' +
        '<button class="study-btn" onclick="nextStudyCard()" title="Next"' + (studyState.index >= cards.length - 1 ? ' disabled style="opacity:0.3"' : '') + '>▶</button>' +
        '</div>' +
        '</div>';
      view.innerHTML = html;
      typesetMath(view);
    }

    function flipStudyCard() {
      if (!studyState) return;
      studyState.flipped = !studyState.flipped;
      var fc = document.getElementById('studyFlashcard');
      if (fc) fc.classList.toggle('flipped', studyState.flipped);
      // Lật sang mặt mới → tự phát âm mặt đó (27-flashcard-learn.js).
      if (typeof fcOnFlip === 'function') fcOnFlip();
    }

    function nextStudyCard() {
      if (!studyState || studyState.index >= studyState.cards.length - 1) return;
      studyState.index++;
      studyState.flipped = false;
      renderStudyCard();
      if (typeof fcOnFlip === 'function') fcOnFlip();
    }

    function prevStudyCard() {
      if (!studyState || studyState.index <= 0) return;
      studyState.index--;
      studyState.flipped = false;
      renderStudyCard();
      if (typeof fcOnFlip === 'function') fcOnFlip();
    }

    function shuffleCards() {
      if (!studyState) return;
      for (var i = studyState.cards.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = studyState.cards[i];
        studyState.cards[i] = studyState.cards[j];
        studyState.cards[j] = temp;
      }
      studyState.index = 0;
      studyState.flipped = false;
      showToast('Cards shuffled!', 'info');
      renderStudyCard();
    }

    function toggleDifficult() {
      if (!studyState) return;
      var card = studyState.cards[studyState.index];
      var d = flashcardDecks.find(function (x) { return x.id === studyState.deckId; });
      var realCard = d.cards.find(function (c) { return c.id === card.id; });
      if (realCard) {
        realCard.difficulty = realCard.difficulty === 'hard' ? 'medium' : 'hard';
        card.difficulty = realCard.difficulty;
      }
      showToast(card.difficulty === 'hard' ? 'Marked as difficult' : 'Unmarked difficult', card.difficulty === 'hard' ? 'warning' : 'info');
      renderStudyCard();
    }

    function exitStudy() {
      if (typeof fcStopSpeak === 'function') fcStopSpeak();
      studyState = null;
      document.getElementById('flashcards-study-view').style.display = 'none';
      if (currentDeckView) {
        openDeckDetail(currentDeckView);
      } else {
        backToDecks();
      }
    }

    // ============================================================
    // FLASHCARDS — DECK MODAL (Create/Edit)
    // ============================================================
    function openDeckModal(id) {
      var d = id ? flashcardDecks.find(function (x) { return x.id === id; }) : null;
      var title = d ? 'Sửa bộ thẻ' : 'Tạo bộ thẻ mới';
      var html = '<div class="modal-header"><h3>' + title + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-group"><label>Tên bộ thẻ</label><input class="form-input" id="mDeckTitle" value="' + (d ? escHtml(d.title) : '') + '"></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Môn học</label><select class="form-select" id="mDeckSubject">' + _subjectOpts(d && d.subject) + '</select></div>' +
        '<div class="form-group"><label>Lớp</label><select class="form-select" id="mDeckClass">' +
        classes.map(function (c) { return '<option value="' + c.name + '"' + (d && d.class === c.name ? ' selected' : '') + '>' + c.name + '</option>'; }).join('') +
        '</select></div>' +
        '</div>' +
        '<div class="form-group"><label>Nhãn (cách nhau bởi dấu phẩy)</label><input class="form-input" id="mDeckTags" value="' + (d ? d.tags.join(', ') : '') + '"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="saveDeck(' + (id || 'null') + ')">Lưu</button>' +
        '</div>';
      openModal(html);
    }

    function saveDeck(id) {
      var title = document.getElementById('mDeckTitle').value.trim();
      if (!title) { showToast('Vui lòng nhập tên bộ thẻ.', 'error'); return; }
      var tags = document.getElementById('mDeckTags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
      var today = new Date().toISOString().split('T')[0];
      var subject = document.getElementById('mDeckSubject').value;
      var cls = document.getElementById('mDeckClass').value;
      if (id) {
        var d = flashcardDecks.find(function (x) { return x.id === id; });
        if (d) {
          d.title = title; d.subject = subject; d.class = cls; d.tags = tags; d.lastUpdated = today;
          if (_db && _dbUserId && d.dbId) {
            _db.from('flashcard_decks').update({ name: title, subject: subject }).eq('id', d.dbId)
              .then(function (r) { if (r.error) showToast('Lỗi lưu bộ thẻ: ' + r.error.message, 'error'); });
          }
        }
        showToast('Đã cập nhật bộ thẻ.', 'success');
        closeModal(); renderDecks();
      } else if (_db && _dbUserId) {
        _db.from('flashcard_decks').insert({ owner_id: _dbUserId, name: title, subject: subject }).select()
          .then(function (r) {
            if (r.error) { showToast('Lỗi tạo bộ thẻ: ' + r.error.message, 'error'); return; }
            flashcardDecks.push({
              id: nextDeckId++, dbId: (r.data && r.data[0]) ? r.data[0].id : null,
              title: title, subject: subject, class: cls, tags: tags, lastUpdated: today, cards: []
            });
            showToast('Đã tạo bộ thẻ mới.', 'success');
            closeModal(); renderDecks();
          });
      } else {
        flashcardDecks.push({ id: nextDeckId++, title: title, subject: subject, class: cls, tags: tags, lastUpdated: today, cards: [] });
        showToast('Đã tạo bộ thẻ mới.', 'success');
        closeModal(); renderDecks();
      }
    }

    function deleteDeck(id) {
      uiConfirm('Xóa bộ thẻ này và toàn bộ thẻ con?', function () {
        var d = flashcardDecks.find(function (x) { return x.id === id; });
        flashcardDecks = flashcardDecks.filter(function (x) { return x.id !== id; });
        showToast('Đã xóa bộ thẻ.', 'info');
        renderDecks();
        if (_db && d && d.dbId) {
          _db.from('flashcard_decks').delete().eq('id', d.dbId)
            .then(function (r) { if (r.error) showToast('Lỗi xóa bộ thẻ: ' + r.error.message, 'error'); });
        }
      });
    }

    // ============================================================
    // FLASHCARDS — CARD MODAL (Create/Edit)
    // ============================================================
    function openCardModal(deckId, cardId) {
      var d = flashcardDecks.find(function (x) { return x.id === deckId; });
      if (!d) return;
      var c = cardId ? d.cards.find(function (x) { return x.id === cardId; }) : null;
      var title = c ? 'Sửa thẻ' : 'Thêm thẻ';
      var hasMath = true; // always show preview for any subject

      var html = '<div class="modal-header"><h3>' + title + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-group"><label>Mặt trước</label><textarea class="form-textarea" id="mCardFront" oninput="updateCardPreview()">' + (c ? escHtml(c.front) : '') + '</textarea>' +
        '<div class="hint">Hỗ trợ LaTeX: \\(x^2+1\\) hoặc \\[\\frac{a}{b}\\]</div>' +
        _fcMathBar('mCardFront') + '</div>' +
        // Ngôn ngữ phát âm của MẶT TRƯỚC — mặt trước là mặt được tự động đọc.
        (typeof fcLangOptionsHtml === 'function' ?
          '<div class="form-group"><label>🔊 Ngôn ngữ phát âm (mặt trước)</label>' +
          '<select class="form-select" id="mCardLang">' + fcLangOptionsHtml(c ? fcCardLang(c, deckId) : '') + '</select>' +
          '<div class="hint">Dùng khi tự động đọc mặt trước. Để "Tự động nhận diện" nếu muốn app tự đoán theo nội dung.</div></div>' : '') +
        '<div class="form-group"><label>Mặt sau</label><textarea class="form-textarea" id="mCardBack" oninput="updateCardPreview()">' + (c ? escHtml(c.back) : '') + '</textarea>' +
        _fcMathBar('mCardBack') + '</div>' +
        '<input type="file" id="fcImgInput" accept="image/*" style="display:none" onchange="fcImgChosen(this)">' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Gợi ý (tuỳ chọn)</label><input class="form-input" id="mCardHint" value="' + (c ? escHtml(c.hint || '') : '') + '"></div>' +
        '<div class="form-group"><label>Độ khó</label><select class="form-select" id="mCardDiff">' +
        '<option value="easy"' + (c && c.difficulty === 'easy' ? ' selected' : '') + '>Dễ</option>' +
        '<option value="medium"' + (c && c.difficulty === 'medium' ? ' selected' : '') + 'selected>Trung bình</option>' +
        '<option value="hard"' + (c && c.difficulty === 'hard' ? ' selected' : '') + '>Khó</option></select></div>' +
        '</div>' +
        '<div class="form-group"><label>Ví dụ (tuỳ chọn)</label><input class="form-input" id="mCardExample" value="' + (c ? escHtml(c.example || '') : '') + '"></div>' +
        '<div id="cardMathPreview"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="closeModal()">Hủy</button>' +
        '<button class="btn btn-primary" onclick="saveCard(' + deckId + ',' + (cardId || 'null') + ')">Lưu</button>' +
        '</div>';
      openModal(html);
      setTimeout(function () { updateCardPreview(); }, 100);
    }

    function updateCardPreview() {
      var front = document.getElementById('mCardFront');
      var back = document.getElementById('mCardBack');
      var preview = document.getElementById('cardMathPreview');
      if (!front || !back || !preview) return;
      var content = '';
      if (front.value.trim()) content += '<div class="math-preview-label">Front Preview</div><div class="math-preview">' + front.value + (typeof fcPhoneticBadgeHtml === 'function' ? fcPhoneticBadgeHtml(front.value) : '') + '</div>';
      if (back.value.trim()) content += '<div class="math-preview-label" style="margin-top:8px;">Back Preview</div><div class="math-preview">' + back.value + (typeof fcPhoneticBadgeHtml === 'function' ? fcPhoneticBadgeHtml(back.value) : '') + '</div>';
      preview.innerHTML = content;
      typesetMath(preview);
    }

    function saveCard(deckId, cardId) {
      var front = document.getElementById('mCardFront').value.trim();
      var back = document.getElementById('mCardBack').value.trim();
      if (!front || !back) { showToast('Mặt trước và mặt sau là bắt buộc.', 'error'); return; }
      var d = flashcardDecks.find(function (x) { return x.id === deckId; });
      if (!d) return;
      var data = {
        front: front, back: back,
        hint: document.getElementById('mCardHint').value.trim(),
        example: document.getElementById('mCardExample').value.trim(),
        difficulty: document.getElementById('mCardDiff').value,
      };
      // Ngôn ngữ phát âm mặt trước ('' = tự động nhận diện).
      var langEl = document.getElementById('mCardLang');
      var frontLang = langEl && langEl.value && langEl.value !== 'auto' ? langEl.value : '';
      // Chỉ gửi cột front_lang khi ĐÃ chạy migration 028 (tránh 400 "column not found").
      var langColOk = typeof fcLangColReady === 'function' && fcLangColReady();
      var withLang = function (row) { if (langColOk) row.front_lang = frontLang || null; return row; };
      var today = new Date().toISOString().split('T')[0];
      if (cardId) {
        var c = d.cards.find(function (x) { return x.id === cardId; });
        if (c) Object.assign(c, data);
        if (c && typeof fcSetCardLang === 'function') fcSetCardLang(c, deckId, frontLang);
        if (_db && _dbUserId && c && c.dbId) {
          _db.from('flashcards').update(withLang({ front: front, back: back, difficulty: data.difficulty })).eq('id', c.dbId)
            .then(function (r) { if (r.error) showToast('Lỗi lưu thẻ: ' + r.error.message, 'error'); });
        }
        d.lastUpdated = today;
        showToast('Đã cập nhật thẻ.', 'success');
        closeModal(); openDeckDetail(deckId);
      } else if (_db && _dbUserId && d.dbId) {
        _db.from('flashcards').insert(withLang({ deck_id: d.dbId, owner_id: _dbUserId, front: front, back: back, difficulty: data.difficulty })).select()
          .then(function (r) {
            if (r.error) { showToast('Lỗi thêm thẻ: ' + r.error.message, 'error'); return; }
            data.id = nextCardId++;
            data.dbId = (r.data && r.data[0]) ? r.data[0].id : null;
            d.cards.push(data);
            // Gán sau khi có dbId để khoá localStorage bền qua reload.
            if (typeof fcSetCardLang === 'function') fcSetCardLang(data, deckId, frontLang);
            d.lastUpdated = today;
            showToast('Đã thêm thẻ mới.', 'success');
            closeModal(); openDeckDetail(deckId);
          });
      } else {
        data.id = nextCardId++;
        d.cards.push(data);
        if (typeof fcSetCardLang === 'function') fcSetCardLang(data, deckId, frontLang);
        d.lastUpdated = today;
        showToast('Đã thêm thẻ mới.', 'success');
        closeModal(); openDeckDetail(deckId);
      }
    }

    function deleteCard(deckId, cardId) {
      uiConfirm('Xóa thẻ này?', function () {
        var d = flashcardDecks.find(function (x) { return x.id === deckId; });
        var c = d ? d.cards.find(function (x) { return x.id === cardId; }) : null;
        if (d) d.cards = d.cards.filter(function (x) { return x.id !== cardId; });
        showToast('Đã xóa thẻ.', 'error');
        openDeckDetail(deckId);
        if (_db && c && c.dbId) {
          _db.from('flashcards').delete().eq('id', c.dbId)
            .then(function (r) { if (r.error) showToast('Lỗi xóa thẻ: ' + r.error.message, 'error'); });
        }
      });
    }

    function duplicateCard(deckId, cardId) {
      var d = flashcardDecks.find(function (x) { return x.id === deckId; });
      if (!d) return;
      var c = d.cards.find(function (x) { return x.id === cardId; });
      if (!c) return;
      var copy = Object.assign({}, c, { id: nextCardId++ });
      var idx = d.cards.indexOf(c);
      d.cards.splice(idx + 1, 0, copy);
      showToast('Card duplicated.', 'success');
      openDeckDetail(deckId);
    }

    function moveCard(deckId, cardId, dir) {
      var d = flashcardDecks.find(function (x) { return x.id === deckId; });
      if (!d) return;
      var idx = d.cards.findIndex(function (c) { return c.id === cardId; });
      if (idx < 0) return;
      var newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= d.cards.length) return;
      var temp = d.cards[idx];
      d.cards[idx] = d.cards[newIdx];
      d.cards[newIdx] = temp;
      openDeckDetail(deckId);
    }

    // ============================================================
    // FLASHCARDS — BULK IMPORT
    // ============================================================
    function openBulkImportModal(deckId) {
      var html = '<div class="modal-header"><h3>' + t('bulk.title') + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-group"><label>' + t('bulk.label') + '</label>' +
        '<textarea class="form-textarea bulk-import-area" id="mBulkText" rows="10" placeholder="' + t('bulk.placeholder') + '"></textarea>' +
        '<div class="hint">' + t('bulk.hint') + '</div>' +
        '</div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="closeModal()">' + t('btn.cancel') + '</button>' +
        '<button class="btn btn-primary" onclick="bulkImport(' + deckId + ')">' + t('bulk.btn') + '</button>' +
        '</div>';
      openModal(html);
    }

    function _parseBulkLine(line) {
      // Support: Front | Back  or  Front - Back  (legacy :: also accepted silently)
      var sep = line.indexOf(' | ') !== -1 ? ' | ' :
        line.indexOf('|') !== -1 ? '|' :
          line.indexOf(' - ') !== -1 ? ' - ' :
            line.indexOf('::') !== -1 ? '::' : null;
      if (!sep) return null;
      var idx = line.indexOf(sep);
      return { front: line.slice(0, idx).trim(), back: line.slice(idx + sep.length).trim() };
    }

    function bulkImport(deckId) {
      var text = document.getElementById('mBulkText').value.trim();
      if (!text) { showToast('Chưa có nội dung để nhập.', 'error'); return; }
      var d = flashcardDecks.find(function (x) { return x.id === deckId; });
      if (!d) return;
      var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      var parsed = [];
      lines.forEach(function (line) {
        var p = _parseBulkLine(line);
        if (p && p.front && p.back) {
          var f = p.front;
          // Tự động thêm IPA vào sau từ tiếng Anh khi nhập hàng loạt
          if (typeof fcDetectLang === 'function' && typeof fcGetPhonetic === 'function') {
            if (fcDetectLang(f) === 'en-US') {
              var phon = fcGetPhonetic(f, 'en-US');
              if (phon && phon.type === 'ipa') {
                // Kiểm tra xem từ đã có IPA chưa để tránh thêm trùng lặp
                if (f.indexOf('/' + phon.text + '/') === -1) {
                  f = f + ' /' + phon.text + '/';
                }
              }
            }
          }
          parsed.push({ front: f, back: p.back });
        }
      });
      if (!parsed.length) {
        showToast('Không nhận diện được thẻ nào. Dùng định dạng: Mặt trước | Mặt sau', 'error');
        return;
      }

      // Thêm thẻ vào bộ nhớ + (nếu có DB) gán dbId trả về để lần sau sửa/xoá đúng.
      function _finish(dbRows) {
        parsed.forEach(function (c, i) {
          d.cards.push({
            id: nextCardId++, dbId: (dbRows && dbRows[i]) ? dbRows[i].id : null,
            front: c.front, back: c.back, hint: '', example: '', difficulty: 'medium'
          });
        });
        d.lastUpdated = new Date().toISOString().split('T')[0];
        showToast('Đã nhập ' + parsed.length + ' thẻ.', 'success');
        closeModal();
        openDeckDetail(deckId);
      }

      // Lưu THẬT: chèn vào bảng flashcards với deck_id = UUID của bộ thẻ (giống saveCard).
      // KHÔNG dùng persistDeck cũ (upsert id số vào cột uuid → lỗi 400 "invalid uuid").
      if (_db && _dbUserId && d.dbId) {
        var rows = parsed.map(function (c) {
          return { deck_id: d.dbId, owner_id: _dbUserId, front: c.front, back: c.back, difficulty: 'medium' };
        });
        showBusy('Đang lưu ' + parsed.length + ' thẻ…');
        _db.from('flashcards').insert(rows).select().then(function (r) {
          hideBusy();
          if (r.error) { showToast('Lỗi lưu thẻ: ' + r.error.message, 'error'); return; }
          _finish(r.data || []);
        }).catch(function () { hideBusy(); showToast('Lỗi mạng khi lưu thẻ. Thử lại.', 'error'); });
      } else if (_db && _dbUserId && !d.dbId) {
        showToast('Bộ thẻ chưa đồng bộ với máy chủ. Tải lại trang rồi thử lại.', 'error');
      } else {
        _finish(null);
      }
    }

    // ============================================================
    // FLASHCARDS — NHẬN DIỆN TOÁN HỌC (ảnh công thức → LaTeX + chèn hình)
    // ------------------------------------------------------------
    // 2 chế độ trên mỗi ô (Mặt trước / Mặt sau):
    //  • 'ocr'   : ảnh công thức → LaTeX (qua API route same-origin /api/math-ocr;
    //              cần MATHPIX_APP_ID/KEY ở server — chưa cấu hình thì báo rõ + chèn ảnh).
    //  • 'attach': chèn ảnh (hình học, sơ đồ) — nén phía client rồi upload Supabase
    //              Storage (bucket 'materials'); lỗi/không có DB thì nhúng data URL.
    // Ô Mặt trước/Mặt sau vốn render RAW HTML nên chèn <img>/LaTeX là hiển thị được.
    // ============================================================
    var _fcImgTarget = null, _fcImgMode = null;
    function _fcMathBar(targetId) {
      return '<div class="fc-mathbar">' +
        '<button type="button" class="btn btn-sm btn-ghost" title="Chụp/chọn ảnh công thức → tự chuyển thành LaTeX" onclick="fcPickImage(' + qid(targetId) + ',\'ocr\')">🧮 Nhận diện công thức</button>' +
        '<button type="button" class="btn btn-sm btn-ghost" title="Chèn ảnh (hình học, sơ đồ…) vào thẻ" onclick="fcPickImage(' + qid(targetId) + ',\'attach\')">🖼️ Chèn ảnh</button>' +
        '</div>';
    }
    function fcPickImage(targetId, mode) {
      _fcImgTarget = targetId; _fcImgMode = mode;
      var inp = document.getElementById('fcImgInput');
      if (inp) { inp.value = ''; inp.click(); }
    }
    function fcImgChosen(input) {
      var file = input && input.files && input.files[0]; if (!file) return;
      if (!/^image\//.test(file.type)) { showToast('Vui lòng chọn tệp ảnh.', 'error'); return; }
      if (_fcImgMode === 'ocr') _fcOcrImage(file); else _fcAttachImage(file);
    }
    // Nén ảnh phía client (canvas) → trả về {dataUrl, blob} JPEG. Nền trắng cho ảnh trong suốt.
    function _fcCompressImage(file, maxDim, cb) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var w = img.width || 1, h = img.height || 1;
          var scale = Math.min(1, maxDim / Math.max(w, h));
          var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch;
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch);
          ctx.drawImage(img, 0, 0, cw, ch);
          var dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          if (canvas.toBlob) canvas.toBlob(function (blob) { cb(dataUrl, blob); }, 'image/jpeg', 0.82);
          else cb(dataUrl, null);
        };
        img.onerror = function () { cb(null, null); };
        img.src = e.target.result;
      };
      reader.onerror = function () { cb(null, null); };
      reader.readAsDataURL(file);
    }
    function _fcInsertAtCursor(targetId, text) {
      var ta = document.getElementById(targetId); if (!ta) return;
      var start = ta.selectionStart != null ? ta.selectionStart : ta.value.length;
      var end = ta.selectionEnd != null ? ta.selectionEnd : ta.value.length;
      ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
      var pos = start + text.length; try { ta.selectionStart = ta.selectionEnd = pos; } catch (e) { }
      ta.focus(); updateCardPreview();
    }
    function _fcInsertImg(targetId, src) { _fcInsertAtCursor(targetId, '<img class="fc-img" src="' + src + '" alt="Hình">'); }
    function _fcAttachImage(file) {
      var target = _fcImgTarget || 'mCardFront';
      showBusy('Đang xử lý ảnh…');
      _fcCompressImage(file, 1000, function (dataUrl, blob) {
        if (!dataUrl) { hideBusy(); showToast('Không đọc được ảnh.', 'error'); return; }
        if (_db && _dbUserId && blob) {
          var path = 'flashcards/' + _dbUserId + '/' + Date.now() + '-' + Math.floor(Math.random() * 1e6) + '.jpg';
          _db.storage.from('materials').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
            .then(function (r) {
              hideBusy();
              if (r.error) { _fcInsertImg(target, dataUrl); showToast('Ảnh đã chèn (cục bộ) — lỗi tải lên: ' + r.error.message, 'warning'); return; }
              var pub = _db.storage.from('materials').getPublicUrl(path).data.publicUrl;
              _fcInsertImg(target, pub); showToast('Đã chèn ảnh.', 'success');
            })
            .catch(function () { hideBusy(); _fcInsertImg(target, dataUrl); showToast('Ảnh đã chèn (cục bộ).', 'info'); });
        } else {
          hideBusy(); _fcInsertImg(target, dataUrl); showToast('Đã chèn ảnh.', 'success');
        }
      });
    }
    function _fcOcrImage(file) {
      var target = _fcImgTarget || 'mCardFront';
      showBusy('Đang nhận diện công thức…');
      _fcCompressImage(file, 1400, function (dataUrl) {
        if (!dataUrl) { hideBusy(); showToast('Không đọc được ảnh.', 'error'); return; }
        fetch('/api/math-ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: dataUrl }) })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); })
          .then(function (res) {
            hideBusy();
            if (res.status === 501 || (res.body && res.body.error === 'not_configured')) {
              _fcInsertImg(target, dataUrl);
              showToast('Chưa bật nhận diện công thức (cần MATHPIX_APP_ID/KEY ở server). Tạm chèn ảnh — xem hướng dẫn trong PROGRESS.md.', 'warning');
              return;
            }
            if (res.status === 401) { showToast('Cần đăng nhập để dùng nhận diện công thức.', 'error'); return; }
            if (res.body && res.body.latex) {
              var latex = String(res.body.latex);
              var wrapped = /\n|\\\\|\\begin/.test(latex) ? ('\\[' + latex + '\\]') : ('\\(' + latex + '\\)');
              _fcInsertAtCursor(target, wrapped);
              showToast('Đã nhận diện công thức.', 'success');
            } else {
              _fcInsertImg(target, dataUrl);
              showToast((res.body && res.body.error) ? ('Lỗi nhận diện: ' + res.body.error + ' — đã chèn ảnh.') : 'Không nhận diện được công thức. Đã chèn ảnh thay thế.', 'warning');
            }
          })
          .catch(function () { hideBusy(); _fcInsertImg(target, dataUrl); showToast('Lỗi mạng khi nhận diện. Đã chèn ảnh thay thế.', 'error'); });
      });
    }

