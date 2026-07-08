    var _dbLoading = false;   // true trong lúc loadDbData() đang tải → hiện skeleton
    var _dbError = {};        // lỗi tải theo section (RLS/500/mạng) → hiện errorBlock thay bảng trắng

    // Tải lại toàn bộ dữ liệu khi người dùng bấm "Thử lại" ở trạng thái lỗi.
    function retryLoad() {
      _dbError = {};
      _rerenderAfterLoad();
      loadDbData();
    }

    // Gói thông báo lỗi tải dữ liệu thành câu tiếng Việt dễ hiểu (RLS/500/mạng).
    function _dbErrMsg(err) {
      if (_isAuthError(err)) { _onDbAuthError(); return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'; }
      var m = (err && (err.message || err.msg) || '').toLowerCase();
      if (m.indexOf('row-level security') !== -1 || m.indexOf('permission') !== -1 || m.indexOf('rls') !== -1 || (err && err.code === '42501'))
        return 'Bạn không có quyền xem mục này, hoặc phiên đăng nhập đã hết hạn. Hãy thử đăng nhập lại.';
      if (m.indexOf('fetch') !== -1 || m.indexOf('network') !== -1 || m.indexOf('failed to') !== -1)
        return 'Lỗi kết nối mạng. Kiểm tra Internet rồi thử lại.';
      return (err && (err.message || err.msg)) || 'Đã xảy ra lỗi khi tải dữ liệu.';
    }

    // ── PHIÊN HẾT HẠN (token iframe hết hạn ~1h) ─────────────────
    // Chủ động làm mới token định kỳ để tránh 401 âm thầm; nếu không làm mới
    // được nữa → hiện lớp phủ mời đăng nhập lại thay vì bảng trắng im lặng.
    var _sessionGuardStarted = false, _sessionExpiredShown = false, _authRefreshInFlight = false, _relogging = false;
    function _isAuthError(err) {
      if (!err) return false;
      var m = (err.message || err.msg || '').toLowerCase();
      return err.status === 401 || err.code === 'PGRST301' ||
        m.indexOf('jwt') !== -1 || m.indexOf('token is expired') !== -1 ||
        m.indexOf('invalid token') !== -1 || m.indexOf('not authenticated') !== -1;
    }
    // Lỗi làm mới token KHÔNG thể phục hồi (HTTP 400): refresh token đã hết hạn,
    // hoặc bị xoay vòng (iframe & Next.js dùng chung 1 token — khi bên này refresh,
    // token bên kia thành "đã dùng"). Cứ retry thì spam 400 vô hạn (xem F12).
    function _isRefresh400(err) {
      if (!err) return false;
      if (err.status === 400) return true;
      var m = (err.message || err.msg || '').toLowerCase();
      return m.indexOf('refresh token') !== -1 || m.indexOf('invalid refresh') !== -1 ||
        m.indexOf('already used') !== -1 || m.indexOf('refresh_token_not_found') !== -1;
    }
    function reloginNow() {
      try { if (window.parent !== window) { window.parent.postMessage({ type: 'TUTOR_HUB_LOGOUT' }, window.location.origin); return; } } catch (e) { }
      location.reload();
    }
    // Ngắt DỨT vòng lặp refresh 400 rồi reset session sạch qua Next.js.
    // Gọi 1 lần duy nhất; dừng auto-refresh của supabase-js để hết spam ngay.
    function _breakAndRelogin() {
      if (_relogging) return; _relogging = true;
      try { if (_db && _db.auth && _db.auth.stopAutoRefresh) _db.auth.stopAutoRefresh(); } catch (e) { }
      reloginNow();  // phát TUTOR_HUB_LOGOUT → parent signOut + về /login
    }
    function _showSessionExpired() {
      if (_sessionExpiredShown) return; _sessionExpiredShown = true;
      var el = document.createElement('div');
      el.id = 'sessionExpiredOverlay';
      el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(15,22,35,0.72);';
      el.innerHTML = '<div style="background:var(--card-bg,#fff);color:var(--text,#1e2437);max-width:380px;width:90%;border-radius:16px;padding:28px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);">' +
        '<div style="font-size:38px;margin-bottom:8px;">🔒</div>' +
        '<div style="font-weight:700;font-size:18px;margin-bottom:6px;">Phiên đăng nhập đã hết hạn</div>' +
        '<div style="font-size:14px;color:var(--text-muted,#64748b);line-height:1.55;margin-bottom:20px;">Vì lý do bảo mật, bạn cần đăng nhập lại để tiếp tục.</div>' +
        '<button onclick="reloginNow()" style="width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#4f46e5,#6d28d9);color:#fff;font-weight:700;font-size:15px;cursor:pointer;">Đăng nhập lại</button>' +
        '</div>';
      document.body.appendChild(el);
    }
    function _onDbAuthError() {
      if (_authRefreshInFlight || _sessionExpiredShown || _relogging) return;
      if (!_db || !_db.auth || !_db.auth.refreshSession) { _showSessionExpired(); return; }
      _authRefreshInFlight = true;
      _db.auth.refreshSession().then(function (r) {
        _authRefreshInFlight = false;
        if (r && !r.error && r.data && r.data.session) { _dbError = {}; loadDbData(); }
        else if (r && r.error && _isRefresh400(r.error)) _breakAndRelogin(); // 400 → ngắt loop + relogin
        else _showSessionExpired();
      }).catch(function (e) {
        _authRefreshInFlight = false;
        if (_isRefresh400(e)) _breakAndRelogin(); else _showSessionExpired();
      });
    }
    function startSessionGuard() {
      if (_sessionGuardStarted || !_db || !_db.auth || !_db.auth.refreshSession) return;
      _sessionGuardStarted = true;
      // supabase-js tự refresh token nền; khi refresh token hỏng/xoay vòng nó phát
      // 'SIGNED_OUT'. Bắt sự kiện này để NGẮT vòng lặp 400 và reset session sạch.
      try {
        if (_db.auth.onAuthStateChange) {
          _db.auth.onAuthStateChange(function (event) {
            if (event === 'SIGNED_OUT') _breakAndRelogin();
          });
        }
      } catch (e) { }
      // Làm mới token định kỳ (token sống ~1h) để tránh 401 âm thầm khi dùng lâu.
      setInterval(function () {
        _db.auth.refreshSession().then(function (r) {
          if (r && r.error) { if (_isRefresh400(r.error)) _breakAndRelogin(); else _showSessionExpired(); }
        }).catch(function () { });
      }, 15 * 60 * 1000);
      // Quay lại tab sau khi để lâu → làm mới ngay.
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') _db.auth.refreshSession().catch(function () { });
      });
    }

    // ── DATA PERSISTENCE HELPERS ─────────────────────────────────
    function dbSave(table, payload, matchCol) {
      if (!_db || !_dbUserId) return Promise.resolve();
      if (matchCol) {
        return _db.from(table).upsert(payload, { onConflict: matchCol }).then(function (r) { if (r.error) console.warn('db save', table, r.error.message); });
      }
      return _db.from(table).upsert(payload).then(function (r) { if (r.error) console.warn('db save', table, r.error.message); });
    }

    function dbDelete(table, id) {
      if (!_db) return Promise.resolve();
      return _db.from(table).delete().eq('id', id).then(function (r) { if (r.error) console.warn('db del', table, r.error.message); });
    }

    // Ghi nhật ký hoạt động (best-effort). Server (RPC log_audit) tự lấy actor =
    // auth.uid() và chỉ ghi nếu là Teacher/Admin — client không cần kiểm quyền.
    // Không bao giờ chặn luồng chính nếu ghi log lỗi.
    var _auditOff = false;   // tắt ghi log nếu hàm log_audit chưa có (migration 020 chưa chạy) → hết spam 404
    function logAudit(action, entity, detail) {
      if (!_db || !_dbUserId || _auditOff) return;
      try {
        _db.rpc('log_audit', { _action: action, _entity: entity || null, _detail: detail || null })
          .then(function (r) {
            if (r && r.error) {
              if (/not find|does not exist|schema cache|404/i.test(r.error.message || '')) _auditOff = true; // hàm chưa có → ngừng gọi
              else console.warn('audit log', r.error.message);
            }
          });
      } catch (e) { }
    }

    // Pull all user data from Supabase and overwrite in-memory arrays
    function loadMaterials() {
      if (!_db) return;
      _db.from('materials').select('*').order('created_at', { ascending: false })
        .then(function (r) {
          if (r.error) {
            console.error('loadMaterials error:', r.error);
            _dbError.materials = _dbErrMsg(r.error);
            if (currentSection === 'materials') renderMaterials();
            return;
          }
          delete _dbError.materials;
          materials = (r.data || []).map(function (m) {
            return {
              id: m.id, title: m.title, subject: m.subject || '',
              class: m.class_name || '', type: m.type || 'PDF',
              description: m.description || '', content: m.content || '',
              fileName: m.file_name || '', pinned: !!m.pinned,
              downloadUrl: m.file_url || m.url || '',
              uploadDate: (m.created_at || '').split('T')[0],
              ownerId: m.owner_id
            };
          });
          if (currentSection === 'materials') renderMaterials();
        });
    }

    function _mapStudentRow(s) {
      return {
        id: s.id, name: s.name, email: s.email || '', class: s.class_name || '',
        grade: s.grade || '', mathScore: s.math_score || 0, engScore: s.eng_score || 0,
        attendance: s.attendance || 0, gender: 'M', paymentStatus: 'Pending'
      };
    }

    // Render lại section đang xem sau khi tải xong (cho các section có skeleton).
    function _rerenderAfterLoad() {
      try {
        if (currentSection === 'students') renderStudents();
        else if (currentSection === 'materials') renderMaterials();
        else if (currentSection === 'flashcards') renderDecks();
        else if (currentSection === 'classes') renderClasses();
        else if (currentSection === 'payments') renderPayments();
        else if (currentSection === 'schedule') renderSchedule();
        else if (currentSection === 'attendance') renderAttendance();
        else if (currentSection === 'assignments') renderAssignments();
      } catch (e) { }
    }

    function loadDbData() {
      if (!_db || !_dbUserId) return;

      // Hiện skeleton trong lúc tải; tự tắt sau 1.4s (các loader xong sớm sẽ render đè trước đó).
      _dbLoading = true;
      _dbError = {};   // xoá lỗi cũ trước mỗi lần tải lại
      startSessionGuard();   // chủ động làm mới token, tránh 401 âm thầm khi dùng lâu
      _rerenderAfterLoad();
      setTimeout(function () { _dbLoading = false; _rerenderAfterLoad(); }, 1400);

      // "Chỉ dữ liệu thật" — bỏ toàn bộ data demo khi đã kết nối DB.
      // Các mảng bên dưới sẽ được nạp lại từ Supabase; nếu chưa có gì thì để trống.
      students = [];
      classes = [];
      scheduleItems = [];
      schedule = [];
      payments = [];
      homework = [];
      flashcardDecks = [];
      assignments = [];
      submissions = [];
      assignmentComments = [];
      attendanceRecords = [];
      populateClassDropdowns();
      populateSubjectDropdowns();

      // Materials — load all visible (RLS controls access per role)
      loadMaterials();

      // Payments — RLS: admin sees all, others see only their own
      loadPayments();

      // Attendance — RLS: admin all, teacher own+own classes, student own
      loadAttendance();

      // Notifications — load from DB & subscribe to real-time updates
      loadNotifications();
      subscribeNotifications();

      // Yêu cầu vào lớp chờ duyệt (GV/Admin) — cho thông báo
      if (currentUser.role === 'Teacher' || currentUser.role === 'Admin') {
        _db.from('enrollment_requests').select('*, classes(name)').eq('status', 'pending')
          .then(function (r) {
            if (r.error || !r.data) return;
            enrollmentRequests = r.data.map(function (q) {
              return { id: q.id, studentName: q.student_name || '', studentEmail: q.student_email || '', className: (q.classes && q.classes.name) || '', createdAt: (q.created_at || '').split('T')[0] };
            });
            updateNotifBadge();
          });
      }

      // Flashcard decks + cards
      _db.from('flashcard_decks').select('*, flashcards(*)').eq('owner_id', _dbUserId)
        .then(function (r) {
          if (r.error) { _dbError.flashcards = _dbErrMsg(r.error); if (currentSection === 'flashcards') renderDecks(); return; }
          delete _dbError.flashcards;
          if (r.data && r.data.length) {
            // Giữ id số nguyên cho UI (onclick an toàn), lưu dbId=UUID cho thao tác DB
            flashcardDecks = r.data.map(function (d) {
              return {
                id: nextDeckId++, dbId: d.id, title: d.name, subject: d.subject || '', class: '', tags: [],
                lastUpdated: (d.updated_at || d.created_at || '').split('T')[0],
                cards: (d.flashcards || []).map(function (c) {
                  return { id: nextCardId++, dbId: c.id, front: c.front, back: c.back, hint: '', example: '', difficulty: c.difficulty || 'medium', isFavorite: !!c.is_favorite, rating: c.rating || 0 };
                })
              };
            });
            if (currentSection === 'flashcards') renderDecks();
          }
        });

      // Schedule (nạp vào scheduleItems — mảng mà UI dùng)
      loadSchedule();

      // Teacher / Admin: load classes, students, homework
      if (currentUser.role === 'Teacher' || currentUser.role === 'Admin') {
        // Admin: đọc TẤT CẢ lớp (RLS 008). Teacher: chỉ lớp mình sở hữu.
        var clsQ = _db.from('classes').select('*');
        if (currentUser.role === 'Teacher') clsQ = clsQ.eq('owner_id', _dbUserId);
        clsQ.then(function (r) {
            if (!r.error && r.data && r.data.length) {
              classes = r.data.map(function (c) {
                return { id: c.id, name: c.name, subject: c.subject || '', teacher: c.teacher || '', schedule: c.schedule || '', day: c.schedule || '', time: '', room: c.room || '', capacity: c.max_students || 30, maxStudents: c.max_students || 30, color: (c.subject || '').toLowerCase(), termStart: c.term_start || '', termWeeks: c.term_weeks || 0 };
              });
              populateClassDropdowns();
              if (currentSection === 'classes') renderClasses();
              if (currentSection === 'assignments') renderAssignments();
              if (currentSection === 'dashboard') { try { renderDashboard(); } catch (e) { } }
            }
          });

        _db.from('students').select('*').eq('owner_id', _dbUserId)
          .then(function (r) {
            if (r.error) {
              _dbError.students = _dbErrMsg(r.error);
              if (currentSection === 'students') renderStudents();
              return;
            }
            if (r.data) {
              delete _dbError.students;
              students = r.data.map(_mapStudentRow);
              if (currentSection === 'students') renderStudents();
              if (currentSection === 'dashboard') { try { renderDashboard(); } catch (e) { } }
              var kpi = document.getElementById('kpiStudents'); if (kpi) kpi.textContent = students.length;
            }
          });

        _db.from('homework').select('*').eq('owner_id', _dbUserId)
          .then(function (r) {
            if (!r.error && r.data && r.data.length) {
              homework = r.data.map(function (h) {
                return { id: h.id, title: h.title, subject: h.subject || '', class: h.class_name || '', due: h.due_date || '', status: h.status || 'pending', submitted: h.submitted || 0, total: h.total || 0 };
              });
            }
          });

      }

      // Nhận xét học viên — mọi vai trò (RLS: GV của mình, HS/PH về mình/con, admin all)
      _db.from('teacher_comments').select('*').order('date', { ascending: false })
        .then(function (r) {
          if (!r.error && r.data) {
            teacherComments = r.data.map(function (c) {
              return { id: c.id, studentId: c.student_id, studentName: c.student_name || '', teacher: c.teacher_name || 'Giáo viên', text: c.comment || '', category: c.type || 'progress', date: c.date || '' };
            });
            if (currentSection === 'student-portal') { try { renderStudentPortal(); } catch (e) { } }
            if (currentSection === 'parent-portal') { try { renderParentPortal(); } catch (e) { } }
          }
        });

      // Student / Parent: load the classes they belong to (via class_members),
      // so the feed sidebar can show their classes.
      if (currentUser.role === 'Student' || currentUser.role === 'Parent') {
        _db.from('class_members').select('class_id').eq('user_id', _dbUserId)
          .then(function (r) {
            if (r.error || !r.data || !r.data.length) return;
            var ids = r.data.map(function (m) { return m.class_id; });
            _db.from('classes').select('*').in('id', ids).then(function (rc) {
              if (!rc.error && rc.data) {
                classes = rc.data.map(function (c) {
                  return { id: c.id, name: c.name, subject: c.subject || '', schedule: c.schedule || '', room: c.room || '', maxStudents: c.max_students || 30, termStart: c.term_start || '', termWeeks: c.term_weeks || 0 };
                });
                populateClassDropdowns();
                if (currentSection === 'assignments') renderAssignments();
              }
            });
          });

        // HV: hồ sơ của chính mình. PH: hồ sơ con được liên kết. (RLS lo phạm vi)
        _db.from('students').select('*').then(function (r) {
          if (!r.error && r.data) {
            students = r.data.map(_mapStudentRow);
            if (currentSection === 'student-portal') initStudentPortal();
            if (currentSection === 'parent-portal') initParentPortal();
          }
        });
      }

      // Subjects (all roles) — load from DB and repopulate dropdowns
      _db.from('subjects').select('name').eq('owner_id', _dbUserId)
        .then(function (r) {
          if (!r.error && r.data && r.data.length) {
            SUBJECTS = r.data.map(function (s) { return s.name; });
            populateSubjectDropdowns();
            if (currentSection === 'subjects') renderSubjects();
          }
        });

      // Assignments (teacher/admin: own; student/parent: all accessible via RLS)
      var asnQ = _db.from('assignments').select('*').order('created_at', { ascending: false });
      if (currentUser.role === 'Teacher') asnQ = asnQ.eq('owner_id', _dbUserId);
      asnQ.then(function (r) {
        if (r.error) { _dbError.assignments = _dbErrMsg(r.error); if (currentSection === 'assignments') renderAssignments(); return; }
        delete _dbError.assignments;
        if (r.data) {
          assignments = r.data.map(function (a) {
            return {
              id: a.id, title: a.title, subject: a.subject || '',
              class: a.class_name || '', classId: a.class_id || null,
              dueDate: a.due_date || '',
              status: a.status || 'open', description: a.description || '',
              teacherId: a.owner_id,
              createdAt: (a.created_at || '').split('T')[0],
              gradesPublished: !!a.grades_published,
              attachmentUrl: a.attachment_url || null,
            };
          });
          if (currentSection === 'assignments') renderAssignments();
        }
      });

      // Submissions — option B: every class member sees all submissions in their
      // class. RLS scopes the rows, so no client-side student filter here.
      var subQ = _db.from('assignment_submissions').select('*').order('submitted_at', { ascending: false });
      subQ.then(function (r) {
        if (!r.error && r.data) {
          submissions = r.data.map(function (s) {
            return {
              id: s.id, assignmentId: s.assignment_id, studentId: s.student_id,
              studentName: s.student_name || '',
              submittedAt: (s.submitted_at || '').split('T')[0],
              type: s.type || 'text', content: s.content || '',
              fileUrl: s.file_url || null,
              grade: s.grade !== null && s.grade !== undefined ? Number(s.grade) : null,
              feedback: s.feedback || null,
            };
          });
          if (currentSection === 'assignments') renderAssignments();
          try { updateNotifBadge(); } catch (e) { }
        }
      });

      // Assignment comments
      _db.from('assignment_comments').select('*').order('created_at', { ascending: true })
        .then(function (r) {
          if (!r.error && r.data) {
            assignmentComments = r.data.map(function (c) {
              return {
                id: c.id, assignmentId: c.assignment_id,
                userId: c.user_id, userName: c.user_name || '',
                content: c.content,
                createdAt: (c.created_at || '').split('T')[0],
              };
            });
          }
        });
    }

    // ── PER-ENTITY SAVE WRAPPERS ──────────────────────────────────
    function persistMaterial(m) {
      dbSave('materials', { id: m.id, owner_id: _dbUserId, title: m.title, subject: m.subject, type: m.type, content: m.content, url: m.url, pinned: !!m.pinned }, 'id');
    }
    function deleteMaterial(id) { dbDelete('materials', id); }

    function persistDeck(deck) {
      dbSave('flashcard_decks', { id: deck.id, owner_id: _dbUserId, name: deck.name, subject: deck.subject, description: deck.description }, 'id')
        .then(function () {
          if (!deck.cards || !deck.cards.length) return;
          var rows = deck.cards.map(function (c) {
            return { id: c.id, deck_id: deck.id, owner_id: _dbUserId, front: c.front, back: c.back, difficulty: c.difficulty || 'medium', is_favorite: !!c.isFavorite, rating: c.rating || 0 };
          });
          dbSave('flashcards', rows, 'id');
        });
    }
    function deleteDeckDb(id) { dbDelete('flashcard_decks', id); }
    function deleteCardDb(id) { dbDelete('flashcards', id); }

    function persistScheduleEvent(ev) {
      dbSave('schedule_events', { id: ev.id, owner_id: _dbUserId, title: ev.title, subject: ev.subject, date: ev.date, time: ev.time, duration: ev.duration, type: ev.type, notes: ev.notes }, 'id');
    }
    function deleteScheduleEventDb(id) { dbDelete('schedule_events', id); }

    function persistProfile(updates) {
      if (!_db || !_dbUserId) return;
      _db.from('profiles').update(updates).eq('id', _dbUserId).then(function (r) { if (r.error) console.warn('profile save', r.error.message); });
    }

    // ── SUBJECT DROPDOWNS ─────────────────────────────────────────
    // Returns <option> elements for all current SUBJECTS, with `selected` pre-selected.
    function _subjectOpts(selected) {
      return SUBJECTS.map(function (s) {
        return '<option value="' + escHtml(s) + '"' + (selected === s ? ' selected' : '') + '>' + escHtml(s) + '</option>';
      }).join('');
    }

    function populateSubjectDropdowns() {
      var opts = SUBJECTS.map(function (s) {
        return '<option value="' + escHtml(s) + '">' + escHtml(s) + '</option>';
      }).join('');

      // Option-based selects
      ['deckSubjectFilter', 'scoreSubject'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var cur = el.value;
        el.innerHTML = '<option value="">All Subjects</option>' + opts;
        if (cur) el.value = cur;
      });

      // Tab bars
      function buildTabs(barId, filterFn, currentFilter) {
        var bar = document.getElementById(barId);
        if (!bar) return;
        bar.innerHTML = '<button class="tab' + (currentFilter === 'All' ? ' active' : '') + '" onclick="' + filterFn + '(\'All\', this)">All</button>' +
          SUBJECTS.map(function (s) {
            return '<button class="tab' + (currentFilter === s ? ' active' : '') + '" onclick="' + filterFn + '(\'' + escHtml(s) + '\', this)">' + escHtml(s) + '</button>';
          }).join('');
      }
      buildTabs('hwTabBar', 'filterHw', currentHwFilter);
      buildTabs('matTabBar', 'filterMat', currentMatFilter);
    }

    function populateClassDropdowns() {
      var opts = classes.map(function (c) {
        return '<option value="' + escHtml(c.name) + '">' + escHtml(c.name) + '</option>';
      }).join('');
      ['classFilter', 'attendClassFilter', 'assignClassFilter'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var cur = el.value;
        el.innerHTML = '<option value="">Tất cả lớp</option>' + opts;
        if (cur) el.value = cur;
      });
    }

    // ── SUBJECT MANAGEMENT (Admin) ────────────────────────────────
    function renderSubjects() {
      var el = document.getElementById('subjectsList');
      if (!el) return;
      var badge = document.getElementById('subjectCountBadge');
      if (badge) badge.textContent = SUBJECTS.length + ' môn';
      el.innerHTML = SUBJECTS.length
        ? SUBJECTS.map(function (s, i) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">' +
            '<span style="font-size:14px;">' + escHtml(s) + '</span>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteSubject(' + i + ')">🗑</button>' +
            '</div>';
        }).join('')
        : '<p class="empty" style="padding:12px 0;">Chưa có môn học nào.</p>';
    }

    function saveSubject() {
      var inp = document.getElementById('newSubjectInput');
      var name = inp ? inp.value.trim() : '';
      if (!name) return;
      if (SUBJECTS.indexOf(name) !== -1) { showToast('Môn học đã tồn tại!', 'warning'); return; }
      SUBJECTS.push(name);
      inp.value = '';
      renderSubjects();
      populateSubjectDropdowns();
      if (_db && _dbUserId) {
        _db.from('subjects').upsert({ owner_id: _dbUserId, name: name }, { onConflict: 'owner_id,name' })
          .then(function (r) { if (r.error) console.warn('save subject', r.error.message); });
      }
      showToast('Đã thêm môn học: ' + name, 'success');
    }

    function deleteSubject(idx) {
      var name = SUBJECTS[idx];
      uiConfirm('Xóa môn học "' + name + '"?', function () {
        SUBJECTS.splice(idx, 1);
        renderSubjects();
        populateSubjectDropdowns();
        if (_db && _dbUserId) {
          _db.from('subjects').delete().eq('owner_id', _dbUserId).eq('name', name)
            .then(function (r) { if (r.error) console.warn('delete subject', r.error.message); });
        }
        showToast('Đã xóa môn học: ' + name, 'success');
      });
    }
    // ── DỮ LIỆU MẪU 1 CHẠM (Load / Clear sample data) ─────────────
    // Chèn vài lớp + học sinh THẬT vào Supabase (owned by current user, tuân RLS)
    // để người mới nghịch thử. Lưu id đã chèn vào localStorage để "Xoá" gỡ đúng
    // những gì đã nạp — không đụng dữ liệu thật của người dùng.
    var SAMPLE_KEY = 'th_sample_ids';
    function _sampleIds() {
      try { return JSON.parse(localStorage.getItem(SAMPLE_KEY) || 'null') || { classes: [], students: [] }; }
      catch (e) { return { classes: [], students: [] }; }
    }
    function _saveSampleIds(v) { try { localStorage.setItem(SAMPLE_KEY, JSON.stringify(v)); } catch (e) { } }
    function hasSampleData() { var s = _sampleIds(); return (s.classes.length + s.students.length) > 0; }

    function loadSampleData() {
      if (!_db || !_dbUserId) { showToast('Cần đăng nhập để nạp dữ liệu mẫu.', 'error'); return; }
      if (!currentUser || (currentUser.role !== 'Teacher' && currentUser.role !== 'Admin')) {
        showToast('Chỉ Giáo viên/Quản trị mới nạp được dữ liệu mẫu.', 'error'); return;
      }
      if (hasSampleData()) { showToast('Dữ liệu mẫu đã được nạp rồi. Bạn có thể "Xoá dữ liệu mẫu" trước.', 'info'); return; }

      var sampleClasses = [
        { name: 'Toán 9A (mẫu)', subject: 'Math', schedule: 'T2/T4 18:00', room: 'A1', max_students: 12 },
        { name: 'Anh Văn 8B (mẫu)', subject: 'English', schedule: 'T3/T6 19:30', room: 'B2', max_students: 12 },
      ];
      var sampleStudents = [
        { name: 'Nguyễn Minh An', email: null, class_name: 'Toán 9A (mẫu)', math_score: 88, eng_score: 79, attendance: 96 },
        { name: 'Trần Bảo Châu', email: null, class_name: 'Toán 9A (mẫu)', math_score: 72, eng_score: 68, attendance: 84 },
        { name: 'Lê Gia Huy', email: null, class_name: 'Toán 9A (mẫu)', math_score: 61, eng_score: 74, attendance: 71 },
        { name: 'Phạm Thảo My', email: null, class_name: 'Anh Văn 8B (mẫu)', math_score: 80, eng_score: 92, attendance: 93 },
        { name: 'Vũ Khánh Ngân', email: null, class_name: 'Anh Văn 8B (mẫu)', math_score: 76, eng_score: 85, attendance: 88 },
        { name: 'Đỗ Quốc Bảo', email: null, class_name: 'Anh Văn 8B (mẫu)', math_score: 90, eng_score: 81, attendance: 97 },
      ];

      showBusy('Đang nạp dữ liệu mẫu…');
      var ids = { classes: [], students: [] };
      var clsPayload = sampleClasses.map(function (c) { var o = {}; for (var k in c) o[k] = c[k]; o.owner_id = _dbUserId; return o; });
      _db.from('classes').insert(clsPayload).select().then(function (rc) {
        if (rc.error) { hideBusy(); showToast('Lỗi nạp lớp mẫu: ' + rc.error.message, 'error'); return; }
        (rc.data || []).forEach(function (c) { ids.classes.push(c.id); });
        var stuPayload = sampleStudents.map(function (s) {
          return { owner_id: _dbUserId, name: s.name, email: s.email, class_name: s.class_name, math_score: s.math_score, eng_score: s.eng_score, attendance: s.attendance };
        });
        _db.from('students').insert(stuPayload).select().then(function (rs) {
          hideBusy();
          if (rs.error) { showToast('Lỗi nạp học sinh mẫu: ' + rs.error.message, 'error'); return; }
          (rs.data || []).forEach(function (s) { ids.students.push(s.id); students.push(_mapStudentRow(s)); });
          (rc.data || []).forEach(function (c) {
            classes.push({ id: c.id, name: c.name, subject: c.subject || '', teacher: '', schedule: c.schedule || '', day: c.schedule || '', time: '', room: c.room || '', capacity: c.max_students || 12, maxStudents: c.max_students || 12, color: (c.subject || '').toLowerCase() });
          });
          _saveSampleIds(ids);
          populateClassDropdowns();
          _rerenderAfterLoad();
          try { renderClasses(); } catch (e) { }
          try { renderWelcome(); } catch (e) { }
          var kpi = document.getElementById('kpiStudents'); if (kpi) kpi.textContent = students.length;
          try { renderSampleDataControls(); } catch (e) { }
          try { logAudit('sample_load', 'sample', 'Nạp ' + ids.classes.length + ' lớp, ' + ids.students.length + ' HS mẫu'); } catch (e) { }
          showToast('Đã nạp ' + ids.classes.length + ' lớp và ' + ids.students.length + ' học sinh mẫu.', 'success');
        });
      });
    }

    function clearSampleData() {
      var ids = _sampleIds();
      if (!hasSampleData()) { showToast('Không có dữ liệu mẫu để xoá.', 'info'); return; }
      uiConfirm('Xoá toàn bộ dữ liệu mẫu đã nạp (' + ids.classes.length + ' lớp, ' + ids.students.length + ' học sinh)?', function () {
        if (!_db) return;
        showBusy('Đang xoá dữ liệu mẫu…');
        var jobs = [];
        if (ids.students.length) jobs.push(_db.from('students').delete().in('id', ids.students));
        if (ids.classes.length) jobs.push(_db.from('classes').delete().in('id', ids.classes));
        Promise.all(jobs).then(function () {
          hideBusy();
          var sSet = {}; ids.students.forEach(function (i) { sSet[i] = 1; });
          var cSet = {}; ids.classes.forEach(function (i) { cSet[i] = 1; });
          students = students.filter(function (s) { return !sSet[s.id]; });
          classes = classes.filter(function (c) { return !cSet[c.id]; });
          _saveSampleIds({ classes: [], students: [] });
          populateClassDropdowns();
          _rerenderAfterLoad();
          try { renderClasses(); } catch (e) { }
          try { renderWelcome(); } catch (e) { }
          var kpi = document.getElementById('kpiStudents'); if (kpi) kpi.textContent = students.length;
          try { renderSampleDataControls(); } catch (e) { }
          try { logAudit('sample_clear', 'sample', 'Xoá ' + ids.classes.length + ' lớp, ' + ids.students.length + ' HS mẫu'); } catch (e) { }
          showToast('Đã xoá dữ liệu mẫu.', 'success');
        }).catch(function (e) { hideBusy(); showToast('Lỗi xoá dữ liệu mẫu.', 'error'); });
      });
    }

    // Vẽ cụm nút "Nạp/Xoá dữ liệu mẫu" (dùng ở Cài đặt). Đổi nhãn theo trạng thái.
    function renderSampleDataControls() {
      var box = document.getElementById('sampleDataControls');
      if (!box) return;
      if (!currentUser || (currentUser.role !== 'Teacher' && currentUser.role !== 'Admin')) { box.innerHTML = ''; return; }
      var loaded = hasSampleData();
      box.innerHTML = loaded
        ? '<button class="btn btn-danger" onclick="clearSampleData()">Xoá dữ liệu mẫu</button>' +
          '<span style="font-size:12.5px;color:var(--text-muted);align-self:center;">Đã nạp dữ liệu mẫu — xoá khi bạn đã xem xong.</span>'
        : '<button class="btn btn-primary" onclick="loadSampleData()">Nạp dữ liệu mẫu</button>' +
          '<span style="font-size:12.5px;color:var(--text-muted);align-self:center;">Thêm vài lớp &amp; học sinh mẫu để trải nghiệm nhanh.</span>';
    }

    // ── END SUPABASE INTEGRATION ──────────────────────────────────
    var currentSchedFilter = 'All';
    var nextSchedId = 9;
    var reportCharts = {};

