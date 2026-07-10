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
      if (m.type === 'Image') return true;
      return _isImageUrl(m.fileName) || _isImageUrl(m.downloadUrl);
    }
    // Tài liệu có file gốc lưu trên Google Drive (thay vì Supabase Storage) —
    // đánh dấu bằng tiền tố 'gdrive:' trong file_path, để biết đường mở/xoá đúng.
    function _isDriveMaterial(m) { return !!(m && (m.filePath || '').indexOf('gdrive:') === 0); }
    function _driveFileId(m) { return _isDriveMaterial(m) ? m.filePath.slice('gdrive:'.length) : ''; }

    // ============================================================
    // GOOGLE DRIVE — upload file NẶNG (PDF/Word/...) thẳng lên Drive của GV
    // (không qua service account — Gmail cá nhân không có quota cho service
    // account, đã kiểm chứng thực tế). GV bấm "Kết nối Google Drive" ở Cài đặt
    // 1 lần; từ đó Upload Material tự route file qua Drive thay vì Supabase.
    // ============================================================
    var _driveConnected = null;   // null = chưa biết, true/false = đã xác định

    function _checkDriveConnected(cb) {
      if (_driveConnected !== null) { cb(_driveConnected); return; }
      if (!_db || !_dbUserId) { cb(false); return; }
      _db.from('google_drive_tokens').select('user_id').eq('user_id', _dbUserId).maybeSingle()
        .then(function (r) {
          if (r.error) { _driveConnected = false; cb(false); return; }   // bảng chưa có (chưa chạy migration 027) hoặc lỗi khác -> coi như chưa kết nối
          _driveConnected = !!r.data;
          cb(_driveConnected);
        })
        .catch(function () { _driveConnected = false; cb(false); });
    }

    // Tải file thẳng lên Drive: mở phiên resumable (server) -> PUT trực tiếp
    // lên Google (không qua server mình, không bị giới hạn dung lượng) -> cấp
    // quyền xem công khai. onProgress(pct) tuỳ chọn để cập nhật % lên UI.
    function _uploadToGoogleDrive(file, onProgress) {
      return fetch('/api/google-drive/upload-init', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSize: file.size }),
      })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || 'upload-init lỗi'); return j; }); })
        .then(function (init) {
          return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('PUT', init.uploadUrl, true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + init.accessToken);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.upload.onprogress = function (e) { if (onProgress && e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
            xhr.onload = function () {
              if (xhr.status >= 200 && xhr.status < 300) { try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(new Error('Phản hồi Drive không hợp lệ')); } }
              else reject(new Error('Tải lên Drive thất bại (HTTP ' + xhr.status + ')'));
            };
            xhr.onerror = function () { reject(new Error('Lỗi mạng khi tải lên Drive.')); };
            xhr.send(file);
          });
        })
        .then(function (driveFile) {
          return fetch('/api/google-drive/publish-file', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: driveFile.id }),
          }).then(function () { return driveFile; });   // không chặn nếu publish lỗi — file vẫn đã lên Drive
        });
    }

    function _deleteFromGoogleDrive(fileId) {
      return fetch('/api/google-drive/delete-file', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: fileId }),
      }).catch(function () { });
    }

    // ── Cài đặt: card "Kết nối Google Drive" ──────────────────────
    function renderDriveSettings() {
      var box = document.getElementById('driveConnectControls');
      if (!box) return;
      var isTA = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
      if (!isTA || !_db) { box.innerHTML = ''; return; }
      box.innerHTML = '<span style="font-size:13px;color:var(--text-muted);">Đang kiểm tra kết nối…</span>';
      _db.from('google_drive_tokens').select('drive_email').eq('user_id', _dbUserId).maybeSingle()
        .then(function (r) {
          if (r.error) {
            box.innerHTML = '<span style="font-size:12.5px;color:var(--text-muted);">Tính năng cần bật migration 027 trên Supabase (bảng google_drive_tokens).</span>';
            return;
          }
          _driveConnected = !!r.data;
          if (r.data) {
            box.innerHTML = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
              '<span class="badge badge-success">✅ Đã kết nối: ' + escHtml(r.data.drive_email || '') + '</span>' +
              '<button class="btn btn-sm btn-ghost" onclick="disconnectGoogleDrive()">Ngắt kết nối</button>' +
              '</div><span style="font-size:12.5px;color:var(--text-muted);">Tài liệu tải lên (PDF/Word/...) sẽ tự lưu vào thư mục "TutorHub Uploads" trên Drive của bạn.</span>';
          } else {
            box.innerHTML = '<button class="btn btn-primary" onclick="connectGoogleDrive()">🔗 Kết nối Google Drive</button>' +
              '<span style="font-size:12.5px;color:var(--text-muted);align-self:center;margin-left:10px;">Lưu tài liệu nặng (PDF/Word/PPT...) vào Drive của bạn thay vì giới hạn lưu trữ mặc định.</span>';
          }
        });
    }
    function connectGoogleDrive() {
      // Bắt buộc điều hướng CẢ TRANG (không phải trong iframe) vì Google chặn
      // hiển thị màn hình đăng nhập trong iframe.
      try { window.top.location.href = '/api/google-drive/connect'; }
      catch (e) { window.location.href = '/api/google-drive/connect'; }
    }
    function disconnectGoogleDrive() {
      uiConfirm('Ngắt kết nối Google Drive? Tài liệu đã lưu trên Drive vẫn giữ nguyên, nhưng tải lên sau này sẽ dùng lại lưu trữ mặc định.', function () {
        fetch('/api/google-drive/disconnect', { method: 'POST' }).then(function () {
          _driveConnected = false;
          showToast('Đã ngắt kết nối Google Drive.', 'success');
          renderDriveSettings();
        });
      });
    }

    function renderMaterials() {
      var q = document.getElementById('matSearch').value.toLowerCase();
      var typeF = document.getElementById('matTypeFilter').value;
      var list = materials.filter(function (m) {
        return (!q || m.title.toLowerCase().includes(q)) &&
          (currentMatFilter === 'All' || m.subject === currentMatFilter) &&
          (!typeF || m.type === typeF);
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
        var isLink = m.type === 'Link';
        var isDrive = _isDriveMaterial(m);
        var url = m.downloadUrl || generateMockBlob(m.fileName, m.type);
        var isImg = !isLink && !isDrive && _isImage(m) && m.downloadUrl && /^https?:/i.test(m.downloadUrl);
        // qid() bọc id trong dấu nháy — BẮT BUỘC vì id DB là UUID (vd d1371f60-491d-…);
        // nếu chèn thẳng, onclick="deleteMaterial(d1371f60-491d-…)" → "491d" là token số
        // sai cú pháp → Uncaught SyntaxError, click không chạy được (không xoá được file).
        var editBtns = editMode ? '<div class="mat-actions"><button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();openMaterialModal(' + qid(m.id) + ')">✏️</button><button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteMaterial(' + qid(m.id) + ')">🗑</button></div>' : '';
        var media = isImg
          ? '<a href="' + escAttr(m.downloadUrl) + '" target="_blank" rel="noopener"><img src="' + escAttr(m.downloadUrl) + '" alt="' + escAttr(m.title) + '" style="width:100%;max-height:260px;object-fit:contain;border-radius:8px;background:var(--bg);margin:6px 0;cursor:zoom-in;" loading="lazy"></a>'
          : '';
        return '<div class="material-card">' + editBtns +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
          '<span class="file-badge ' + fileBadgeClass(m.type) + '">' + escHtml(m.type) + '</span>' +
          '<span class="badge ' + (m.subject === 'Math' ? 'badge-purple' : 'badge-success') + '">' + escHtml(m.subject) + '</span>' +
          '<span class="badge badge-info">' + escHtml(m.class) + '</span>' +
          '</div>' +
          '<div class="mat-title">' + escHtml(m.title) + '</div>' +
          media +
          '<div class="mat-desc">' + m.description + '</div>' +
          '<div class="mat-meta"><span>📅 ' + escHtml(m.uploadDate) + '</span>' +
          (isLink
            ? '<span title="' + escAttr(m.downloadUrl) + '">🔗 ' + escHtml(_linkHost(m.downloadUrl)) + '</span>'
            : isDrive
              ? '<span>📂 Google Drive</span>'
              : '<span>📁 ' + escHtml(m.fileName) + '</span>') +
          '</div>' +
          (isLink
            ? '<a class="mat-download" href="' + escAttr(m.downloadUrl) + '" target="_blank" rel="noopener">🔗 Mở liên kết</a>'
            : isDrive
              // File nằm trên Drive (cross-origin) -> KHÔNG dùng thuộc tính "download"
              // (trình duyệt bỏ qua với URL khác gốc, sẽ điều hướng cả tab ra khỏi app).
              // Mở tab mới để xem/tải trên trang Drive, giống cách tài liệu Link hoạt động.
              ? '<a class="mat-download" href="' + escAttr(m.downloadUrl) + '" target="_blank" rel="noopener">📂 Mở trên Google Drive</a>'
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
      var isLink = !!(m && m.type === 'Link');
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
        ['PDF', 'PPT', 'DOC', 'XLS', 'Image', 'Link'].map(function (t) { return '<option value="' + t + '"' + (m && m.type === t ? ' selected' : '') + '>' + (t === 'Link' ? '🔗 Link (URL)' : t) + '</option>'; }).join('') +
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
        '<button class="btn btn-primary" onclick="saveMaterial(' + (id ? qid(id) : 'null') + ', this)">Save</button>' +
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

    function saveMaterial(id, btn) {
      var title = document.getElementById('mMatTitle').value.trim();
      if (!title) { showToast('Tiêu đề là bắt buộc.', 'error'); return; }
      var fileInput = document.getElementById('mMatFile');
      var file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      var fileType = document.getElementById('mMatType').value;
      var subject = document.getElementById('mMatSubject').value;
      var classVal = document.getElementById('mMatClass') ? document.getElementById('mMatClass').value : '';
      var description = document.getElementById('mMatDesc') ? document.getElementById('mMatDesc').value.trim() : '';
      var linkUrl = document.getElementById('mMatUrl') ? document.getElementById('mMatUrl').value.trim() : '';
      var origBtnHtml = btn ? btn.innerHTML : '';
      function _setBtnLoading(text) { if (btn) { btn.disabled = true; btn.innerHTML = text; } }
      function _restoreBtn() { if (btn) { btn.disabled = false; btn.innerHTML = origBtnHtml; } }

      function _doSave(fileUrl, fileName, filePath) {
        hideBusy();
        var existingMat = id ? materials.find(function (x) { return x.id === id; }) : null;
        var resolvedUrl = fileUrl || (existingMat && existingMat.downloadUrl) || '';
        var resolvedName = fileName || (existingMat && existingMat.fileName) || '';
        // Sửa tài liệu KHÔNG chọn tệp mới (filePath=null) phải GIỮ NGUYÊN file_path cũ —
        // nếu không, marker 'gdrive:<fileId>' của tài liệu Drive bị xoá mất, khiến lần
        // render/xoá sau đó tưởng nhầm đây là tệp Supabase thường (link Drive lại gắn
        // "download" -> trình duyệt điều hướng cả tab; xoá thì không dọn được file trên Drive).
        var resolvedPath = filePath || (existingMat && existingMat.filePath) || '';

        var dbData = {
          title: title, subject: subject, class_name: classVal,
          type: fileType, description: description,
          url: resolvedUrl, file_url: resolvedUrl,
          file_path: resolvedPath, file_name: resolvedName,
        };

        if (id) {
          if (existingMat) Object.assign(existingMat, { title: title, subject: subject, class: classVal, type: fileType, description: description, downloadUrl: resolvedUrl, fileName: resolvedName, filePath: resolvedPath });
          if (_db) {
            _db.from('materials').update(dbData).eq('id', String(id))
              .then(function (r) {
                if (r.error) { showToast('Lỗi lưu: ' + r.error.message, 'error'); _restoreBtn(); return; }
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
              if (r.error) { console.error('Insert material failed:', r.error); showToast('Lỗi tải lên: ' + r.error.message, 'error'); _restoreBtn(); return; }
              showToast('Đã tải lên tài liệu.', 'success');
              closeModal(); loadMaterials();
            });
          } else {
            materials.unshift({ id: nextMatId++, title: title, subject: subject, class: classVal, type: fileType, description: description, downloadUrl: resolvedUrl, fileName: resolvedName, filePath: resolvedPath, uploadDate: new Date().toISOString().split('T')[0] });
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

      if (!file) { _doSave(null, null, null); return; }
      if (!_db) { _doSave(null, null, null); return; }

      // Đã kết nối Google Drive -> file NẶNG (PDF/Word/PPT/...) đi thẳng lên Drive
      // của GV (bỏ qua giới hạn dung lượng của Supabase Storage/serverless function).
      // Chưa kết nối -> giữ nguyên luồng cũ (Supabase Storage).
      _checkDriveConnected(function (connected) {
        if (connected) {
          _setBtnLoading('⏳ Đang tải lên Drive... 0%');
          _uploadToGoogleDrive(file, function (pct) { _setBtnLoading('⏳ Đang tải lên Drive... ' + pct + '%'); })
            .then(function (driveFile) {
              _doSave(driveFile.webViewLink, file.name, 'gdrive:' + driveFile.id);
            })
            .catch(function (e) {
              _restoreBtn();
              showToast('Lỗi tải lên Drive: ' + (e && e.message || 'không rõ') + '. Đang thử lưu bằng lưu trữ mặc định...', 'error');
              _uploadViaSupabase();
            });
          return;
        }
        _uploadViaSupabase();
      });

      function _uploadViaSupabase() {
        var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        var storagePath = (_dbUserId || 'anon') + '/' + Date.now() + '_' + safeName;
        _setBtnLoading('⏳ Đang tải lên...');
        showBusy('Đang tải lên tài liệu…');
        _db.storage.from('materials').upload(storagePath, file, { upsert: true })
          .then(function (r) {
            if (r.error) { hideBusy(); _restoreBtn(); console.error('Storage upload failed:', r.error); showToast('Lỗi tải file: ' + r.error.message, 'error'); return; }
            var pubUrl = _db.storage.from('materials').getPublicUrl(storagePath).data.publicUrl;
            _doSave(pubUrl, file.name, storagePath);
          })
          .catch(function (e) { hideBusy(); _restoreBtn(); showToast('Lỗi mạng khi tải tệp. Thử lại.', 'error'); });
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
        var isDrive = _isDriveMaterial(mat);
        var driveFileId = isDrive ? _driveFileId(mat) : '';
        var path = isDrive ? '' : ((mat && mat.filePath) || _storagePathFromUrl(mat && mat.downloadUrl));
        materials = materials.filter(function (m) { return m.id !== id; });
        showToast('Đã xóa tài liệu.', 'success');
        renderMaterials();
        if (!_db) return;
        // Xoá bản ghi DB; đồng thời xoá luôn FILE gốc (Storage bucket 'materials'
        // hoặc file trên Google Drive) — trước đây chỉ xoá bản ghi → file mồ côi.
        _db.from('materials').delete().eq('id', String(id))
          .then(function (r) { if (r.error) showToast('Lỗi xóa: ' + r.error.message, 'error'); });
        if (driveFileId) {
          _deleteFromGoogleDrive(driveFileId);
        } else if (path) {
          _db.storage.from('materials').remove([path])
            .then(function (rs) { if (rs && rs.error) console.warn('storage remove', rs.error.message); })
            .catch(function (e) { console.warn('storage remove', e && e.message); });
        }
      });
    }

