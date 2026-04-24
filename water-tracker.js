(function () {
  'use strict';

  class WaterTracker {
    constructor() {
      this.STORAGE_KEY = 'memory_journal_water_entries';
      this.GOAL_KEY = 'memory_journal_water_goal';
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
          const amount = Number(btn.getAttribute('data-amount') || 0);
          this.addWater(amount);
        });
      });

      const addCustomBtn = document.getElementById('addCustomBtn');
      addCustomBtn?.addEventListener('click', () => {
        const input = document.getElementById('customAmount');
        const amount = Number(input?.value || 0);
        if (!this.isValidAmount(amount, 50, 2000)) {
          window.alert('Enter a custom amount between 50 and 2000 ml.');
          return;
        }

        this.addWater(amount);
        input.value = '';
      });

      const saveGoalBtn = document.getElementById('saveGoalBtn');
      saveGoalBtn?.addEventListener('click', () => {
        const goalInput = document.getElementById('goalInput');
        const goal = Number(goalInput?.value || 0);
        if (!this.isValidAmount(goal, 500, 6000)) {
          window.alert('Set a goal between 500 and 6000 ml.');
          return;
        }

        this.goal = goal;
        localStorage.setItem(this.GOAL_KEY, String(goal));
        this.render();
      });

      const resetTodayBtn = document.getElementById('resetTodayBtn');
      resetTodayBtn?.addEventListener('click', () => {
        if (!window.confirm('Reset today hydration amount?')) {
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
      return this.isValidAmount(raw, 500, 6000) ? raw : 2000;
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

    getTodayAmount() {
      const today = this.getTodayKey();
      return Number(this.entries[today] || 0);
    }

    addWater(amount) {
      if (!this.isValidAmount(amount, 50, 2000)) {
        return;
      }

      const today = this.getTodayKey();
      const current = Number(this.entries[today] || 0);
      const updated = Math.min(current + amount, 15000);
      this.entries[today] = updated;
      this.saveEntries();
      this.render();
    }

    getSortedEntries() {
      return Object.entries(this.entries)
        .map(([date, amount]) => ({ date: String(date), amount: Number(amount) || 0 }))
        .sort((a, b) => b.date.localeCompare(a.date));
    }

    getCurrentStreak() {
      let streak = 0;
      const cursor = new Date();

      while (true) {
        const key = this.formatDateKey(cursor);
        const amount = Number(this.entries[key] || 0);

        if (amount >= this.goal) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
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

    getSevenDayAverage() {
      const total = this.getLastNDays(7).reduce((sum, item) => sum + item.amount, 0);
      return Math.round(total / 7);
    }

    getBestDay() {
      const sorted = this.getSortedEntries();
      if (sorted.length === 0) {
        return 0;
      }
      return Math.max(...sorted.map((item) => item.amount));
    }

    getLastNDays(n) {
      const days = [];
      const cursor = new Date();

      for (let i = 0; i < n; i += 1) {
        const key = this.formatDateKey(cursor);
        days.push({
          date: key,
          amount: Number(this.entries[key] || 0)
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
      const todayAmount = this.getTodayAmount();
      const percent = Math.min(Math.round((todayAmount / this.goal) * 100), 100);

      const todayAmountEl = document.getElementById('todayAmount');
      const dailyGoalEl = document.getElementById('dailyGoal');
      const progressPercentEl = document.getElementById('progressPercent');
      const progressRing = document.getElementById('progressRing');
      const goalInput = document.getElementById('goalInput');

      if (todayAmountEl) {
        todayAmountEl.textContent = todayAmount + ' ml';
      }
      if (dailyGoalEl) {
        dailyGoalEl.textContent = this.goal + ' ml';
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
      const averageValue = document.getElementById('averageValue');
      const bestValue = document.getElementById('bestValue');

      const streak = this.getCurrentStreak();
      const average = this.getSevenDayAverage();
      const best = this.getBestDay();

      if (streakValue) {
        streakValue.textContent = streak + (streak === 1 ? ' day' : ' days');
      }
      if (averageValue) {
        averageValue.textContent = average + ' ml';
      }
      if (bestValue) {
        bestValue.textContent = best + ' ml';
      }
    }

    renderHistory() {
      const historyList = document.getElementById('historyList');
      const historyEmpty = document.getElementById('historyEmpty');
      if (!historyList || !historyEmpty) {
        return;
      }

      const recent = this.getLastNDays(14);
      const hasData = recent.some((item) => item.amount > 0);
      historyList.innerHTML = '';

      if (!hasData) {
        historyEmpty.style.display = 'block';
        return;
      }

      historyEmpty.style.display = 'none';

      recent.forEach((item) => {
        const ratio = Math.min((item.amount / this.goal) * 100, 100);
        const row = document.createElement('div');
        row.className = 'history-item' + (item.amount >= this.goal ? ' hit-goal' : '');
        row.innerHTML =
          '<span>' + this.formatPrettyDate(item.date) + '</span>' +
          '<div class="history-bar"><div class="history-fill" style="width:' + ratio + '%"></div></div>' +
          '<span class="history-meta">' + item.amount + ' ml</span>';

        historyList.appendChild(row);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    new WaterTracker();
  });
})();
