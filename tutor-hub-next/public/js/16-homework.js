    // ============================================================
    // HOMEWORK
    // ============================================================
    function filterHw(filter, btn) {
      currentHwFilter = filter;
      document.querySelectorAll('#hwTabBar .tab').forEach(function (t) { t.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      renderHomework();
    }

    function renderHomework() {
      var statusF = document.getElementById('hwStatusFilter').value;
      var list = homework.filter(function (h) {
        return (currentHwFilter === 'All' || h.subject === currentHwFilter) &&
          (!statusF || h.status === statusF);
      });
      var badge = { 'Graded': 'badge-success', 'Assigned': 'badge-info', 'Overdue': 'badge-danger' };
      document.getElementById('hwTableBody').innerHTML = list.map(function (h) {
        var actions = editMode ? '<td><button class="btn btn-sm btn-ghost" onclick="openHomeworkModal(' + h.id + ')">✏️</button> <button class="btn btn-sm btn-danger" onclick="deleteHomework(' + h.id + ')">🗑</button></td>' : '';
        return '<tr>' +
          '<td><strong>' + escHtml(h.title) + '</strong>' + (h.description ? '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;" class="hw-desc-preview">' + h.description.substring(0, 60) + (h.description.length > 60 ? '...' : '') + '</div>' : '') + '</td>' +
          '<td><span class="badge ' + (h.subject === 'Math' ? 'badge-purple' : 'badge-success') + '">' + escHtml(h.subject) + '</span></td>' +
          '<td>' + escHtml(h.class) + '</td>' +
          '<td>' + escHtml(h.due) + '</td>' +
          '<td><span class="badge ' + (badge[h.status] || 'badge-gray') + '">' + escHtml(h.status) + '</span></td>' +
          actions +
          '</tr>';
      }).join('') || '<tr><td colspan="6" class="empty">No homework found.</td></tr>';
      typesetMath(document.getElementById('hwTableBody'));
    }

    function openHomeworkModal(id) {
      var h = id ? homework.find(function (x) { return x.id === id; }) : null;
      var title = h ? 'Edit Homework' : 'Add Homework';
      var html = '<div class="modal-header"><h3>' + title + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-group"><label>Title</label><input class="form-input" id="mHwTitle" value="' + (h ? escHtml(h.title) : '') + '"></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Subject</label><select class="form-select" id="mHwSubject" onchange="updateHwMathPreview()">' + _subjectOpts(h && h.subject) + '</select></div>' +
        '<div class="form-group"><label>Class</label><select class="form-select" id="mHwClass">' +
        classes.map(function (c) { return '<option value="' + c.name + '"' + (h && h.class === c.name ? ' selected' : '') + '>' + c.name + '</option>'; }).join('') +
        '</select></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Due Date</label><input class="form-input" type="date" id="mHwDue" value="' + (h ? h.due : '') + '"></div>' +
        '<div class="form-group"><label>Status</label><select class="form-select" id="mHwStatus">' +
        '<option value="Assigned"' + (h && h.status === 'Assigned' ? ' selected' : '') + '>Assigned</option>' +
        '<option value="Graded"' + (h && h.status === 'Graded' ? ' selected' : '') + '>Graded</option>' +
        '<option value="Overdue"' + (h && h.status === 'Overdue' ? ' selected' : '') + '>Overdue</option></select></div>' +
        '</div>' +
        '<div class="form-group"><label>Completion %</label><input class="form-input" type="number" min="0" max="100" id="mHwCompletion" value="' + (h ? h.completion || 0 : 0) + '"></div>' +
        '<div class="form-group"><label>Description</label><textarea class="form-textarea" id="mHwDesc" oninput="updateHwMathPreview()">' + (h ? escHtml(h.description || '') : '') + '</textarea>' +
        '<div class="hint">Use TeX syntax for Math formulas, e.g. \\(x^2+1\\)</div></div>' +
        '<div id="hwMathPreview"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="saveHomework(' + (id || 'null') + ')">Save</button>' +
        '</div>';
      openModal(html);
      setTimeout(function () { updateHwMathPreview(); }, 100);
    }

    function updateHwMathPreview() {
      var subj = document.getElementById('mHwSubject');
      var desc = document.getElementById('mHwDesc');
      var preview = document.getElementById('hwMathPreview');
      if (!subj || !desc || !preview) return;
      if (subj.value === 'Math' && desc.value.trim()) {
        preview.innerHTML = '<div class="math-preview-label">Preview</div><div class="math-preview">' + desc.value + '</div>';
        typesetMath(preview);
      } else {
        preview.innerHTML = '';
      }
    }

    function saveHomework(id) {
      var title = document.getElementById('mHwTitle').value.trim();
      if (!title) { showToast('Title is required.', 'error'); return; }
      var today = new Date().toISOString().split('T')[0];
      var data = {
        title: title,
        subject: document.getElementById('mHwSubject').value,
        class: document.getElementById('mHwClass').value,
        due: document.getElementById('mHwDue').value || today,
        status: document.getElementById('mHwStatus').value,
        completion: parseInt(document.getElementById('mHwCompletion').value) || 0,
        description: document.getElementById('mHwDesc').value.trim(),
      };
      if (id) {
        var h = homework.find(function (x) { return x.id === id; });
        if (h) Object.assign(h, data);
        showToast('Homework updated.', 'success');
      } else {
        data.id = nextHwId++;
        data.assigned = today;
        homework.push(data);
        showToast('Homework added.', 'success');
      }
      closeModal();
      renderHomework();
    }

    function deleteHomework(id) {
      uiConfirm('Xóa bài tập về nhà này?', function () {
        homework = homework.filter(function (h) { return h.id !== id; });
        showToast('Homework deleted.', 'error');
        renderHomework();
      });
    }

