(function () {
  'use strict';

  class HabitTrackerJournal {
    constructor() {
      this.HABITS_KEY = 'memory_journal_habit_tracker_habits';
      this.RECORDS_KEY = 'memory_journal_habit_tracker_records';
      this.defaultHabits = [
        { id: 'drink-water', name: 'Drink Water', icon: '💧', color: '#4f8cff', note: 'Keep a water bottle nearby.' },
        { id: 'move-body', name: 'Move Body', icon: '🏃', color: '#2f9d67', note: 'Stretch, walk, or work out.' },
        { id: 'read-pages', name: 'Read Pages', icon: '📚', color: '#8b6f47', note: 'Read a few pages before bed.' },
        { id: 'reflect', name: 'Reflect', icon: '📝', color: '#c45d2b', note: 'Write one quick journal note.' }
      ];
      this.quotes = [
        { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', source: 'James Clear' },
        { text: 'Small disciplines repeated with consistency every day lead to great achievements.', source: 'John C. Maxwell' },
        { text: 'Success is the sum of small efforts, repeated day in and day out.', source: 'Robert Collier' },
        { text: 'What gets measured gets managed.', source: 'Peter Drucker' },
        { text: 'A habit is just a decision that you make at some point and then stop thinking about.', source: 'Charles Duhigg' }
      ];
      this.habits = this.loadHabits();
      this.records = this.loadRecords();
      this.currentMonth = this.startOfMonth(new Date());
      this.selectedDate = this.startOfDay(new Date());
      this.editingHabitId = null;
      this.init();
    }

    init() {
      this.seedDefaults();
      this.setupTheme();
      this.bindEvents();
      this.render();
    }

    setupTheme() {
      if (window.ThemeManager && typeof window.ThemeManager.init === 'function') {
        window.ThemeManager.init();
      }

      const themeToggle = document.getElementById('theme-toggle');
      themeToggle?.addEventListener('click', () => {
        if (window.ThemeManager && typeof window.ThemeManager.cycleTheme === 'function') {
          window.ThemeManager.cycleTheme();
          return;
        }

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('memory_journal_theme', nextTheme);
      });
    }

    bindEvents() {
      document.getElementById('habitForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        this.handleHabitSubmit();
      });

      document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
        this.clearForm();
      });

      document.getElementById('prevDayBtn')?.addEventListener('click', () => {
        this.moveSelectedDate(-1);
      });

      document.getElementById('todayBtn')?.addEventListener('click', () => {
        this.setSelectedDate(new Date());
      });

      document.getElementById('nextDayBtn')?.addEventListener('click', () => {
        this.moveSelectedDate(1);
      });

      document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
        this.currentMonth = this.startOfMonth(this.shiftMonth(this.currentMonth, -1));
        this.renderCalendar();
      });

      document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
        this.currentMonth = this.startOfMonth(this.shiftMonth(this.currentMonth, 1));
        this.renderCalendar();
      });

      document.getElementById('resetDataBtn')?.addEventListener('click', () => {
        if (!window.confirm('Reset all habit data? This will remove your habits and tracking history.')) {
          return;
        }

        this.habits = [];
        this.records = {};
        this.saveData();
        this.seedDefaults();
        this.clearForm();
        this.render();
      });

      ['habitName', 'habitIcon', 'habitNote'].forEach((id) => {
        document.getElementById(id)?.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            this.handleHabitSubmit();
          }
        });
      });
    }

    seedDefaults() {
      if (!Array.isArray(this.habits) || this.habits.length === 0) {
        this.habits = this.defaultHabits.map((habit) => ({
          id: habit.id,
          name: habit.name,
          icon: habit.icon,
          color: habit.color,
          note: habit.note,
          createdAt: Date.now()
        }));
        this.saveData();
      }
    }

    loadHabits() {
      try {
        const stored = localStorage.getItem(this.HABITS_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed
          .filter((habit) => habit && typeof habit === 'object')
          .map((habit) => ({
            id: String(habit.id || this.createId('habit')),
            name: String(habit.name || '').trim(),
            icon: String(habit.icon || '⭐').trim() || '⭐',
            color: String(habit.color || '#4f8cff'),
            note: String(habit.note || '').trim(),
            createdAt: Number(habit.createdAt || Date.now())
          }))
          .filter((habit) => habit.name.length > 0);
      } catch (error) {
        return [];
      }
    }

    loadRecords() {
      try {
        const stored = localStorage.getItem(this.RECORDS_KEY);
        const parsed = stored ? JSON.parse(stored) : {};
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return {};
        }

        const sanitized = {};
        Object.entries(parsed).forEach(([dateKey, value]) => {
          if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
            return;
          }

          const ids = Array.isArray(value) ? value : value && Array.isArray(value.completedHabitIds) ? value.completedHabitIds : [];
          sanitized[dateKey] = [...new Set(ids.map((id) => String(id)))].filter(Boolean);
        });
        return sanitized;
      } catch (error) {
        return {};
      }
    }

    saveData() {
      localStorage.setItem(this.HABITS_KEY, JSON.stringify(this.habits));
      localStorage.setItem(this.RECORDS_KEY, JSON.stringify(this.records));
    }

    createId(prefix) {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }

    startOfDay(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    startOfMonth(date) {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    shiftMonth(date, offset) {
      const next = new Date(date);
      next.setMonth(next.getMonth() + offset);
      return next;
    }

    formatDateKey(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    parseDateKey(dateKey) {
      return new Date(`${dateKey}T00:00:00`);
    }

    formatLongDate(date) {
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }

    formatShortDate(date) {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    }

    formatMonthLabel(date) {
      return date.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
      });
    }

    getTodayKey() {
      return this.formatDateKey(this.startOfDay(new Date()));
    }

    getSelectedDateKey() {
      return this.formatDateKey(this.selectedDate);
    }

    isDateKeyPast(dateKey) {
      return dateKey < this.getTodayKey();
    }

    setSelectedDate(date) {
      this.selectedDate = this.startOfDay(date);
      this.currentMonth = this.startOfMonth(this.selectedDate);
      this.render();
    }

    moveSelectedDate(offsetDays) {
      const next = new Date(this.selectedDate);
      next.setDate(next.getDate() + offsetDays);
      this.setSelectedDate(next);
    }

    getRecord(dateKey) {
      const record = this.records[dateKey];
      return Array.isArray(record) ? record : [];
    }

    setRecord(dateKey, habitIds) {
      const uniqueIds = [...new Set(habitIds.filter(Boolean))];
      if (uniqueIds.length === 0) {
        delete this.records[dateKey];
      } else {
        this.records[dateKey] = uniqueIds;
      }
      this.saveData();
    }

    getHabitStatus(habitId, dateKey) {
      const record = this.getRecord(dateKey);
      if (record.length === 0) {
        return 'not-tracked';
      }

      if (record.includes(habitId)) {
        return 'completed';
      }

      return this.isDateKeyPast(dateKey) ? 'missed' : 'not-tracked';
    }

    getDayStatus(dateKey) {
      const record = this.getRecord(dateKey);
      if (record.length === 0) {
        return 'not-tracked';
      }

      if (record.length >= this.habits.length && this.habits.length > 0) {
        return 'completed';
      }

      return 'missed';
    }

    getSelectedDayStats() {
      const selectedKey = this.getSelectedDateKey();
      const record = this.getRecord(selectedKey);
      const completed = record.filter((habitId) => this.habits.some((habit) => habit.id === habitId)).length;
      const total = this.habits.length;
      return { completed, total };
    }

    getOverallStreak() {
      let streak = 0;
      let cursor = this.startOfDay(new Date());

      while (this.habits.length > 0) {
        const key = this.formatDateKey(cursor);
        const record = this.getRecord(key);

        if (record.length > 0 && record.length >= this.habits.length) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }

        break;
      }

      return streak;
    }

    getHabitStreak(habitId) {
      let streak = 0;
      let cursor = this.startOfDay(new Date());

      while (true) {
        const key = this.formatDateKey(cursor);
        if (this.getHabitStatus(habitId, key) === 'completed') {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }

        break;
      }

      return streak;
    }

    getMonthScope(date) {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const today = this.startOfDay(new Date());

      if (year === today.getFullYear() && month === today.getMonth()) {
        return {
          start: firstDay,
          end: today < lastDay ? today : lastDay
        };
      }

      return {
        start: firstDay,
        end: lastDay
      };
    }

    getHabitMonthCompletion(habitId) {
      const { start, end } = this.getMonthScope(this.currentMonth);
      const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
      let completedDays = 0;

      for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const key = this.formatDateKey(cursor);
        if (this.getHabitStatus(habitId, key) === 'completed') {
          completedDays += 1;
        }
      }

      return {
        completedDays,
        totalDays,
        percent: Math.round((completedDays / totalDays) * 100)
      };
    }

    getMonthOverallRate() {
      const { start, end } = this.getMonthScope(this.currentMonth);
      const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
      const totalPossible = totalDays * Math.max(this.habits.length, 1);
      let completed = 0;

      for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const key = this.formatDateKey(cursor);
        const record = this.getRecord(key);
        completed += record.filter((habitId) => this.habits.some((habit) => habit.id === habitId)).length;
      }

      return Math.round((completed / totalPossible) * 100);
    }

    getCurrentQuote() {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 0);
      const dayOfYear = Math.floor((today - startOfYear) / 86400000);
      return this.quotes[dayOfYear % this.quotes.length];
    }

    handleHabitSubmit() {
      const nameInput = document.getElementById('habitName');
      const iconInput = document.getElementById('habitIcon');
      const noteInput = document.getElementById('habitNote');
      const colorInput = document.getElementById('habitColor');

      const name = String(nameInput?.value || '').trim();
      const icon = String(iconInput?.value || '⭐').trim() || '⭐';
      const note = String(noteInput?.value || '').trim();
      const color = String(colorInput?.value || '#4f8cff');

      if (!name) {
        window.alert('Please give your habit a name.');
        return;
      }

      if (this.editingHabitId) {
        const habitIndex = this.habits.findIndex((habit) => habit.id === this.editingHabitId);
        if (habitIndex === -1) {
          this.clearForm();
          return;
        }

        this.habits[habitIndex] = {
          ...this.habits[habitIndex],
          name,
          icon,
          note,
          color
        };
      } else {
        this.habits.unshift({
          id: this.createId('habit'),
          name,
          icon,
          note,
          color,
          createdAt: Date.now()
        });
      }

      this.saveData();
      this.clearForm();
      this.render();
    }

    startEditingHabit(habitId) {
      const habit = this.habits.find((item) => item.id === habitId);
      if (!habit) {
        return;
      }

      this.editingHabitId = habit.id;
      const nameInput = document.getElementById('habitName');
      const iconInput = document.getElementById('habitIcon');
      const noteInput = document.getElementById('habitNote');
      const colorInput = document.getElementById('habitColor');
      const heading = document.getElementById('habitFormHeading');
      const saveButton = document.getElementById('saveHabitBtn');
      const cancelButton = document.getElementById('cancelEditBtn');

      if (nameInput) nameInput.value = habit.name;
      if (iconInput) iconInput.value = habit.icon;
      if (noteInput) noteInput.value = habit.note || '';
      if (colorInput) colorInput.value = habit.color || '#4f8cff';
      if (heading) heading.textContent = 'Edit Habit';
      if (saveButton) saveButton.textContent = 'Update Habit';
      if (cancelButton) cancelButton.hidden = false;
    }

    clearForm() {
      this.editingHabitId = null;
      const form = document.getElementById('habitForm');
      form?.reset();

      const colorInput = document.getElementById('habitColor');
      if (colorInput) {
        colorInput.value = '#4f8cff';
      }

      const heading = document.getElementById('habitFormHeading');
      const saveButton = document.getElementById('saveHabitBtn');
      const cancelButton = document.getElementById('cancelEditBtn');

      if (heading) heading.textContent = 'Add Habit';
      if (saveButton) saveButton.textContent = 'Add Habit';
      if (cancelButton) cancelButton.hidden = true;
    }

    deleteHabit(habitId) {
      const habit = this.habits.find((item) => item.id === habitId);
      if (!habit) {
        return;
      }

      if (!window.confirm(`Delete ${habit.name}? This will also remove it from all tracking history.`)) {
        return;
      }

      this.habits = this.habits.filter((item) => item.id !== habitId);
      Object.keys(this.records).forEach((dateKey) => {
        const updated = this.getRecord(dateKey).filter((id) => id !== habitId);
        this.setRecord(dateKey, updated);
      });
      this.saveData();
      if (this.editingHabitId === habitId) {
        this.clearForm();
      }
      this.render();
    }

    toggleHabitCompletion(habitId, checked) {
      const dateKey = this.getSelectedDateKey();
      const record = this.getRecord(dateKey);
      const nextRecord = checked
        ? [...new Set([...record, habitId])]
        : record.filter((id) => id !== habitId);

      this.setRecord(dateKey, nextRecord);
      this.renderSummary();
      this.renderHabitList();
      this.renderCalendar();
      this.renderStats();
    }

    render() {
      this.renderSummary();
      this.renderSelectedDateHeader();
      this.renderHabitList();
      this.renderQuote();
      this.renderCalendar();
      this.renderStats();
    }

    renderSummary() {
      const { completed, total } = this.getSelectedDayStats();
      const todayProgressValue = document.getElementById('todayProgressValue');
      const todayProgressNote = document.getElementById('todayProgressNote');
      const streakValue = document.getElementById('streakValue');
      const streakNote = document.getElementById('streakNote');
      const habitCountValue = document.getElementById('habitCountValue');
      const habitCountNote = document.getElementById('habitCountNote');
      const monthRateValue = document.getElementById('monthRateValue');
      const monthRateNote = document.getElementById('monthRateNote');

      if (todayProgressValue) {
        todayProgressValue.textContent = `${completed}/${total}`;
      }

      if (todayProgressNote) {
        if (total === 0) {
          todayProgressNote.textContent = 'No habits yet.';
        } else if (completed === total && total > 0) {
          todayProgressNote.textContent = 'Perfect day so far.';
        } else {
          todayProgressNote.textContent = `${total - completed} habit${total - completed === 1 ? '' : 's'} left to complete.`;
        }
      }

      const currentStreak = this.getOverallStreak();
      if (streakValue) {
        streakValue.textContent = String(currentStreak);
      }
      if (streakNote) {
        streakNote.textContent = currentStreak === 0 ? 'Track something today to start your streak.' : 'Keep the streak alive tomorrow.';
      }

      if (habitCountValue) {
        habitCountValue.textContent = String(this.habits.length);
      }
      if (habitCountNote) {
        habitCountNote.textContent = this.habits.length === 0 ? 'Create a few routines to begin.' : 'Edit or delete habits anytime.';
      }

      const monthRate = this.getMonthOverallRate();
      if (monthRateValue) {
        monthRateValue.textContent = `${monthRate}%`;
      }
      if (monthRateNote) {
        monthRateNote.textContent = this.habits.length === 0 ? 'Add a habit to see monthly progress.' : 'Completion across all tracked habit-days.';
      }
    }

    renderSelectedDateHeader() {
      const selectedDateLabel = document.getElementById('selectedDateLabel');
      const selectedDateStatus = document.getElementById('selectedDateStatus');
      const selectedKey = this.getSelectedDateKey();

      if (selectedDateLabel) {
        selectedDateLabel.textContent = this.formatLongDate(this.selectedDate);
      }

      if (selectedDateStatus) {
        if (selectedKey === this.getTodayKey()) {
          selectedDateStatus.textContent = 'Tracking today. Check off the habits you complete before the day ends.';
        } else if (this.isDateKeyPast(selectedKey)) {
          selectedDateStatus.textContent = 'Reviewing a past day. Completed habits are green, missed habits are red.';
        } else {
          selectedDateStatus.textContent = 'Viewing a future date. Not tracked habits stay gray until the date arrives.';
        }
      }
    }

    renderHabitList() {
      const habitList = document.getElementById('habitList');
      const habitEmpty = document.getElementById('habitEmpty');

      if (!habitList || !habitEmpty) {
        return;
      }

      habitList.innerHTML = '';

      if (this.habits.length === 0) {
        habitEmpty.hidden = false;
        return;
      }

      habitEmpty.hidden = true;
      const selectedKey = this.getSelectedDateKey();

      this.habits.forEach((habit) => {
        const status = this.getHabitStatus(habit.id, selectedKey);
        const row = document.createElement('div');
        row.className = `habit-row is-${status}`;

        const swatch = document.createElement('div');
        swatch.className = 'habit-swatch';
        swatch.style.background = habit.color;
        swatch.textContent = habit.icon;

        const content = document.createElement('div');
        content.className = 'habit-content';

        const titleRow = document.createElement('div');
        titleRow.className = 'habit-title-row';

        const title = document.createElement('h3');
        title.className = 'habit-name';
        title.textContent = habit.name;

        const statusPill = document.createElement('span');
        statusPill.className = `status-pill ${status}`;
        statusPill.textContent = status === 'completed' ? 'Completed' : status === 'missed' ? 'Missed' : 'Not tracked';

        titleRow.append(title, statusPill);

        const note = document.createElement('p');
        note.className = 'habit-note';
        note.textContent = habit.note || 'No focus note added.';

        const meta = document.createElement('div');
        meta.className = 'habit-meta';

        const streak = document.createElement('span');
        streak.className = `mini-pill ${status}`;
        streak.textContent = `${this.getHabitStreak(habit.id)} day streak`;

        const dateInfo = document.createElement('span');
        dateInfo.className = 'mini-pill not-tracked';
        dateInfo.textContent = selectedKey === this.getTodayKey() ? 'Today' : this.formatShortDate(this.selectedDate);

        meta.append(streak, dateInfo);

        content.append(titleRow, note, meta);

        const actions = document.createElement('div');
        actions.className = 'habit-actions';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'habit-check';
        checkbox.checked = status === 'completed';
        checkbox.setAttribute('aria-label', `Mark ${habit.name} complete for ${this.formatLongDate(this.selectedDate)}`);
        checkbox.addEventListener('change', () => this.toggleHabitCompletion(habit.id, checkbox.checked));

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'icon-action';
        editButton.setAttribute('aria-label', `Edit ${habit.name}`);
        editButton.innerHTML = '<i class="fas fa-pen" aria-hidden="true"></i>';
        editButton.addEventListener('click', () => this.startEditingHabit(habit.id));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'icon-action';
        deleteButton.setAttribute('aria-label', `Delete ${habit.name}`);
        deleteButton.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';
        deleteButton.addEventListener('click', () => this.deleteHabit(habit.id));

        actions.append(checkbox, editButton, deleteButton);

        row.append(swatch, content, actions);
        habitList.appendChild(row);
      });
    }

    renderQuote() {
      const quoteText = document.getElementById('quoteText');
      const quoteSource = document.getElementById('quoteSource');
      const quote = this.getCurrentQuote();

      if (quoteText) {
        quoteText.textContent = `“${quote.text}”`;
      }

      if (quoteSource) {
        quoteSource.textContent = `— ${quote.source}`;
      }
    }

    renderCalendar() {
      const calendar = document.getElementById('habitCalendar');
      const monthLabel = document.getElementById('calendarMonthLabel');
      if (!calendar) {
        return;
      }

      if (monthLabel) {
        monthLabel.textContent = this.formatMonthLabel(this.currentMonth);
      }

      calendar.innerHTML = '';

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayNames.forEach((dayName) => {
        const label = document.createElement('div');
        label.className = 'calendar-day-label';
        label.textContent = dayName;
        calendar.appendChild(label);
      });

      const year = this.currentMonth.getFullYear();
      const month = this.currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const firstDayIndex = firstDay.getDay();
      const lastDate = lastDay.getDate();
      const previousMonthLastDay = new Date(year, month, 0).getDate();
      const todayKey = this.getTodayKey();
      const selectedKey = this.getSelectedDateKey();

      for (let index = firstDayIndex; index > 0; index -= 1) {
        const dateNumber = previousMonthLastDay - index + 1;
        const date = new Date(year, month - 1, dateNumber);
        calendar.appendChild(this.createCalendarDay(date, true, selectedKey, todayKey));
      }

      for (let day = 1; day <= lastDate; day += 1) {
        const date = new Date(year, month, day);
        calendar.appendChild(this.createCalendarDay(date, false, selectedKey, todayKey));
      }

      const totalCells = firstDayIndex + lastDate;
      const remaining = (7 - (totalCells % 7)) % 7;

      for (let day = 1; day <= remaining; day += 1) {
        const date = new Date(year, month + 1, day);
        calendar.appendChild(this.createCalendarDay(date, true, selectedKey, todayKey));
      }
    }

    createCalendarDay(date, isOutsideMonth, selectedKey, todayKey) {
      const dateKey = this.formatDateKey(date);
      const status = this.getDayStatus(dateKey);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `calendar-day is-${status}${isOutsideMonth ? ' is-outside' : ''}${dateKey === selectedKey ? ' is-selected' : ''}`;
      button.setAttribute('aria-label', `${this.formatLongDate(date)}. ${status.replace('-', ' ')}.`);

      const number = document.createElement('span');
      number.className = 'calendar-day-number';
      number.textContent = String(date.getDate());

      const summary = document.createElement('span');
      summary.className = 'calendar-day-summary';

      if (this.habits.length === 0) {
        summary.textContent = 'No habits';
      } else if (status === 'completed' || status === 'missed') {
        summary.textContent = `${this.getRecord(dateKey).length}/${this.habits.length}`;
      } else {
        summary.textContent = 'Gray';
      }

      if (dateKey === todayKey) {
        summary.textContent = `${summary.textContent} • Today`;
      }

      button.append(number, summary);
      button.addEventListener('click', () => {
        this.setSelectedDate(date);
      });

      return button;
    }

    renderStats() {
      const statsList = document.getElementById('habitStatsList');
      if (!statsList) {
        return;
      }

      statsList.innerHTML = '';

      if (this.habits.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-copy';
        empty.textContent = 'Create a habit to see monthly statistics here.';
        statsList.appendChild(empty);
        return;
      }

      this.habits.forEach((habit) => {
        const progress = this.getHabitMonthCompletion(habit.id);
        const item = document.createElement('article');
        item.className = 'habit-stat-item';

        const top = document.createElement('div');
        top.className = 'habit-stat-top';

        const nameWrap = document.createElement('div');
        nameWrap.className = 'habit-stat-name';

        const icon = document.createElement('span');
        icon.className = 'habit-stat-icon';
        icon.style.background = habit.color;
        icon.textContent = habit.icon;

        const name = document.createElement('strong');
        name.textContent = habit.name;

        nameWrap.append(icon, name);

        const percent = document.createElement('span');
        percent.className = 'habit-stat-percent';
        percent.textContent = `${progress.percent}%`;

        top.append(nameWrap, percent);

        const track = document.createElement('div');
        track.className = 'progress-track';

        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = `${Math.max(4, progress.percent)}%`;
        fill.style.background = habit.color;
        track.appendChild(fill);

        const meta = document.createElement('div');
        meta.className = 'habit-stat-meta';

        const streak = document.createElement('span');
        streak.className = 'mini-pill completed';
        streak.textContent = `${this.getHabitStreak(habit.id)} day streak`;

        const completedDays = document.createElement('span');
        completedDays.className = 'mini-pill not-tracked';
        completedDays.textContent = `${progress.completedDays}/${progress.totalDays} days this month`;

        meta.append(streak, completedDays);

        item.append(top, track, meta);
        statsList.appendChild(item);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    new HabitTrackerJournal();
  });
})();