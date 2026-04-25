(function () {
  'use strict';

  class GymTracker {
    constructor() {
      this.STORAGE_KEY = 'memory_journal_gym_entries';
      this.GOAL_KEY = 'memory_journal_gym_goal';
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
          const minutes = Number(btn.getAttribute('data-minutes') || 0);
          this.addWorkout(minutes);
        });
      });

      const addCustomBtn = document.getElementById('addCustomBtn');
      addCustomBtn?.addEventListener('click', () => {
        const input = document.getElementById('customMinutes');
        const minutes = Number(input?.value || 0);
        if (!this.isValidAmount(minutes, 5, 240)) {
          window.alert('Enter a custom workout duration between 5 and 240 minutes.');
          return;
        }

        this.addWorkout(minutes);
        input.value = '';
      });

      const saveGoalBtn = document.getElementById('saveGoalBtn');
      saveGoalBtn?.addEventListener('click', () => {
        const goalInput = document.getElementById('goalInput');
        const goal = Number(goalInput?.value || 0);
        if (!this.isValidAmount(goal, 15, 240)) {
          window.alert('Set a goal between 15 and 240 minutes.');
          return;
        }

        this.goal = goal;
        localStorage.setItem(this.GOAL_KEY, String(goal));
        this.render();
      });

      const resetTodayBtn = document.getElementById('resetTodayBtn');
      resetTodayBtn?.addEventListener('click', () => {
        if (!window.confirm('Reset today workout minutes?')) {
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
      return this.isValidAmount(raw, 15, 240) ? raw : 60;
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

    getTodayMinutes() {
      const today = this.getTodayKey();
      return Number(this.entries[today] || 0);
    }

    addWorkout(minutes) {
      if (!this.isValidAmount(minutes, 5, 240)) {
        return;
      }

      const today = this.getTodayKey();
      const current = Number(this.entries[today] || 0);
      const updated = Math.min(current + minutes, 9999);
      this.entries[today] = updated;
      this.saveEntries();
      this.render();
    }

    getSortedEntries() {
      return Object.entries(this.entries)
        .map(([date, minutes]) => ({ date: String(date), minutes: Number(minutes) || 0 }))
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

    getCurrentStreak() {
      let streak = 0;
      const cursor = new Date();

      while (true) {
        const key = this.formatDateKey(cursor);
        const minutes = Number(this.entries[key] || 0);

        if (minutes >= this.goal) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    }

    getSevenDayTotal() {
      return this.getLastNDays(7).reduce((sum, item) => sum + item.minutes, 0);
    }

    getBestDay() {
      const sorted = this.getSortedEntries();
      if (sorted.length === 0) {
        return 0;
      }

      return Math.max(...sorted.map((item) => item.minutes));
    }

    getLastNDays(n) {
      const days = [];
      const cursor = new Date();

      for (let i = 0; i < n; i += 1) {
        const key = this.formatDateKey(cursor);
        days.push({
          date: key,
          minutes: Number(this.entries[key] || 0)
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
      const todayMinutes = this.getTodayMinutes();
      const percent = Math.min(Math.round((todayMinutes / this.goal) * 100), 100);

      const todayMinutesEl = document.getElementById('todayMinutes');
      const dailyGoalEl = document.getElementById('dailyGoal');
      const progressPercentEl = document.getElementById('progressPercent');
      const progressRing = document.getElementById('progressRing');
      const goalInput = document.getElementById('goalInput');

      if (todayMinutesEl) {
        todayMinutesEl.textContent = todayMinutes + ' min';
      }
      if (dailyGoalEl) {
        dailyGoalEl.textContent = this.goal + ' min';
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
        totalValue.textContent = total + ' min';
      }
      if (bestValue) {
        bestValue.textContent = best + ' min';
      }
    }

    renderHistory() {
      const historyList = document.getElementById('historyList');
      const historyEmpty = document.getElementById('historyEmpty');
      if (!historyList || !historyEmpty) {
        return;
      }

      const recent = this.getLastNDays(14);
      const hasData = recent.some((item) => item.minutes > 0);
      historyList.innerHTML = '';

      if (!hasData) {
        historyEmpty.style.display = 'block';
        return;
      }

      historyEmpty.style.display = 'none';

      recent.forEach((item) => {
        const ratio = Math.min((item.minutes / this.goal) * 100, 100);
        const row = document.createElement('div');
        row.className = 'history-item' + (item.minutes >= this.goal ? ' hit-goal' : '');
        row.innerHTML =
          '<span>' + this.formatPrettyDate(item.date) + '</span>' +
          '<div class="history-bar"><div class="history-fill" style="width:' + ratio + '%"></div></div>' +
          '<span class="history-meta">' + item.minutes + ' min</span>';

        historyList.appendChild(row);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    new GymTracker();
  });
})();