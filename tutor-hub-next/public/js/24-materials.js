    // ============================================================
    // MATERIALS
    // ============================================================
    function filterMat(filter, btn) {
      currentMatFilter = filter;
      document.querySelectorAll('#matTabBar .tab').forEach(function (t) { t.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      renderMaterials();
    }

    function _isImageUrl(u) { return !!u && /\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(u); }
    // Tên miền gọn cho tài liệu dạng Link (vd "drive.google.com").
    function _linkHost(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return 'liên kết ngoài'; } }
    function _isImage(m) {
      if (!m) return false;
      if (m.fileType === 'Image') return true;
      return _isImageUrl(m.fileName) || _isImageUrl(m.downloadUrl);
    }

    function renderMaterials() {
      var q = document.getElementById('matSearch').value.toLowerCase();
      var typeF = document.getElementById('matTypeFilter').value;
      var list = materials.filter(function (m) {
        return (!q || m.title.toLowerCase().includes(q)) &&
          (currentMatFilter === 'All' || m.subject === currentMatFilter) &&
          (!typeF || m.fileType === typeF);
      });
      var grid = document.getElementById('materialGrid');
      if (_dbError && _dbError.materials && !materials.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;">' + errorBlock(_dbError.materials, 'retryLoad()') + '</div>';
        return;
      }
      if (_dbLoading && !materials.length) { grid.innerHTML = skelCards(6); return; }
      if (!list.length) {
        var isTA = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
        var body = materials.length === 0
          ? emptyBlock('materials', 'Chưa có tài liệu nào',
              'Tải lên tài liệu để chia sẻ với học sinh và phụ huynh.',
              isTA ? '<button class="btn btn-primary" onclick="openMaterialModal()">＋ Tải lên tài liệu</button>' : '')
          : emptyBlock('materials', 'Không tìm thấy tài liệu phù hợp', 'Thử đổi từ khoá hoặc bộ lọc.', '');
        grid.innerHTML = '<div style="grid-column:1/-1;">' + body + '</div>';
        return;
      }
      grid.innerHTML = list.map(function (m) {
        var isLink = m.fileType === 'Link';
        var url = m.downloadUrl || generateMockBlob(m.fileName, m.fileType);
        var isImg = !isLink && _isImage(m) && m.downloadUrl && /^https?:/i.test(m.downloadUrl);
        // qid() bọc id trong dấu nháy — BẮT BUỘC vì id DB là UUID (vd d1371f60-491d-…);
        // nếu chèn thẳng, onclick="deleteMaterial(d1371f60-491d-…)" → "491d" là token số
        // sai cú pháp → Uncaught SyntaxError, click không chạy được (không xoá được file).
        var editBtns = editMode ? '<div class="mat-actions"><button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();openMaterialModal(' + qid(m.id) + ')">✏️</button><button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteMaterial(' + qid(m.id) + ')">🗑</button></div>' : '';
        var media = isImg
          ? '<a href="' + escAttr(m.downloadUrl) + '" target="_blank" rel="noopener"><img src="' + escAttr(m.downloadUrl) + '" alt="' + escAttr(m.title) + '" style="width:100%;max-height:260px;object-fit:contain;border-radius:8px;background:var(--bg);margin:6px 0;cursor:zoom-in;" loading="lazy"></a>'
          : '';
        return '<div class="material-card">' + editBtns +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
          '<span class="file-badge ' + fileBadgeClass(m.fileType) + '">' + escHtml(m.fileType) + '</span>' +
          '<span class="badge ' + (m.subject === 'Math' ? 'badge-purple' : 'badge-success') + '">' + escHtml(m.subject) + '</span>' +
          '<span class="badge badge-info">' + escHtml(m.class) + '</span>' +
          '</div>' +
          '<div class="mat-title">' + escHtml(m.title) + '</div>' +
          media +
          '<div class="mat-desc">' + m.description + '</div>' +
          '<div class="mat-meta"><span>📅 ' + escHtml(m.uploadDate) + '</span>' +
          (isLink
            ? '<span title="' + escAttr(m.downloadUrl) + '">🔗 ' + escHtml(_linkHost(m.downloadUrl)) + '</span>'
            : '<span>📁 ' + escHtml(m.fileName) + '</span>') +
          '</div>' +
          (isLink
            ? '<a class="mat-download" href="' + escAttr(m.downloadUrl) + '" target="_blank" rel="noopener">🔗 Mở liên kết</a>'
            : '<a class="mat-download" href="' + url + '"' + (isImg ? ' target="_blank" rel="noopener"' : ' download="' + escHtml(m.fileName) + '"') + '>' + (isImg ? '🔍 Xem ảnh đầy đủ' : '⬇ Download') + '</a>') +
          '</div>';
      }).join('');
      typesetMath(grid);
    }

    // Loại "Link" hiện ô nhập URL thay cho ô chọn tệp; các loại khác hiện ô chọn tệp.
    function toggleMatSource() {
      var t = (document.getElementById('mMatType') || {}).value;
      var isLink = (t === 'Link');
      var fw = document.getElementById('mMatFileWrap');
      var uw = document.getElementById('mMatUrlWrap');
      if (fw) fw.style.display = isLink ? 'none' : '';
      if (uw) uw.style.display = isLink ? '' : 'none';
    }

    function openMaterialModal(id) {
      var m = id ? materials.find(function (x) { return x.id === id; }) : null;
      var isLink = !!(m && m.fileType === 'Link');
      var title = m ? 'Sửa tài liệu' : 'Tải lên tài liệu';
      var html = '<div class="modal-header"><h3>' + title + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-group"><label>Title</label><input class="form-input" id="mMatTitle" value="' + (m ? escHtml(m.title) : '') + '"></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Subject</label><select class="form-select" id="mMatSubject">' + _subjectOpts(m && m.subject) + '</select></div>' +
        '<div class="form-group"><label>Class</label><select class="form-select" id="mMatClass">' +
        classes.map(function (c) { return '<option value="' + c.name + '"' + (m && m.class === c.name ? ' selected' : '') + '>' + c.name + '</option>'; }).join('') +
        '</select></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Loại / Type</label><select class="form-select" id="mMatType" onchange="toggleMatSource()">' +
        ['PDF', 'PPT', 'DOC', 'XLS', 'Image', 'Link'].map(function (t) { return '<option value="' + t + '"' + (m && m.fileType === t ? ' selected' : '') + '>' + (t === 'Link' ? '🔗 Link (URL)' : t) + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="form-group" id="mMatFileWrap"' + (isLink ? ' style="display:none;"' : '') + '><label>Tệp / File</label><input class="form-input" type="file" id="mMatFile"></div>' +
        '<div class="form-group" id="mMatUrlWrap"' + (isLink ? '' : ' style="display:none;"') + '><label>Đường dẫn (URL)</label><input class="form-input" type="url" id="mMatUrl" placeholder="https://..." value="' + (isLink ? escAttr(m.downloadUrl || '') : '') + '"></div>' +
        '</div>' +
        '<div class="form-group"><label>Description</label><textarea class="form-textarea" id="mMatDesc" oninput="updateMatPreview()">' + (m ? escHtml(m.description || '') : '') + '</textarea>' +
        '<div class="hint">Use TeX syntax for Math formulas if needed.</div></div>' +
        '<div id="matMathPreview"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="saveMaterial(' + (id ? qid(id) : 'null') + ')">Save</button>' +
        '</div>';
      openModal(html);
      setTimeout(function () { updateMatPreview(); }, 100);
    }

    function updateMatPreview() {
      var desc = document.getElementById('mMatDesc');
      var subj = document.getElementById('mMatSubject');
      var preview = document.getElementById('matMathPreview');
      if (!desc || !preview || !subj) return;
      if (subj.value === 'Math' && desc.value.trim()) {
        preview.innerHTML = '<div class="math-preview-label">Preview</div><div class="math-preview">' + desc.value + '</div>';
        typesetMath(preview);
      } else {
        preview.innerHTML = '';
      }
    }

    function saveMaterial(id) {
      var title = document.getElementById('mMatTitle').value.trim();
      if (!title) { showToast('Tiêu đề là bắt buộc.', 'error'); return; }
      var fileInput = document.getElementById('mMatFile');
      var file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      var fileType = document.getElementById('mMatType').value;
      var subject = document.getElementById('mMatSubject').value;
      var classVal = document.getElementById('mMatClass') ? document.getElementById('mMatClass').value : '';
      var description = document.getElementById('mMatDesc') ? document.getElementById('mMatDesc').value.trim() : '';
      var linkUrl = document.getElementById('mMatUrl') ? document.getElementById('mMatUrl').value.trim() : '';

      function _doSave(fileUrl, fileName, filePath) {
        hideBusy();
        var existingMat = id ? materials.find(function (x) { return x.id === id; }) : null;
        var resolvedUrl = fileUrl || (existingMat && existingMat.downloadUrl) || '';
        var resolvedName = fileName || (existingMat && existingMat.fileName) || '';
        var resolvedPath = filePath || '';

        var dbData = {
          title: title, subject: subject, class_name: classVal,
          type: fileType, description: description,
          url: resolvedUrl, file_url: resolvedUrl,
          file_path: resolvedPath, file_name: resolvedName,
        };

        if (id) {
          if (existingMat) Object.assign(existingMat, { title: title, subject: subject, class: classVal, type: fileType, description: description, downloadUrl: resolvedUrl, fileName: resolvedName });
          if (_db) {
            _db.from('materials').update(dbData).eq('id', String(id))
              .then(function (r) {
                if (r.error) { showToast('Lỗi lưu: ' + r.error.message, 'error'); return; }
                showToast('Đã cập nhật tài liệu.', 'success');
                closeModal(); loadMaterials();
              });
          } else {
            showToast('Đã cập nhật tài liệu.', 'success');
            closeModal(); renderMaterials();
          }
        } else {
          if (_db) {
            dbData.owner_id = _dbUserId;
            _db.from('materials').insert(dbData).select().then(function (r) {
              if (r.error) { console.error('Insert material failed:', r.error); showToast('Lỗi tải lên: ' + r.error.message, 'error'); return; }
              showToast('Đã tải lên tài liệu.', 'success');
              closeModal(); loadMaterials();
            });
          } else {
            materials.unshift({ id: nextMatId++, title: title, subject: subject, class: classVal, type: fileType, description: description, downloadUrl: resolvedUrl, fileName: resolvedName, uploadDate: new Date().toISOString().split('T')[0] });
            showToast('Đã tải lên tài liệu.', 'success');
            closeModal(); renderMaterials();
          }
        }
      }

      // Loại "Link": lưu URL, KHÔNG upload storage. Tự thêm https:// nếu thiếu.
      if (fileType === 'Link') {
        if (!linkUrl) { showToast('Nhập đường dẫn (URL).', 'error'); return; }
        var normUrl = /^(https?:|mailto:|tel:)/i.test(linkUrl) ? linkUrl : ('https://' + linkUrl);
        _doSave(normUrl, '', '');   // fileName rỗng — đây là liên kết, không phải tệp
        return;
      }

      if (file && _db) {
        var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        var storagePath = (_dbUserId || 'anon') + '/' + Date.now() + '_' + safeName;
        showBusy('Đang tải lên tài liệu…');
        _db.storage.from('materials').upload(storagePath, file, { upsert: true })
          .then(function (r) {
            if (r.error) { hideBusy(); console.error('Storage upload failed:', r.error); showToast('Lỗi tải file: ' + r.error.message, 'error'); return; }
            var pubUrl = _db.storage.from('materials').getPublicUrl(storagePath).data.publicUrl;
            _doSave(pubUrl, file.name, storagePath);
          })
          .catch(function (e) { hideBusy(); showToast('Lỗi mạng khi tải tệp. Thử lại.', 'error'); });
      } else {
        _doSave(null, null, null);
      }
    }

    // Suy ra đường dẫn file trong bucket 'materials' từ public URL (cho tài liệu cũ
    // chưa lưu file_path). URL dạng .../storage/v1/object/public/materials/<path>.
    function _storagePathFromUrl(url) {
      if (!url) return '';
      var m = String(url).match(/\/storage\/v1\/object\/(?:public|sign)\/materials\/([^?#]+)/);
      return m ? decodeURIComponent(m[1]) : '';
    }

    function deleteMaterial(id) {
      uiConfirm('Xóa tài liệu này?', function () {
        var mat = materials.find(function (m) { return m.id === id; });
        var path = (mat && mat.filePath) || _storagePathFromUrl(mat && mat.downloadUrl);
        materials = materials.filter(function (m) { return m.id !== id; });
        showToast('Đã xóa tài liệu.', 'success');
        renderMaterials();
        if (!_db) return;
        // Xoá bản ghi DB; đồng thời xoá luôn FILE trong Storage bucket 'materials'
        // (trước đây chỉ xoá bản ghi → file mồ côi vẫn tốn dung lượng).
        _db.from('materials').delete().eq('id', String(id))
          .then(function (r) { if (r.error) showToast('Lỗi xóa: ' + r.error.message, 'error'); });
        if (path) {
          _db.storage.from('materials').remove([path])
            .then(function (rs) { if (rs && rs.error) console.warn('storage remove', rs.error.message); })
            .catch(function (e) { console.warn('storage remove', e && e.message); });
        }
      });
    }

