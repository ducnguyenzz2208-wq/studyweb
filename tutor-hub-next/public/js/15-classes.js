    // ============================================================
    // CLASSES
    // ============================================================
    function renderClasses() {
      if (_dbLoading && !classes.length) {
        document.getElementById('classGrid').innerHTML = skelCards(4);
        var sbk = document.getElementById('scheduleBody'); if (sbk) sbk.innerHTML = '';
        return;
      }
      if (!classes.length) {
        var isTA = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');
        document.getElementById('classGrid').innerHTML = '<div style="grid-column:1/-1;">' + emptyBlock(
          'classes', 'Chưa có lớp học nào',
          'Tạo lớp để bắt đầu quản lý học sinh, bài tập và lịch dạy.',
          isTA ? '<button class="btn btn-primary" onclick="openClassModal()">＋ Tạo lớp đầu tiên</button>' : '') + '</div>';
        var sb = document.getElementById('scheduleBody'); if (sb) sb.innerHTML = '';
        return;
      }
      document.getElementById('classGrid').innerHTML = classes.map(function (c) {
        var enrolled = students.filter(function (s) { return s.class === c.name; }).length;
        var avgAtt = enrolled ? Math.round(students.filter(function (s) { return s.class === c.name; }).reduce(function (a, s) { return a + s.attendance; }, 0) / enrolled) : 0;
        var avgSc = enrolled ? Math.round(students.filter(function (s) { return s.class === c.name; }).reduce(function (a, s) { return a + avgScore(s); }, 0) / enrolled) : 0;
        var editBtns = editMode ? '<div style="position:absolute;top:12px;right:12px;display:flex;gap:4px;">' +
          '<button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();openClassModal(' + qid(c.id) + ')">✏️</button>' +
          '<button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteClass(' + qid(c.id) + ')">🗑</button></div>' : '';
        var canOpen = /-/.test(String(c.id)); // chỉ lớp thật (UUID) mới mở feed được
        return '<div class="class-card ' + c.color + '" style="position:relative;' + (canOpen ? 'cursor:pointer;' : '') + '"' + (canOpen ? ' onclick="openClassFeed(' + qid(c.id) + ')"' : '') + '>' + editBtns +
          '<div class="class-name">' + escHtml(c.name) + '</div>' +
          '<div class="class-meta">' + escHtml(c.teacher) + ' &bull; ' + escHtml(c.subject) + '</div>' +
          '<div class="class-stats">' +
          '<div class="class-stat"><div class="class-stat-val col-blue">' + enrolled + '</div><div class="class-stat-label">Enrolled</div></div>' +
          '<div class="class-stat"><div class="class-stat-val col-green">' + avgAtt + '%</div><div class="class-stat-label">Attendance</div></div>' +
          '<div class="class-stat"><div class="class-stat-val col-purple">' + avgSc + '</div><div class="class-stat-label">Avg Score</div></div>' +
          '</div></div>';
      }).join('');

      document.getElementById('scheduleBody').innerHTML = classes.map(function (c) {
        var enrolled = students.filter(function (s) { return s.class === c.name; }).length;
        var actions = editMode ? '<td><button class="btn btn-sm btn-ghost" onclick="openClassModal(' + qid(c.id) + ')">✏️</button> <button class="btn btn-sm btn-danger" onclick="deleteClass(' + qid(c.id) + ')">🗑</button></td>' : '';
        return '<tr>' +
          '<td><strong>' + escHtml(c.name) + '</strong></td>' +
          '<td>' + escHtml(c.teacher) + '</td>' +
          '<td>' + escHtml(c.day) + ' · ' + escHtml(c.time) + '</td>' +
          '<td>Room ' + escHtml(c.room) + '</td>' +
          '<td>' + enrolled + '/' + c.capacity + '</td>' +
          '<td><span class="badge badge-success">Active</span></td>' +
          actions +
          '</tr>';
      }).join('');
    }

    function openClassFeed(classId) {
      // Mở bảng tin của lớp (feed). Quyền xem đã được giới hạn theo vai trò:
      // admin thấy mọi lớp, GV lớp mình, HS lớp đã tham gia.
      currentClassId = classId;
      showSection('assignments');
    }

    function openClassModal(id) {
      var c = id ? classes.find(function (x) { return x.id === id; }) : null;
      var title = c ? 'Edit Class' : 'Add Class';
      var html = '<div class="modal-header"><h3>' + title + '</h3><button class="modal-close" onclick="closeModal()">✕</button></div>' +
        '<div class="modal-body">' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Class Name</label><input class="form-input" id="mClassName" value="' + (c ? escHtml(c.name) : '') + '"></div>' +
        '<div class="form-group"><label>Subject</label><select class="form-select" id="mClassSubject">' + _subjectOpts(c && c.subject) + '</select></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Teacher</label><input class="form-input" id="mClassTeacher" value="' + (c ? escHtml(c.teacher) : '') + '"></div>' +
        '<div class="form-group"><label>Room</label><input class="form-input" id="mClassRoom" value="' + (c ? escHtml(c.room) : '') + '"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Schedule (Day)</label><input class="form-input" id="mClassDay" value="' + (c ? escHtml(c.day) : '') + '"></div>' +
        '<div class="form-group"><label>Time</label><input class="form-input" id="mClassTime" value="' + (c ? escHtml(c.time) : '') + '"></div>' +
        '</div>' +
        '<div class="form-group"><label>Capacity</label><input class="form-input" type="number" id="mClassCap" value="' + (c ? c.capacity : 4) + '"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="saveClass(' + (id ? qid(id) : 'null') + ')">Save</button>' +
        '</div>';
      openModal(html);
    }

    function saveClass(id) {
      var name = document.getElementById('mClassName').value.trim();
      if (!name) { showToast('Class name is required.', 'error'); return; }
      var data = {
        name: name,
        subject: document.getElementById('mClassSubject').value,
        teacher: document.getElementById('mClassTeacher').value.trim(),
        room: document.getElementById('mClassRoom').value.trim(),
        day: document.getElementById('mClassDay').value.trim(),
        time: document.getElementById('mClassTime').value.trim(),
        capacity: parseInt(document.getElementById('mClassCap').value) || 4,
        color: document.getElementById('mClassSubject').value.toLowerCase(),
      };
      var dbRow = {
        name: data.name, subject: data.subject,
        schedule: (data.day + ' ' + data.time).trim(),
        room: data.room, max_students: data.capacity,
      };
      if (id) {
        var c = classes.find(function (x) { return x.id === id; });
        if (c) Object.assign(c, data);
        if (_db && _dbUserId && /-/.test(String(id))) {
          _db.from('classes').update(dbRow).eq('id', String(id))
            .then(function (r) { if (r.error) showToast('Lỗi lưu lớp: ' + r.error.message, 'error'); });
        }
        showToast('Đã cập nhật lớp.', 'success');
        closeModal(); renderClasses(); populateClassDropdowns();
      } else if (_db && _dbUserId) {
        dbRow.owner_id = _dbUserId;
        _db.from('classes').insert(dbRow).select().then(function (r) {
          if (r.error) { showToast('Lỗi tạo lớp: ' + r.error.message, 'error'); return; }
          data.id = (r.data && r.data[0]) ? r.data[0].id : nextClassId++;
          data.enrolled = 0;
          classes.push(data);
          showToast('Đã tạo lớp.', 'success');
          closeModal(); renderClasses(); populateClassDropdowns();
          if (currentSection === 'assignments') renderAssignments();
        });
      } else {
        data.id = nextClassId++;
        data.enrolled = 0;
        classes.push(data);
        showToast('Class added.', 'success');
        closeModal(); renderClasses();
      }
    }

    function deleteClass(id) {
      uiConfirm('Xóa lớp học này?', function () {
        classes = classes.filter(function (c) { return c.id !== id; });
        showToast('Đã xóa lớp.', 'success');
        renderClasses();
        if (_db && /-/.test(String(id))) {
          _db.from('classes').delete().eq('id', String(id))
            .then(function (r) { if (r.error) showToast('Lỗi xóa lớp: ' + r.error.message, 'error'); });
        }
        if (currentSection === 'assignments') renderAssignments();
      });
    }

