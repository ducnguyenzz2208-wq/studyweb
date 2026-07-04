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

    // Pull all user data from Supabase and overwrite in-memory arrays
    function loadMaterials() {
      if (!_db) return;
      _db.from('materials').select('*').order('created_at', { ascending: false })
        .then(function (r) {
          if (r.error) { console.error('loadMaterials error:', r.error); return; }
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

    function loadDbData() {
      if (!_db || !_dbUserId) return;

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
          if (!r.error && r.data && r.data.length) {
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
                return { id: c.id, name: c.name, subject: c.subject || '', teacher: c.teacher || '', schedule: c.schedule || '', day: c.schedule || '', time: '', room: c.room || '', capacity: c.max_students || 30, maxStudents: c.max_students || 30, color: (c.subject || '').toLowerCase() };
              });
              populateClassDropdowns();
              if (currentSection === 'classes') renderClasses();
              if (currentSection === 'assignments') renderAssignments();
              if (currentSection === 'dashboard') { try { renderDashboard(); } catch (e) { } }
            }
          });

        _db.from('students').select('*').eq('owner_id', _dbUserId)
          .then(function (r) {
            if (!r.error && r.data) {
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
                  return { id: c.id, name: c.name, subject: c.subject || '', schedule: c.schedule || '', room: c.room || '', maxStudents: c.max_students || 30 };
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
        if (!r.error && r.data) {
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
      if (!confirm('Xóa môn học "' + name + '"?')) return;
      SUBJECTS.splice(idx, 1);
      renderSubjects();
      populateSubjectDropdowns();
      if (_db && _dbUserId) {
        _db.from('subjects').delete().eq('owner_id', _dbUserId).eq('name', name)
          .then(function (r) { if (r.error) console.warn('delete subject', r.error.message); });
      }
      showToast('Đã xóa môn học: ' + name, 'success');
    }
    // ── END SUPABASE INTEGRATION ──────────────────────────────────
    var currentSchedFilter = 'All';
    var nextSchedId = 9;
    var reportCharts = {};

