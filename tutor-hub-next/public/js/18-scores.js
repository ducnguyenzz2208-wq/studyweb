    // ============================================================
    // SCORES
    // ============================================================
    function renderScores() {
      var subj = document.getElementById('scoreSubject').value;
      var tbody = document.getElementById('scoresTableBody');
      tbody.innerHTML = students.map(function (s, i) {
        var avg2 = avgScore(s);
        var g = getGrade(avg2);
        var trend = avg2 >= 80 ? '↑' : avg2 >= 70 ? '→' : '↓';
        var trendColor = avg2 >= 80 ? 'color:var(--success)' : avg2 >= 70 ? 'color:var(--text-muted)' : 'color:var(--danger)';
        return '<tr>' +
          '<td><div class="student-row">' +
          '<div class="avatar" style="background:' + COLORS[i % 12] + ';width:28px;height:28px;font-size:11px">' + getInitials(s.name) + '</div>' +
          escHtml(s.name) +
          '</div></td>' +
          '<td><div class="score-bar-wrap"><span style="min-width:28px">' + s.mathScore + '</span><div class="score-bar"><div class="score-fill" style="width:' + s.mathScore + '%;background:#3b82f6"></div></div></div></td>' +
          '<td><div class="score-bar-wrap"><span style="min-width:28px">' + s.engScore + '</span><div class="score-bar"><div class="score-fill" style="width:' + s.engScore + '%;background:#8b5cf6"></div></div></div></td>' +
          '<td><strong>' + avg2 + '</strong></td>' +
          '<td><span class="' + gradeClass(g) + '">' + g + '</span></td>' +
          '<td style="' + trendColor + ';font-size:18px;font-weight:700">' + trend + '</td>' +
          '</tr>';
      }).join('');
      initScoreDistChart();
    }

