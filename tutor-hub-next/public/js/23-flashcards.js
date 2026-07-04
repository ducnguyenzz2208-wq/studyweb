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
      if (!list.length) {
        grid.innerHTML = '<div class="empty" style="grid-column:1/-1;"><div class="empty-icon">🃏</div>No flashcard decks found.<br>' +
          (editMode ? '<button class="btn btn-primary" style="margin-top:12px;" onclick="openDeckModal()">+ Create First Deck</button>' : 'Turn on Edit Mode to create one.') + '</div>';
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
      var view = document.getElementById('flashcards-deck-view');
      view.style.display = '';

      var difficult = d.cards.filter(function (c) { return c.difficulty === 'hard'; }).length;
      var editBtns = editMode ? '<button class="btn btn-primary btn-sm" onclick="openCardModal(' + d.id + ')">+ Thêm thẻ</button> <button class="btn btn-ghost btn-sm" onclick="openBulkImportModal(' + d.id + ')">📋 Nhập hàng loạt</button>' : '';

      var html = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">' +
        '<button class="btn btn-ghost" onclick="backToDecks()">← Quay lại</button>' +
        '<div style="flex:1;min-width:200px;"><h2 style="font-size:22px;font-weight:800;">' + escHtml(d.title) + '</h2>' +
        '<div style="color:var(--text-muted);font-size:13px;margin-top:2px;">' + escHtml(d.subject) + ' · ' + escHtml(d.class) + ' · ' + d.cards.length + ' thẻ</div></div>' +
        '<button class="btn btn-primary" onclick="startStudy(' + d.id + ')">🎯 Học ngay</button>' +
        editBtns +
        '</div>';

      // Stats
      html += '<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px;">' +
        '<div class="kpi-card"><div class="kpi-label">Total Cards</div><div class="kpi-value col-blue">' + d.cards.length + '</div></div>' +
        '<div class="kpi-card"><div class="kpi-label">Difficult</div><div class="kpi-value" style="color:var(--danger)">' + difficult + '</div></div>' +
        '<div class="kpi-card"><div class="kpi-label">Subject</div><div class="kpi-value" style="font-size:20px;">' + escHtml(d.subject) + '</div></div>' +
        '<div class="kpi-card"><div class="kpi-label">Class</div><div class="kpi-value" style="font-size:20px;">' + escHtml(d.class) + '</div></div>' +
        '</div>';

      // Card list
      html += '<div class="card"><div class="card-header"><div class="card-title">All Cards</div><span class="badge badge-info">' + d.cards.length + ' total</span></div>';
      if (d.cards.length) {
        html += d.cards.map(function (c, idx) {
          var diffBadge = { easy: 'badge-success', medium: 'badge-warning', hard: 'badge-danger' }[c.difficulty] || 'badge-gray';
          var editCardBtns = editMode ? '<div class="card-list-actions">' +
            (idx > 0 ? '<button class="btn btn-sm btn-ghost" title="Move Up" onclick="moveCard(' + d.id + ',' + c.id + ',-1)">↑</button>' : '') +
            (idx < d.cards.length - 1 ? '<button class="btn btn-sm btn-ghost" title="Move Down" onclick="moveCard(' + d.id + ',' + c.id + ',1)">↓</button>' : '') +
            '<button class="btn btn-sm btn-ghost" onclick="openCardModal(' + d.id + ',' + c.id + ')">✏️</button>' +
            '<button class="btn btn-sm btn-ghost" onclick="duplicateCard(' + d.id + ',' + c.id + ')">📋</button>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteCard(' + d.id + ',' + c.id + ')">🗑</button></div>' : '';
          return '<div class="card-list-item">' +
            '<div class="card-num">' + (idx + 1) + '</div>' +
            '<div class="card-list-content">' +
            '<div class="card-list-front">' + c.front + '</div>' +
            '<div class="card-list-back">' + c.back + '</div>' +
            '<div style="margin-top:4px;"><span class="badge ' + diffBadge + '" style="font-size:10px;">' + c.difficulty + '</span></div>' +
            '</div>' +
            editCardBtns +
            '</div>';
        }).join('');
      } else {
        html += '<div class="empty"><div class="empty-icon">📇</div>No cards in this deck yet.' + (editMode ? '<br><button class="btn btn-primary" style="margin-top:12px;" onclick="openCardModal(' + d.id + ')">+ Add First Card</button>' : '') + '</div>';
      }
      html += '</div>';
      view.innerHTML = html;
      typesetMath(view);
    }

    function backToDecks() {
      currentDeckView = null;
      document.getElementById('flashcards-list-view').style.display = '';
      document.getElementById('flashcards-deck-view').style.display = 'none';
      document.getElementById('flashcards-study-view').style.display = 'none';
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
      document.getElementById('flashcards-study-view').style.display = '';
      renderStudyCard();
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
        '<div style="display:flex;gap:6px;">' +
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
        '<div class="flashcard-label">Front</div>' +
        '<div class="flashcard-text">' + card.front + '</div>' +
        (card.hint ? '<div class="flashcard-hint">💡 ' + escHtml(card.hint) + '</div>' : '') +
        '<div style="margin-top:16px;font-size:11px;color:var(--text-muted);">Click to flip</div>' +
        '</div>' +
        '<div class="flashcard-face flashcard-back">' +
        '<div class="flashcard-label">Back</div>' +
        '<div class="flashcard-text">' + card.back + '</div>' +
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
    }

    function nextStudyCard() {
      if (!studyState || studyState.index >= studyState.cards.length - 1) return;
      studyState.index++;
      studyState.flipped = false;
      renderStudyCard();
    }

    function prevStudyCard() {
      if (!studyState || studyState.index <= 0) return;
      studyState.index--;
      studyState.flipped = false;
      renderStudyCard();
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
      if (!confirm('Xóa bộ thẻ này và toàn bộ thẻ con?')) return;
      var d = flashcardDecks.find(function (x) { return x.id === id; });
      flashcardDecks = flashcardDecks.filter(function (x) { return x.id !== id; });
      showToast('Đã xóa bộ thẻ.', 'info');
      renderDecks();
      if (_db && d && d.dbId) {
        _db.from('flashcard_decks').delete().eq('id', d.dbId)
          .then(function (r) { if (r.error) showToast('Lỗi xóa bộ thẻ: ' + r.error.message, 'error'); });
      }
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
        '<div class="hint">Hỗ trợ LaTeX: \\(x^2+1\\) hoặc \\[\\frac{a}{b}\\]</div></div>' +
        '<div class="form-group"><label>Mặt sau</label><textarea class="form-textarea" id="mCardBack" oninput="updateCardPreview()">' + (c ? escHtml(c.back) : '') + '</textarea></div>' +
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
      if (front.value.trim()) content += '<div class="math-preview-label">Front Preview</div><div class="math-preview">' + front.value + '</div>';
      if (back.value.trim()) content += '<div class="math-preview-label" style="margin-top:8px;">Back Preview</div><div class="math-preview">' + back.value + '</div>';
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
      var today = new Date().toISOString().split('T')[0];
      if (cardId) {
        var c = d.cards.find(function (x) { return x.id === cardId; });
        if (c) Object.assign(c, data);
        if (_db && _dbUserId && c && c.dbId) {
          _db.from('flashcards').update({ front: front, back: back, difficulty: data.difficulty }).eq('id', c.dbId)
            .then(function (r) { if (r.error) showToast('Lỗi lưu thẻ: ' + r.error.message, 'error'); });
        }
        d.lastUpdated = today;
        showToast('Đã cập nhật thẻ.', 'success');
        closeModal(); openDeckDetail(deckId);
      } else if (_db && _dbUserId && d.dbId) {
        _db.from('flashcards').insert({ deck_id: d.dbId, owner_id: _dbUserId, front: front, back: back, difficulty: data.difficulty }).select()
          .then(function (r) {
            if (r.error) { showToast('Lỗi thêm thẻ: ' + r.error.message, 'error'); return; }
            data.id = nextCardId++;
            data.dbId = (r.data && r.data[0]) ? r.data[0].id : null;
            d.cards.push(data);
            d.lastUpdated = today;
            showToast('Đã thêm thẻ mới.', 'success');
            closeModal(); openDeckDetail(deckId);
          });
      } else {
        data.id = nextCardId++;
        d.cards.push(data);
        d.lastUpdated = today;
        showToast('Đã thêm thẻ mới.', 'success');
        closeModal(); openDeckDetail(deckId);
      }
    }

    function deleteCard(deckId, cardId) {
      if (!confirm('Xóa thẻ này?')) return;
      var d = flashcardDecks.find(function (x) { return x.id === deckId; });
      var c = d ? d.cards.find(function (x) { return x.id === cardId; }) : null;
      if (d) d.cards = d.cards.filter(function (x) { return x.id !== cardId; });
      showToast('Đã xóa thẻ.', 'error');
      openDeckDetail(deckId);
      if (_db && c && c.dbId) {
        _db.from('flashcards').delete().eq('id', c.dbId)
          .then(function (r) { if (r.error) showToast('Lỗi xóa thẻ: ' + r.error.message, 'error'); });
      }
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
      var count = 0;
      lines.forEach(function (line) {
        var parsed = _parseBulkLine(line);
        if (parsed && parsed.front && parsed.back) {
          d.cards.push({ id: nextCardId++, front: parsed.front, back: parsed.back, hint: '', example: '', difficulty: 'medium' });
          count++;
        }
      });
      d.lastUpdated = new Date().toISOString().split('T')[0];
      if (count) persistDeck(d);
      showToast('Đã nhập ' + count + ' thẻ.', count ? 'success' : 'error');
      closeModal();
      if (count) openDeckDetail(deckId);
    }

