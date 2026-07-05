    // ============================================================
    // SCHEDULE SECTION
    // ============================================================
    var currentCalendarDate = new Date();
    var calMode = 'month';        // 'month' | 'week'
    var calSelectedDate = null;   // 'YYYY-MM-DD' ngày đang chọn ở lịch tháng

    // Ngày dạng YYYY-MM-DD theo GIỜ ĐỊA PHƯƠNG (tránh lệch 1 ngày do toISOString/UTC)
    function ymd(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function getMonday(d) {
      var date = new Date(d);
      var day = date.getDay();
      var diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff));
    }

    function setCalMode(m) { calMode = m; renderSchedule(); }

    function changeCalendarWeek(offset) {
      currentCalendarDate.setDate(currentCalendarDate.getDate() + offset * 7);
      renderSchedule();
    }

    function changeCalendarMonth(offset) {
      currentCalendarDate.setDate(1);
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
      renderSchedule();
    }

    function setCalendarToday() {
      currentCalendarDate = new Date();
      calSelectedDate = ymd(currentCalendarDate);
      renderSchedule();
    }

    function selectCalDay(dateStr) {
      calSelectedDate = dateStr;
      renderSchedule();
    }

    // Buổi học đã lọc theo VAI TRÒ (đúng yêu cầu: HV/PH chỉ thấy lớp mình/con;
    // GV/Admin thấy buổi mình phụ trách — loadSchedule đã lọc owner_id).
    function _schedItemsForUser() {
      var items = scheduleItems;
      if (currentUser && currentUser.role === 'Student') {
        var sc = students.find(function (s) { return s.id === currentUser.studentId; });
        items = sc ? scheduleItems.filter(function (i) { return i.class === sc.class; }) : [];
      } else if (currentUser && currentUser.role === 'Parent') {
        var linked = students.find(function (s) { return s.id === currentUser.linkedStudentId; });
        items = linked ? scheduleItems.filter(function (i) { return i.class === linked.class; }) : [];
      }
      if (currentSchedFilter !== 'All') {
        items = items.filter(function (i) { return i.status === currentSchedFilter; });
      }
      return items;
    }

    function _schedStatusCls(status) {
      var s = (status || '').toLowerCase();
      return s === 'completed' ? 'is-done' : s === 'canceled' ? 'is-cancel' : 'is-up';
    }

    function openScheduleModalWithDate(dateStr) {
      openScheduleModal(null, dateStr);
    }

    // Dispatcher: thanh công cụ chung + lịch Tháng (mặc định) hoặc Tuần.
    function renderSchedule() {
      if (!document.getElementById('schedList')) return;
      var items = _schedItemsForUser();
      var isTA = currentUser && (currentUser.role === 'Teacher' || currentUser.role === 'Admin');

      var title;
      if (calMode === 'month') {
        title = currentCalendarDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
        title = title.charAt(0).toUpperCase() + title.slice(1);
      } else {
        var mon = getMonday(currentCalendarDate);
        var sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        title = 'Tuần ' + mon.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) +
          ' – ' + sun.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      }
      var chevL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
      var chevR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
      var navFn = calMode === 'month' ? 'changeCalendarMonth' : 'changeCalendarWeek';

      var html = '<div class="cal-toolbar">';
      html += '<div class="cal-title">' + title + '</div>';
      html += '<div class="cal-toolbar-right">';
      html += '<div class="cal-mode-toggle" role="tablist">' +
        '<button class="cal-mode-btn' + (calMode === 'month' ? ' active' : '') + '" onclick="setCalMode(\'month\')">Tháng</button>' +
        '<button class="cal-mode-btn' + (calMode === 'week' ? ' active' : '') + '" onclick="setCalMode(\'week\')">Tuần</button></div>';
      html += '<div class="cal-nav-btns">' +
        '<button class="cal-navbtn" onclick="' + navFn + '(-1)" aria-label="Trước">' + chevL + '</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="setCalendarToday()">Hôm nay</button>' +
        '<button class="cal-navbtn" onclick="' + navFn + '(1)" aria-label="Sau">' + chevR + '</button></div>';
      html += '</div></div>';

      html += (calMode === 'month') ? _monthHtml(items, isTA) : _weekHtml(items);
      document.getElementById('schedList').innerHTML = html;
    }

    // ── LỊCH THÁNG ────────────────────────────────────────────────
    function _monthHtml(items, isTA) {
      var y = currentCalendarDate.getFullYear(), m = currentCalendarDate.getMonth();
      var first = new Date(y, m, 1);
      var startDow = (first.getDay() + 6) % 7;            // Thứ Hai = 0
      var gridStart = new Date(y, m, 1 - startDow);
      var todayStr = ymd(new Date());

      var byDate = {};
      items.forEach(function (ev) { (byDate[ev.date] = byDate[ev.date] || []).push(ev); });

      // Chọn ngày mặc định: hôm nay (nếu trong tháng) → ngày đầu có buổi → mùng 1
      if (!calSelectedDate || new Date(calSelectedDate).getMonth() !== m || new Date(calSelectedDate).getFullYear() !== y) {
        var todayInMonth = (new Date().getMonth() === m && new Date().getFullYear() === y);
        if (todayInMonth) calSelectedDate = todayStr;
        else {
          var firstWith = Object.keys(byDate).filter(function (d) { return new Date(d).getMonth() === m && new Date(d).getFullYear() === y; }).sort()[0];
          calSelectedDate = firstWith || ymd(first);
        }
      }

      var dow = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      var html = '<div class="cal-month-wrap"><div class="cal-month-card"><div class="cal-month">';
      dow.forEach(function (d) { html += '<div class="cal-dow">' + d + '</div>'; });

      for (var i = 0; i < 42; i++) {
        var d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
        var ds = ymd(d);
        var other = d.getMonth() !== m;
        var evs = (byDate[ds] || []).slice().sort(function (a, b) { return a.time.localeCompare(b.time); });
        var cls = 'cal-cell';
        if (other) cls += ' other';
        if (ds === todayStr) cls += ' today';
        if (ds === calSelectedDate) cls += ' selected';
        html += '<div class="' + cls + '" onclick="selectCalDay(' + qid(ds) + ')">';
        html += '<div class="cal-daynum">' + d.getDate() + '</div>';
        if (evs.length) {
          html += '<div class="cal-cell-pills">';
          evs.slice(0, 2).forEach(function (ev) {
            html += '<span class="cal-pill ' + _schedStatusCls(ev.status) + '">' + escHtml(ev.time) + ' ' + escHtml(ev.class) + '</span>';
          });
          if (evs.length > 2) html += '<span class="cal-pill-more">+' + (evs.length - 2) + ' nữa</span>';
          html += '</div>';
        }
        html += '</div>';
      }
      html += '</div></div>';                              // .cal-month .cal-month-card
      html += _dayPanel(byDate[calSelectedDate] || [], calSelectedDate, isTA);
      html += '</div>';                                     // .cal-month-wrap
      return html;
    }

    // Panel bên phải: buổi học của ngày đang chọn
    function _dayPanel(evs, ds, isTA) {
      evs = evs.slice().sort(function (a, b) { return a.time.localeCompare(b.time); });
      var dObj = ds ? new Date(ds + 'T00:00:00') : new Date();
      var dayName = dObj.toLocaleDateString('vi-VN', { weekday: 'long' });
      dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      var dateLbl = dObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

      var html = '<aside class="cal-daypanel"><div class="cal-daypanel-head">';
      html += '<div><div class="cal-daypanel-day">' + dayName + '</div><div class="cal-daypanel-date">Ngày ' + dateLbl + '</div></div>';
      if (isTA) html += '<button class="cal-navbtn" onclick="openScheduleModalWithDate(' + qid(ds) + ')" title="Thêm buổi" aria-label="Thêm buổi">' + svgIcon('file-plus', 16) + '</button>';
      html += '</div>';

      if (!evs.length) {
        html += '<div class="cal-daypanel-empty">Không có buổi học' + (isTA ? '. Bấm + để thêm.' : '.') + '</div>';
      } else {
        html += '<div class="cal-daypanel-list">';
        evs.forEach(function (ev) {
          html += '<button class="cal-session" onclick="openScheduleModal(' + ev.id + ')">';
          html += '<span class="cal-session-time">' + escHtml(ev.time) + '</span>';
          html += '<span class="cal-session-body"><span class="cal-session-title">' + escHtml(ev.class) + '</span>';
          html += '<span class="cal-session-sub">' + escHtml(ev.teacher || '') + (ev.room ? ' · P.' + escHtml(ev.room) : '') + '</span></span>';
          html += '<span class="cal-dot ' + _schedStatusCls(ev.status) + '"></span></button>';
        });
        html += '</div>';
      }
      html += '</aside>';
      return html;
    }

    // ── LỊCH TUẦN (giữ nguyên hành vi cũ) ─────────────────────────
    function _weekHtml(items) {
      var monday = getMonday(currentCalendarDate);
      var weekDates = [];
      for (var i = 0; i < 7; i++) { var d = new Date(monday); d.setDate(monday.getDate() + i); weekDates.push(d); }
      var dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
      var todayStr = ymd(new Date());
      var html = '<div class="cal-week-grid">';
      weekDates.forEach(function (date, index) {
        var dateStr = ymd(date);
        var isToday = dateStr === todayStr;
        var dayEvents = items.filter(function (ev) { return ev.date === dateStr; });
        dayEvents.sort(function (a, b) { return a.time.localeCompare(b.time); });
        html += '<div class="cal-day-col' + (isToday ? ' today' : '') + '">';
        html += '  <div class="cal-day-header"><span class="cal-day-name">' + dayNames[index] + '</span>';
        html += '    <div style="display:flex;align-items:center;gap:6px;"><span class="cal-day-date">' + date.getDate() + '/' + (date.getMonth() + 1) + '</span>';
        if (editMode && (currentUser.role === 'Teacher' || currentUser.role === 'Admin')) {
          html += '<button class="cal-add-btn" onclick="openScheduleModalWithDate(' + qid(dateStr) + ')" title="Thêm buổi học">+</button>';
        }
        html += '</div></div>';
        if (dayEvents.length === 0) {
          html += '  <div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;font-style:italic;min-height:80px;">Trống</div>';
        } else {
          dayEvents.forEach(function (ev) {
            html += '<div class="cal-event-card" onclick="openScheduleModal(' + ev.id + ')">';
            html += '  <div class="cal-event-time">' + ev.time + '</div>';
            html += '  <div class="cal-event-title">' + escHtml(ev.class) + '</div>';
            html += '  <div class="cal-event-details">' + escHtml(ev.teacher) + ' · P.' + escHtml(ev.room) + '</div>';
            html += '  <span class="sched-status sched-' + ev.status.toLowerCase() + '">' + ev.status + '</span>';
            html += '</div>';
          });
        }
        html += '</div>';
      });
      html += '</div>';
      return html;
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
      uiConfirm('Xóa buổi học này?', function () {
        var s = scheduleItems.find(function (x) { return x.id === id; });
        scheduleItems = scheduleItems.filter(function (x) { return x.id !== id; });
        showToast('Đã xóa buổi học.', 'success');
        closeModal();
        renderSchedule();
        if (_db && s && s.dbId) {
          _db.from('schedule_events').delete().eq('id', s.dbId)
            .then(function (r) { if (r.error) showToast('Lỗi xóa lịch: ' + r.error.message, 'error'); });
        }
      });
    }

