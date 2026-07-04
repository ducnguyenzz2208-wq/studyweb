    // ============================================================
    // NOTIFICATIONS
    // ============================================================
    function updateNotifBadge() {
      buildNotifications();
      var unread = notifications.filter(function (n) { return !n.read; }).length;
      var badge = document.getElementById('notifBadge');
      if (badge) {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'flex' : 'none';
      }
    }

    var _notifAutoReadTimer = null;

    function toggleNotifications() {
      var dd = document.getElementById('notifDropdown');
      var bd = document.getElementById('notifBackdrop');
      if (dd.classList.contains('open')) {
        closeNotifications();
      } else {
        if (_db) {
          loadNotifications();
        }
        renderNotifDropdown();
        dd.classList.add('open');
        bd.style.display = 'block';
        // Auto-mark all as read after 2 s — user has had time to see them
        clearTimeout(_notifAutoReadTimer);
        _notifAutoReadTimer = setTimeout(function () {
          var hadUnread = notifications.some(function (n) { return !n.read; });
          if (hadUnread) {
            if (_db) {
              markAllRead();
            } else {
              notifications.forEach(function (n) { _notifRead[n.id] = 1; });
              _saveNotifRead();
              updateNotifBadge();
              renderNotifDropdown();  // re-render with read styling
            }
          }
        }, 2000);
      }
    }

    function closeNotifications() {
      clearTimeout(_notifAutoReadTimer);
      document.getElementById('notifDropdown').classList.remove('open');
      document.getElementById('notifBackdrop').style.display = 'none';
    }

    function renderNotifDropdown() {
      buildNotifications();
      var unread = notifications.filter(function (n) { return !n.read; }).length;
      var html = '<div class="nd-header"><span class="nd-title">' + t('notif.title');
      if (unread) html += ' <span style="background:var(--accent);color:#fff;border-radius:10px;padding:1px 7px;font-size:11px;">' + unread + '</span>';
      html += '</span>';
      if (unread) html += '<span class="nd-mark" onclick="markAllRead()">' + t('notif.markAll') + '</span>';
      html += '</div>';
      if (!notifications.length) {
        html += '<div class="nd-empty">' + t('notif.empty') + '</div>';
      } else {
        notifications.forEach(function (n) {
          html += '<div class="nd-item' + (n.read ? '' : ' unread') + '" onclick="markNotifRead(' + qid(n.id) + ')" style="' + (n.read ? '' : 'font-weight:500;') + '">';
          html += '<div class="nd-dot' + (n.read ? ' read' : '') + '"></div>';
          html += '<div class="nd-body"><div class="nd-msg">' + n.icon + ' ' + escHtml(n.message) + '</div><div class="nd-time">' + n.time + '</div></div>';
          html += '</div>';
        });
      }
      document.getElementById('notifDropdown').innerHTML = html;
    }

    function markNotifRead(id) {
      if (_db) {
        _db.from('notifications').update({ is_read: true }).eq('id', String(id)).then(function (r) {
          if (r.error) { console.warn('markNotifRead error', r.error.message); return; }
          loadNotifications();
        });
      } else {
        _notifRead[id] = 1;
        _saveNotifRead();
        updateNotifBadge();
        renderNotifDropdown();
      }
    }

    function markAllRead() {
      clearTimeout(_notifAutoReadTimer);
      if (_db && _dbUserId) {
        _db.from('notifications').update({ is_read: true }).eq('user_id', _dbUserId).eq('is_read', false).then(function (r) {
          if (r.error) { console.warn('markAllRead error', r.error.message); return; }
          loadNotifications();
        });
      } else {
        notifications.forEach(function (n) { _notifRead[n.id] = 1; });
        _saveNotifRead();
        updateNotifBadge();
        renderNotifDropdown();
      }
    }

