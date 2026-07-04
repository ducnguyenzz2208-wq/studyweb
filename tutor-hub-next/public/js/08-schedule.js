    // ============================================================
    // SCHEDULE SECTION
    // ============================================================
    var currentCalendarDate = new Date();

    function getMonday(d) {
      var date = new Date(d);
      var day = date.getDay();
      var diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff));
    }

    function changeCalendarWeek(offset) {
      currentCalendarDate.setDate(currentCalendarDate.getDate() + offset * 7);
      renderSchedule();
    }

    function setCalendarToday() {
      currentCalendarDate = new Date();
      renderSchedule();
    }

    function openScheduleModalWithDate(dateStr) {
      openScheduleModal(null, dateStr);
    }

    function renderSchedule() {
      var monday = getMonday(currentCalendarDate);
      var weekDates = [];
      for (var i = 0; i < 7; i++) {
        var d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDates.push(d);
      }

      var mondayStr = monday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      var sundayStr = weekDates[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      var rangeText = "Tuần: " + mondayStr + " - " + sundayStr;

      var items = scheduleItems;
      if (currentUser && currentUser.role === 'Student') {
        var sc = students.find(function (s) { return s.id === currentUser.studentId; });
        if (sc) items = scheduleItems.filter(function (i) { return i.class === sc.class; });
      } else if (currentUser && currentUser.role === 'Parent') {
        var linked = students.find(function (s) { return s.id === currentUser.linkedStudentId; });
        if (linked) items = scheduleItems.filter(function (i) { return i.class === linked.class; });
      }
      if (currentSchedFilter !== 'All') {
        items = items.filter(function (i) { return i.status === currentSchedFilter; });
      }

      var html = '';

      // 1. Navigation Bar
      html += '<div class="cal-nav-bar">';
      html += '  <div class="cal-nav-title">' + rangeText + '</div>';
      html += '  <div class="cal-nav-btns">';
      html += '    <button class="btn btn-ghost btn-sm" onclick="changeCalendarWeek(-1)">◀ Tuần trước</button>';
      html += '    <button class="btn btn-ghost btn-sm" onclick="setCalendarToday()">Hôm nay</button>';
      html += '    <button class="btn btn-ghost btn-sm" onclick="changeCalendarWeek(1)">Tuần sau ▶</button>';
      html += '  </div>';
      html += '</div>';

      // 2. Week Grid
      html += '<div class="cal-week-grid">';
      var dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
      var todayStr = new Date().toISOString().split('T')[0];

      weekDates.forEach(function (date, index) {
        var dateStr = date.toISOString().split('T')[0];
        var isToday = dateStr === todayStr;
        var dayEvents = items.filter(function (ev) { return ev.date === dateStr; });
        dayEvents.sort(function (a, b) { return a.time.localeCompare(b.time); });

        var dateLabel = date.getDate() + '/' + (date.getMonth() + 1);

        html += '<div class="cal-day-col' + (isToday ? ' today' : '') + '">';
        html += '  <div class="cal-day-header">';
        html += '    <span class="cal-day-name">' + dayNames[index] + '</span>';
        html += '    <div style="display:flex;align-items:center;gap:6px;">';
        html += '      <span class="cal-day-date">' + dateLabel + '</span>';
        if (editMode && (currentUser.role === 'Teacher' || currentUser.role === 'Admin')) {
          html += '    <button class="cal-add-btn" onclick="openScheduleModalWithDate(' + qid(dateStr) + ')" title="Thêm buổi học">+</button>';
        }
        html += '    </div>';
        html += '  </div>';

        if (dayEvents.length === 0) {
          html += '  <div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;font-style:italic;min-height:80px;">Trống</div>';
        } else {
          dayEvents.forEach(function (ev) {
            var statusCls = 'sched-' + ev.status.toLowerCase();
            html += '<div class="cal-event-card" onclick="openScheduleModal(' + ev.id + ')">';
            html += '  <div class="cal-event-time">' + ev.time + '</div>';
            html += '  <div class="cal-event-title">' + escHtml(ev.class) + '</div>';
            html += '  <div class="cal-event-details">' + escHtml(ev.teacher) + ' · P.' + escHtml(ev.room) + '</div>';
            html += '  <span class="sched-status ' + statusCls + '">' + ev.status + '</span>';
            html += '</div>';
          });
        }
        html += '</div>';
      });

      html += '</div>';

      document.getElementById('schedList').innerHTML = html;
    }

    function filterSched(filter, btn) {
      currentSchedFilter = filter;
      document.querySelectorAll('.sched-filters .tab').forEach(function (b) { b.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      renderSchedule();
    }

    function openScheduleModal(id, dateStr) {
      var s = id ? scheduleItems.find(function (x) { return x.id === id; }) : null;
      var defaultDate = dateStr || new Date().toISOString().split('T')[0];
      var html = '<h3 style="margin-bottom:20px;">' + (s ? 'Cập nhật lịch học' : 'Thêm buổi học') + '</h3>';
      html += '<div class="form-group"><label>Lớp học</label><select id="mSchedClass" class="filter-select" style="width:100%">';
      classes.forEach(function (c) { html += '<option' + (s && s.class === c.name ? ' selected' : '') + '>' + c.name + '</option>'; });
      html += '</select></div>';
      html += '<div class="form-group"><label>Giáo viên</label><input id="mSchedTeacher" class="settings-input" style="width:100%" value="' + (s ? s.teacher : 'Ms. Thompson') + '"></div>';
      html += '<div class="form-group"><label>Ngày học</label><input type="date" id="mSchedDate" class="settings-input" style="width:100%" value="' + (s ? s.date : defaultDate) + '"></div>';
      html += '<div class="form-group"><label>Giờ học (ví dụ: 14:00)</label><input id="mSchedTime" class="settings-input" style="width:100%" value="' + (s ? s.time : '14:00') + '"></div>';
      html += '<div class="form-group"><label>Phòng học</label><input id="mSchedRoom" class="settings-input" style="width:100%" value="' + (s ? s.room : '101') + '"></div>';
      html += '<div class="form-group"><label>Trạng thái</label><select id="mSchedStatus" class="filter-select" style="width:100%">';
      ['Upcoming', 'Completed', 'Canceled'].forEach(function (st) { html += '<option' + (s && s.status === st ? ' selected' : '') + '>' + st + '</option>'; });
      html += '</select></div>';
      html += '<div class="form-group"><label>Ghi chú</label><input id="mSchedNotes" class="settings-input" style="width:100%" value="' + (s ? s.notes : '') + '"></div>';
      html += '<div style="display:flex;gap:8px;margin-top:20px;">';
      html += '<button class="btn btn-primary" onclick="saveSchedule(' + (s ? s.id : 'null') + ')">Lưu</button>';
      html += '<button class="btn btn-ghost" onclick="closeModal()">Hủy</button>';
      if (s) html += '<button class="btn btn-danger" onclick="deleteSchedule(' + s.id + ')">Xóa</button>';
      html += '</div>';
      openModal(html);
    }

    function loadSchedule() {
      if (!_db || !_dbUserId) return;
      // GV/Admin: buổi do mình tạo. HV/PH: RLS trả về buổi của lớp mình/lớp con.
      var q = _db.from('schedule_events').select('*');
      if (currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin')) {
        q = q.eq('owner_id', _dbUserId);
      }
      q.order('date', { ascending: true })
        .then(function (r) {
          if (r.error) { console.warn('load schedule', r.error.message); return; }
          scheduleItems = (r.data || []).map(function (e) {
            return {
              id: nextSchedId++, dbId: e.id,
              class: e.class_name || e.title || '', teacher: e.teacher || '',
              date: e.date || '', time: e.time || '', room: e.room || '',
              status: e.status || 'Upcoming', notes: e.notes || '', duration: e.duration || 60
            };
          });
          if (currentSection === 'schedule') renderSchedule();
          try { updateNotifBadge(); } catch (e) { }
        });
    }

    function saveSchedule(id) {
      var data = {
        class: document.getElementById('mSchedClass').value,
        teacher: document.getElementById('mSchedTeacher').value,
        date: document.getElementById('mSchedDate').value,
        time: document.getElementById('mSchedTime').value,
        room: document.getElementById('mSchedRoom').value,
        status: document.getElementById('mSchedStatus').value,
        notes: document.getElementById('mSchedNotes').value,
        duration: 60
      };
      var dbRow = {
        title: data.class, class_name: data.class, teacher: data.teacher,
        subject: '', date: data.date, time: data.time, room: data.room,
        status: data.status, type: data.status, notes: data.notes, duration: data.duration
      };
      if (id) {
        var s = scheduleItems.find(function (x) { return x.id === id; });
        if (s) Object.assign(s, data);
        if (_db && _dbUserId && s && s.dbId) {
          _db.from('schedule_events').update(dbRow).eq('id', s.dbId)
            .then(function (r) { if (r.error) showToast('Lỗi lưu lịch: ' + r.error.message, 'error'); });
        }
        showToast('Đã cập nhật buổi học.', 'success');
        closeModal(); renderSchedule();
      } else if (_db && _dbUserId) {
        dbRow.owner_id = _dbUserId;
        _db.from('schedule_events').insert(dbRow).select().then(function (r) {
          if (r.error) { showToast('Lỗi thêm buổi học: ' + r.error.message, 'error'); return; }
          data.id = nextSchedId++;
          data.dbId = (r.data && r.data[0]) ? r.data[0].id : null;
          scheduleItems.push(data);
          showToast('Đã thêm buổi học.', 'success');
          closeModal(); renderSchedule();
        });
      } else {
        data.id = nextSchedId++;
        scheduleItems.push(data);
        showToast('Session added.', 'success');
        closeModal(); renderSchedule();
      }
    }

    function deleteSchedule(id) {
      if (!confirm('Xóa buổi học này?')) return;
      var s = scheduleItems.find(function (x) { return x.id === id; });
      scheduleItems = scheduleItems.filter(function (x) { return x.id !== id; });
      showToast('Đã xóa buổi học.', 'success');
      closeModal();
      renderSchedule();
      if (_db && s && s.dbId) {
        _db.from('schedule_events').delete().eq('id', s.dbId)
          .then(function (r) { if (r.error) showToast('Lỗi xóa lịch: ' + r.error.message, 'error'); });
      }
    }

