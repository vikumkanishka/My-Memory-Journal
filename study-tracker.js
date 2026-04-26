(function () {
  'use strict';

  class StudyTracker {
    constructor() {
      this.STORAGE_KEY = 'memory_journal_study_entries';
      this.GOAL_KEY = 'memory_journal_study_goal';
      this.entries = this.loadEntries();
      this.goal = this.loadGoal();
      this.init();
    }

    init() {
      this.bindEvents();
      this.render();
    }

    bindEvents() {
      document.querySelectorAll('.quick-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const hours = Number(btn.getAttribute('data-hours') || 0);
          this.addStudy(hours);
        });
      });

      const addCustomBtn = document.getElementById('addCustomBtn');
      addCustomBtn?.addEventListener('click', () => {
        const input = document.getElementById('customHours');
        const hours = Number(input?.value || 0);
        if (!this.isValidAmount(hours, 0.25, 12)) {
          window.alert('Enter custom study time between 0.25 and 12 hours.');
          return;
        }

        this.addStudy(hours);
        input.value = '';
      });

      const saveGoalBtn = document.getElementById('saveGoalBtn');
      saveGoalBtn?.addEventListener('click', () => {
        const goalInput = document.getElementById('goalInput');
        const goal = Number(goalInput?.value || 0);
        if (!this.isValidAmount(goal, 0.5, 16)) {
          window.alert('Set a goal between 0.5 and 16 hours.');
          return;
        }

        this.goal = goal;
        localStorage.setItem(this.GOAL_KEY, String(goal));
        this.render();
      });

      const resetTodayBtn = document.getElementById('resetTodayBtn');
      resetTodayBtn?.addEventListener('click', () => {
        if (!window.confirm('Reset today study hours?')) {
          return;
        }

        const today = this.getTodayKey();
        delete this.entries[today];
        this.saveEntries();
        this.render();
      });
    }

    loadEntries() {
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        const parsed = data ? JSON.parse(data) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    saveEntries() {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries));
    }

    loadGoal() {
      const raw = Number(localStorage.getItem(this.GOAL_KEY));
      return this.isValidAmount(raw, 0.5, 16) ? raw : 3;
    }

    isValidAmount(value, min, max) {
      return Number.isFinite(value) && value >= min && value <= max;
    }

    getTodayKey() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    getTodayHours() {
      const today = this.getTodayKey();
      return Number(this.entries[today] || 0);
    }

    addStudy(hours) {
      if (!this.isValidAmount(hours, 0.25, 12)) {
        return;
      }

      const today = this.getTodayKey();
      const current = Number(this.entries[today] || 0);
      const updated = Math.min(current + hours, 24);
      this.entries[today] = Math.round(updated * 100) / 100;
      this.saveEntries();
      this.render();
    }

    getSortedEntries() {
      return Object.entries(this.entries)
        .map(([date, hours]) => ({ date: String(date), hours: Number(hours) || 0 }))
        .sort((a, b) => b.date.localeCompare(a.date));
    }

    formatDateKey(dateObj) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    formatPrettyDate(dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }

    formatHours(value) {
      const normalized = Math.round((Number(value) || 0) * 100) / 100;
      return String(normalized)
        .replace(/\.00$/, '')
        .replace(/(\.\d)0$/, '$1');
    }

    getCurrentStreak() {
      let streak = 0;
      const cursor = new Date();

      while (true) {
        const key = this.formatDateKey(cursor);
        const hours = Number(this.entries[key] || 0);

        if (hours >= this.goal) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    }

    getSevenDayTotal() {
      const total = this.getLastNDays(7).reduce((sum, item) => sum + item.hours, 0);
      return Math.round(total * 100) / 100;
    }

    getBestDay() {
      const sorted = this.getSortedEntries();
      if (sorted.length === 0) {
        return 0;
      }

      return Math.max(...sorted.map((item) => item.hours));
    }

    getLastNDays(n) {
      const days = [];
      const cursor = new Date();

      for (let i = 0; i < n; i += 1) {
        const key = this.formatDateKey(cursor);
        days.push({
          date: key,
          hours: Number(this.entries[key] || 0)
        });
        cursor.setDate(cursor.getDate() - 1);
      }

      return days;
    }

    render() {
      this.renderToday();
      this.renderStats();
      this.renderHistory();
    }

    renderToday() {
      const todayHours = this.getTodayHours();
      const percent = Math.min(Math.round((todayHours / this.goal) * 100), 100);

      const todayHoursEl = document.getElementById('todayHours');
      const dailyGoalEl = document.getElementById('dailyGoal');
      const progressPercentEl = document.getElementById('progressPercent');
      const progressRing = document.getElementById('progressRing');
      const goalInput = document.getElementById('goalInput');

      if (todayHoursEl) {
        todayHoursEl.textContent = this.formatHours(todayHours) + ' h';
      }
      if (dailyGoalEl) {
        dailyGoalEl.textContent = this.formatHours(this.goal) + ' h';
      }
      if (progressPercentEl) {
        progressPercentEl.textContent = percent + '%';
      }
      if (progressRing) {
        progressRing.style.setProperty('--percent', String(percent));
      }
      if (goalInput) {
        goalInput.value = String(this.goal);
      }
    }

    renderStats() {
      const streakValue = document.getElementById('streakValue');
      const totalValue = document.getElementById('totalValue');
      const bestValue = document.getElementById('bestValue');

      const streak = this.getCurrentStreak();
      const total = this.getSevenDayTotal();
      const best = this.getBestDay();

      if (streakValue) {
        streakValue.textContent = streak + (streak === 1 ? ' day' : ' days');
      }
      if (totalValue) {
        totalValue.textContent = this.formatHours(total) + ' h';
      }
      if (bestValue) {
        bestValue.textContent = this.formatHours(best) + ' h';
      }
    }

    renderHistory() {
      const historyList = document.getElementById('historyList');
      const historyEmpty = document.getElementById('historyEmpty');
      if (!historyList || !historyEmpty) {
        return;
      }

      const recent = this.getLastNDays(14);
      const hasData = recent.some((item) => item.hours > 0);
      historyList.innerHTML = '';

      if (!hasData) {
        historyEmpty.style.display = 'block';
        return;
      }

      historyEmpty.style.display = 'none';

      recent.forEach((item) => {
        const ratio = Math.min((item.hours / this.goal) * 100, 100);
        const row = document.createElement('div');
        row.className = 'history-item' + (item.hours >= this.goal ? ' hit-goal' : '');
        row.innerHTML =
          '<span>' + this.formatPrettyDate(item.date) + '</span>' +
          '<div class="history-bar"><div class="history-fill" style="width:' + ratio + '%"></div></div>' +
          '<span class="history-meta">' + this.formatHours(item.hours) + ' h</span>';

        historyList.appendChild(row);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    new StudyTracker();
  });
})();
