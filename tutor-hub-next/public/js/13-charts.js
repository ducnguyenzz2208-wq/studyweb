    // ============================================================
    // CHARTS
    // ============================================================
    var attendChart, scoreChart, scoreDistChart, revenueChart;

    function getChartTextColor() { return isDark ? '#8899aa' : '#6b7280'; }
    function getChartGridColor() { return isDark ? '#2a3a50' : '#e2e8f0'; }
    function _fmtMoney(v) { return '$' + (Math.round(v * 100) / 100).toLocaleString('en-US'); }

    // Giữ tên cũ cho các chỗ đang gọi — giờ luôn vẽ lại bằng dữ liệu thật
    function initCharts() { renderDashCharts(); }

    function renderDashCharts() {
      if (typeof Chart === 'undefined') return;

      // 1) Attendance Trend — % có mặt theo 6 buổi gần nhất (từ attendance_records)
      var byDate = {};
      attendanceRecords.forEach(function (r) {
        if (!byDate[r.date]) byDate[r.date] = { t: 0, ok: 0 };
        byDate[r.date].t++;
        if (r.status !== 'absent') byDate[r.date].ok++;
      });
      var dates = Object.keys(byDate).sort().slice(-6);
      var attLabels = dates.map(function (d) { return d.slice(5); });
      var attData = dates.map(function (d) { return Math.round(byDate[d].ok / byDate[d].t * 100); });

      var ctx1El = document.getElementById('attendanceChart');
      if (ctx1El) {
        if (attendChart) attendChart.destroy();
        attendChart = new Chart(ctx1El.getContext('2d'), {
          type: 'line',
          data: {
            labels: attLabels,
            datasets: [{
              label: 'Attendance %', data: attData,
              borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)',
              fill: true, tension: 0.4, pointBackgroundColor: '#3b82f6', pointRadius: 5,
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { min: 0, max: 100, ticks: { color: getChartTextColor(), callback: function (v) { return v + '%'; } }, grid: { color: getChartGridColor() } },
              x: { ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } }
            }
          }
        });
      }

      // 2) Subject Scores — điểm TB Toán/Anh theo lớp (từ hồ sơ học viên)
      var byClass = {};
      students.forEach(function (s) {
        if (!s.class) return;
        if (!byClass[s.class]) byClass[s.class] = { m: 0, e: 0, n: 0 };
        byClass[s.class].m += (s.mathScore || 0);
        byClass[s.class].e += (s.engScore || 0);
        byClass[s.class].n++;
      });
      var clsNames = Object.keys(byClass).sort();
      var mathData = clsNames.map(function (c) { return Math.round(byClass[c].m / byClass[c].n); });
      var engData = clsNames.map(function (c) { return Math.round(byClass[c].e / byClass[c].n); });

      var ctx2El = document.getElementById('scoresChart');
      if (ctx2El) {
        if (scoreChart) scoreChart.destroy();
        scoreChart = new Chart(ctx2El.getContext('2d'), {
          type: 'bar',
          data: {
            labels: clsNames,
            datasets: [
              { label: 'Math', data: mathData, backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 6 },
              { label: 'English', data: engData, backgroundColor: 'rgba(139,92,246,0.7)', borderRadius: 6 }
            ]
          },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: getChartTextColor(), boxWidth: 12 } } },
            scales: {
              y: { min: 0, max: 100, ticks: { color: getChartTextColor() }, grid: { color: getChartGridColor() } },
              x: { ticks: { color: getChartTextColor() }, grid: { display: false } }
            }
          }
        });
      }

      // 3) Doanh thu theo tháng (chỉ admin) — tổng Paid theo tháng của paid_date
      var revCard = document.getElementById('revenueChartCard');
      var isAdmin = currentUser && currentUser.role === 'Admin';
      if (revCard) revCard.style.display = isAdmin ? '' : 'none';
      if (isAdmin) {
        var months = [], monthKeys = [];
        var now = new Date();
        for (var i = 5; i >= 0; i--) {
          var d = new Date(now.getFullYear(), now.getMonth() - i, 15);
          monthKeys.push(d.toISOString().slice(0, 7));
          months.push('T' + (d.getMonth() + 1) + '/' + String(d.getFullYear()).slice(2));
        }
        var revData = monthKeys.map(function (k) {
          return payments.reduce(function (a, p) {
            return a + ((p.status === 'Paid' && String(p.paid).slice(0, 7) === k) ? p.amount : 0);
          }, 0);
        });
        var tot = revData.reduce(function (a, v) { return a + v; }, 0);
        var totEl = document.getElementById('revenueChartTotal');
        if (totEl) totEl.textContent = 'Tổng: ' + _fmtMoney(tot);
        var ctx3El = document.getElementById('revenueChart');
        if (ctx3El) {
          if (revenueChart) revenueChart.destroy();
          revenueChart = new Chart(ctx3El.getContext('2d'), {
            type: 'bar',
            data: {
              labels: months,
              datasets: [{ label: 'Đã thu ($)', data: revData, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 8 }]
            },
            options: {
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { color: getChartTextColor(), callback: function (v) { return '$' + v; } }, grid: { color: getChartGridColor() } },
                x: { ticks: { color: getChartTextColor() }, grid: { display: false } }
              }
            }
          });
        }
      }
    }

    function initScoreDistChart() {
      var ctx = document.getElementById('scoreDistChart');
      if (!ctx) return;
      if (scoreDistChart) scoreDistChart.destroy();
      var avgs = students.map(function (s) { return avgScore(s); });
      var bins = { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D (60-69)': 0, 'F (<60)': 0 };
      avgs.forEach(function (a) {
        if (a >= 90) bins['A (90-100)']++;
        else if (a >= 80) bins['B (80-89)']++;
        else if (a >= 70) bins['C (70-79)']++;
        else if (a >= 60) bins['D (60-69)']++;
        else bins['F (<60)']++;
      });
      scoreDistChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(bins),
          datasets: [{ label: 'Students', data: Object.values(bins), backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'], borderRadius: 8 }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { ticks: { color: getChartTextColor(), stepSize: 1 }, grid: { color: getChartGridColor() } },
            x: { ticks: { color: getChartTextColor() }, grid: { display: false } }
          }
        }
      });
    }

    function refreshCharts() {
      [attendChart, scoreChart, scoreDistChart, revenueChart].forEach(function (c) {
        if (!c) return;
        c.options.scales.y.ticks.color = getChartTextColor();
        c.options.scales.y.grid.color = getChartGridColor();
        c.options.scales.x.ticks.color = getChartTextColor();
        if (c.options.scales.x.grid) c.options.scales.x.grid.color = getChartGridColor();
        if (c.options.plugins.legend && c.options.plugins.legend.labels) c.options.plugins.legend.labels.color = getChartTextColor();
        c.update();
      });
    }

