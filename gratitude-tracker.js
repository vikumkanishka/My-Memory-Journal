(function () {
  'use strict';

  class GratitudeTracker {
    constructor() {
      this.STORAGE_KEY = 'memory_journal_gratitude_entries';
      this.entries = this.loadEntries();
      this.currentMonth = new Date();
      this.init();
    }

    init() {
      this.bindEvents();
      this.render();
    }

    bindEvents() {
      const addGratitudeBtn = document.getElementById('addGratitudeBtn');
      addGratitudeBtn?.addEventListener('click', () => {
        this.handleAddGratitude();
      });

      const gratitudeInput = document.getElementById('gratitudeInput');
      gratitudeInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          this.handleAddGratitude();
        }
      });

      gratitudeInput?.addEventListener('input', () => {
        const charUsed = document.getElementById('charUsed');
        if (charUsed) {
          charUsed.textContent = String(gratitudeInput.value.length);
        }
      });

      const filterPeriod = document.getElementById('filterPeriod');
      filterPeriod?.addEventListener('change', () => {
        this.renderHistory();
      });

      const resetDataBtn = document.getElementById('resetDataBtn');
      resetDataBtn?.addEventListener('click', () => {
        if (!window.confirm('Clear all gratitude entries? This cannot be undone.')) {
          return;
        }
        this.entries = [];
        this.saveEntries();
        this.render();
      });

      const prevMonth = document.getElementById('prevMonth');
      const nextMonth = document.getElementById('nextMonth');
      prevMonth?.addEventListener('click', () => {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.renderCalendar();
      });
      nextMonth?.addEventListener('click', () => {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.renderCalendar();
      });
    }

    handleAddGratitude() {
      const gratitudeInput = document.getElementById('gratitudeInput');
      const text = (gratitudeInput?.value || '').trim();

      if (!text || text.length === 0) {
        window.alert('Please write what you\'re grateful for.');
        return;
      }

      if (text.length > 300) {
        window.alert('Gratitude entry must be 300 characters or less.');
        return;
      }

      this.addGratitude(text);
      if (gratitudeInput) {
        gratitudeInput.value = '';
        const charUsed = document.getElementById('charUsed');
        if (charUsed) charUsed.textContent = '0';
      }
    }

    addGratitude(text) {
      const now = new Date();
      const gratitude = {
        id: Date.now(),
        date: this.formatDateKey(now),
        time: now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        text: String(text),
        timestamp: now.getTime()
      };

      this.entries.push(gratitude);
      this.saveEntries();
      this.render();
    }

    loadEntries() {
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        const parsed = data ? JSON.parse(data) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    saveEntries() {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries));
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
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }

    formatMonthYear(dateObj) {
      return dateObj.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
      });
    }

    getTodayCount() {
      const today = this.formatDateKey(new Date());
      return this.entries.filter((e) => e.date === today).length;
    }

    getThisWeekCount() {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return this.entries.filter((e) => e.timestamp >= weekAgo.getTime()).length;
    }

    getThisMonthCount() {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      return this.entries.filter((e) => {
        const entryDate = new Date(e.date);
        return entryDate >= monthAgo && entryDate.getMonth() === monthAgo.getMonth();
      }).length;
    }

    getTotalCount() {
      return this.entries.length;
    }

    getCurrentStreak() {
      let streak = 0;
      const cursor = new Date();

      while (true) {
        const key = this.formatDateKey(cursor);
        const hasGratitude = this.entries.some((e) => e.date === key);

        if (hasGratitude) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    }

    getDateEntry(dateKey) {
      return this.entries.filter((e) => e.date === dateKey);
    }

    getFilteredEntries() {
      const filter = document.getElementById('filterPeriod')?.value || 'all';
      const now = new Date();

      switch (filter) {
        case 'today': {
          const today = this.formatDateKey(now);
          return this.entries.filter((e) => e.date === today);
        }
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return this.entries.filter((e) => e.timestamp >= weekAgo.getTime());
        }
        case 'month': {
          const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
          return this.entries.filter((e) => {
            const entryDate = new Date(e.date);
            return entryDate >= monthAgo && entryDate.getMonth() === monthAgo.getMonth();
          });
        }
        default:
          return this.entries;
      }
    }

    deleteGratitude(id) {
      this.entries = this.entries.filter((e) => e.id !== id);
      this.saveEntries();
      this.render();
    }

    render() {
      this.renderToday();
      this.renderStreak();
      this.renderStats();
      this.renderCalendar();
      this.renderHistory();
    }

    renderToday() {
      const todayCount = this.getTodayCount();
      const todayCountEl = document.getElementById('todayCount');
      if (todayCountEl) {
        todayCountEl.textContent = String(todayCount);
      }
    }

    renderStreak() {
      const streak = this.getCurrentStreak();
      const streakValue = document.getElementById('streakValue');
      const streakMessage = document.getElementById('streakMessage');

      if (streakValue) {
        streakValue.textContent = String(streak);
      }

      if (streakMessage) {
        if (streak === 0) {
          streakMessage.textContent = 'Add a gratitude to start your streak!';
        } else if (streak === 1) {
          streakMessage.textContent = 'Great start! Keep it going.';
        } else if (streak < 7) {
          streakMessage.textContent = 'Nice momentum! ' + streak + ' days in!';
        } else if (streak < 30) {
          streakMessage.textContent = 'Fantastic! ' + streak + ' days of gratitude!';
        } else {
          streakMessage.textContent = 'Amazing dedication! ' + streak + ' days strong!';
        }
      }
    }

    renderStats() {
      const weekValue = document.getElementById('weekValue');
      const monthValue = document.getElementById('monthValue');
      const totalValue = document.getElementById('totalValue');

      if (weekValue) {
        weekValue.textContent = String(this.getThisWeekCount());
      }
      if (monthValue) {
        monthValue.textContent = String(this.getThisMonthCount());
      }
      if (totalValue) {
        totalValue.textContent = String(this.getTotalCount());
      }
    }

    renderCalendar() {
      const currentMonth = document.getElementById('currentMonth');
      const calendarGrid = document.getElementById('calendarGrid');

      if (!calendarGrid) return;

      if (currentMonth) {
        currentMonth.textContent = this.formatMonthYear(this.currentMonth);
      }

      calendarGrid.innerHTML = '';

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayNames.forEach((name) => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = name;
        calendarGrid.appendChild(dayHeader);
      });

      const year = this.currentMonth.getFullYear();
      const month = this.currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const prevLastDay = new Date(year, month, 0);

      const firstDayIndex = firstDay.getDay();
      const lastDayDate = lastDay.getDate();
      const prevLastDayDate = prevLastDay.getDate();

      let dayCounter = 0;

      for (let i = firstDayIndex; i > 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = String(prevLastDayDate - i + 1);
        calendarGrid.appendChild(day);
        dayCounter++;
      }

      const today = new Date();
      const todayKey = this.formatDateKey(today);

      for (let i = 1; i <= lastDayDate; i++) {
        const day = document.createElement('div');
        const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(i).padStart(2, '0');

        day.className = 'calendar-day';
        day.textContent = String(i);

        if (this.getDateEntry(dateStr).length > 0) {
          day.classList.add('has-gratitude');
        }

        if (dateStr === todayKey) {
          day.classList.add('today');
        }

        calendarGrid.appendChild(day);
        dayCounter++;
      }

      for (let i = 1; dayCounter % 7 !== 0; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = String(i);
        calendarGrid.appendChild(day);
        dayCounter++;
      }
    }

    renderHistory() {
      const historyList = document.getElementById('historyList');
      const historyEmpty = document.getElementById('historyEmpty');

      if (!historyList || !historyEmpty) return;

      const filtered = this.getFilteredEntries().sort((a, b) => b.timestamp - a.timestamp);

      historyList.innerHTML = '';

      if (filtered.length === 0) {
        historyEmpty.style.display = 'block';
        return;
      }

      historyEmpty.style.display = 'none';

      filtered.forEach((gratitude) => {
        const item = document.createElement('div');
        item.className = 'history-item';

        const dateDisplay = this.formatPrettyDate(gratitude.date);
        const escapedText = this.escapeHtml(gratitude.text);

        item.innerHTML =
          '<div class="history-item-date">' + dateDisplay + ' at ' + gratitude.time + '</div>' +
          '<p class="history-item-text">' + escapedText + '</p>' +
          '<div class="history-item-meta">Gratitude #' + gratitude.id + '</div>' +
          '<div class="history-item-actions">' +
          '<button class="history-item-delete" type="button" data-id="' + gratitude.id + '">Delete</button>' +
          '</div>';

        const deleteBtn = item.querySelector('.history-item-delete');
        deleteBtn?.addEventListener('click', () => {
          this.deleteGratitude(gratitude.id);
        });

        historyList.appendChild(item);
      });
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    new GratitudeTracker();
  });
})();
