/**
 * MOOD JOURNAL - Main Application Logic
 * Track moods, activities, and journal entries with charts and statistics
 */

/* ============================================
   APP STATE & CONFIGURATION
   ============================================ */

class MoodJournal {
  constructor() {
    this.STORAGE_KEY = 'mood_journal_entries';
    this.MOODS_KEY = 'mood_journal_moods';
    this.ACTIVITIES_KEY = 'mood_journal_activities';
    this.THEME_KEY = 'memory_journal_theme';
    this.NOTIFICATIONS_KEY = 'mood_journal_notifications';

    // Default moods with emojis
    this.defaultMoods = [
      { id: 'happy', label: 'Happy', emoji: '😄', color: '#FFD700' },
      { id: 'good', label: 'Good', emoji: '😊', color: '#87CEEB' },
      { id: 'neutral', label: 'Neutral', emoji: '😐', color: '#D3D3D3' },
      { id: 'sad', label: 'Sad', emoji: '😢', color: '#4169E1' },
      { id: 'angry', label: 'Angry', emoji: '😠', color: '#DC143C' }
    ];

    // Default activities with emojis
    this.defaultActivities = [
      { id: 'study', label: 'Study', emoji: '📚' },
      { id: 'exercise', label: 'Exercise', emoji: '💪' },
      { id: 'work', label: 'Work', emoji: '💼' },
      { id: 'friends', label: 'Friends', emoji: '👥' },
      { id: 'gaming', label: 'Gaming', emoji: '🎮' },
      { id: 'reading', label: 'Reading', emoji: '📖' },
      { id: 'cooking', label: 'Cooking', emoji: '🍳' },
      { id: 'music', label: 'Music', emoji: '🎵' }
    ];

    this.moods = [];
    this.activities = [];
    this.entries = [];
    this.selectedMood = null;
    this.selectedActivities = [];
    this.currentEditingEntryId = null;
    this.currentMonth = new Date();
    this.charts = {};

    this.init();
  }

  init() {
    this.loadData();
    this.setupEventListeners();
    this.renderMoodButtons();
    this.renderActivityButtons();
    this.renderEntries();
    this.renderCalendar();
    this.updateStatistics();
    this.setupTheme();
    this.setupNotifications();
  }

  /* ============================================
     DATA MANAGEMENT
     ============================================ */

  loadData() {
    // Load entries
    const savedEntries = localStorage.getItem(this.STORAGE_KEY);
    this.entries = savedEntries ? JSON.parse(savedEntries) : [];

    // Load or initialize moods
    const savedMoods = localStorage.getItem(this.MOODS_KEY);
    this.moods = savedMoods ? JSON.parse(savedMoods) : this.defaultMoods;

    // Load or initialize activities
    const savedActivities = localStorage.getItem(this.ACTIVITIES_KEY);
    this.activities = savedActivities ? JSON.parse(savedActivities) : this.defaultActivities;
  }

  saveData() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries));
    localStorage.setItem(this.MOODS_KEY, JSON.stringify(this.moods));
    localStorage.setItem(this.ACTIVITIES_KEY, JSON.stringify(this.activities));
  }

  /* ============================================
     EVENT LISTENERS
     ============================================ */

  setupEventListeners() {
    // Entry form
    document.getElementById('saveEntryBtn')?.addEventListener('click', () => this.saveEntry());
    document.getElementById('entryNotes')?.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        this.saveEntry();
      }
    });

    // Filter and search
    document.getElementById('filterMood')?.addEventListener('change', () => this.renderEntries());
    document.getElementById('searchInput')?.addEventListener('input', () => this.renderEntries());

    // Calendar
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => this.previousMonth());
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => this.nextMonth());

    // Export
    document.getElementById('exportBtn')?.addEventListener('click', () => this.exportEntries());

    // Settings modal
    document.getElementById('settingsBtn')?.addEventListener('click', () => this.openModal('settingsModal'));
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.closeModal('settingsModal'));

    // Modal actions
    document.querySelectorAll('[data-action="close-modal"]').forEach(el => {
      el.addEventListener('click', (e) => {
        const modalId = e.target.closest('.modal')?.id || 'settingsModal';
        this.closeModal(modalId);
      });
    });

    // Settings - Export/Clear
    document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportDataJSON());
    document.getElementById('exportCSVBtn')?.addEventListener('click', () => this.exportDataCSV());
    document.getElementById('clearDataBtn')?.addEventListener('click', () => this.clearAllData());

    // Settings - Customize moods/activities
    document.getElementById('addMoodBtn')?.addEventListener('click', () => this.addMoodPrompt());
    document.getElementById('addActivityBtn')?.addEventListener('click', () => this.addActivityPrompt());

    // Settings - Notifications
    document.getElementById('enableNotifications')?.addEventListener('change', (e) => {
      document.getElementById('notificationTimeGroup').style.display = e.target.checked ? 'flex' : 'none';
      this.toggleNotifications(e.target.checked);
    });

    // Edit modal actions
    document.getElementById('saveEditBtn')?.addEventListener('click', () => this.saveEdit());
    document.getElementById('deleteEntryBtn')?.addEventListener('click', () => this.deleteEntry());
    document.getElementById('cancelEditBtn')?.addEventListener('click', () => this.closeModal('editModal'));
  }

  /* ============================================
     MOOD & ACTIVITY SELECTION
     ============================================ */

  renderMoodButtons() {
    const moodSelector = document.getElementById('moodSelector');
    if (!moodSelector) return;

    moodSelector.innerHTML = '';
    this.moods.forEach(mood => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mood-btn ${this.selectedMood === mood.id ? 'selected' : ''}`;
      btn.innerHTML = `<span class="mood-emoji">${mood.emoji}</span><span>${mood.label}</span>`;
      btn.addEventListener('click', () => this.selectMood(mood.id));
      moodSelector.appendChild(btn);
    });
  }

  renderActivityButtons() {
    const activitySelector = document.getElementById('activitySelector');
    if (!activitySelector) return;

    activitySelector.innerHTML = '';
    this.activities.forEach(activity => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `activity-btn ${this.selectedActivities.includes(activity.id) ? 'selected' : ''}`;
      btn.innerHTML = `<span class="activity-emoji">${activity.emoji}</span><span>${activity.label}</span>`;
      btn.addEventListener('click', () => this.toggleActivity(activity.id));
      activitySelector.appendChild(btn);
    });
  }

  selectMood(moodId) {
    this.selectedMood = this.selectedMood === moodId ? null : moodId;
    document.getElementById('selectedMood').value = this.selectedMood || '';
    this.renderMoodButtons();
  }

  toggleActivity(activityId) {
    const index = this.selectedActivities.indexOf(activityId);
    if (index > -1) {
      this.selectedActivities.splice(index, 1);
    } else {
      this.selectedActivities.push(activityId);
    }
    this.renderActivityButtons();
  }

  /* ============================================
     ENTRY MANAGEMENT
     ============================================ */

  saveEntry() {
    if (!this.selectedMood) {
      this.showMessage('Please select a mood first', 'error');
      return;
    }

    const notes = document.getElementById('entryNotes').value.trim();
    const now = new Date();
    const dateStr = this.formatDate(now);

    // Check for duplicate entries on the same day
    const existingEntry = this.entries.find(e => this.formatDate(new Date(e.date)) === dateStr);
    if (existingEntry) {
      if (!confirm('You already have an entry for today. Replace it?')) {
        return;
      }
      this.entries = this.entries.filter(e => e.id !== existingEntry.id);
    }

    const entry = {
      id: `entry_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
      date: now.toISOString(),
      mood: this.selectedMood,
      activities: [...this.selectedActivities],
      notes: notes
    };

    this.entries.unshift(entry);
    this.saveData();

    // Reset form
    this.selectedMood = null;
    this.selectedActivities = [];
    document.getElementById('entryNotes').value = '';
    document.getElementById('selectedMood').value = '';

    this.renderMoodButtons();
    this.renderActivityButtons();
    this.renderEntries();
    this.renderCalendar();
    this.updateStatistics();
    this.showMessage('Entry saved successfully! 🎉', 'success');
  }

  renderEntries() {
    const entriesList = document.getElementById('entriesList');
    const noEntriesMsg = document.getElementById('noEntriesMessage');
    if (!entriesList) return;

    const filterMood = document.getElementById('filterMood').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();

    let filtered = this.entries.filter(entry => {
      const moodMatch = !filterMood || entry.mood === filterMood;
      const textMatch = !searchText ||
        entry.notes.toLowerCase().includes(searchText) ||
        this.getMoodLabel(entry.mood).toLowerCase().includes(searchText) ||
        entry.activities.some(a => this.getActivityLabel(a).toLowerCase().includes(searchText));
      return moodMatch && textMatch;
    });

    entriesList.innerHTML = '';

    if (filtered.length === 0) {
      noEntriesMsg.style.display = 'block';
      return;
    }

    noEntriesMsg.style.display = 'none';

    filtered.forEach(entry => {
      const entryCard = this.createEntryCard(entry);
      entriesList.appendChild(entryCard);
    });

    // Update filter dropdown
    this.updateFilterDropdown();
  }

  createEntryCard(entry) {
    const card = document.createElement('div');
    card.className = 'entry-card';

    const mood = this.moods.find(m => m.id === entry.mood);
    const date = new Date(entry.date);
    const dateStr = this.formatDateLong(date);

    const activitiesHTML = entry.activities.map(actId => {
      const activity = this.activities.find(a => a.id === actId);
      return `<span class="activity-tag">${activity.emoji} ${activity.label}</span>`;
    }).join('');

    card.innerHTML = `
      <div class="entry-header">
        <div>
          <div class="entry-mood">
            <span class="entry-mood-emoji">${mood.emoji}</span>
            <span>${mood.label}</span>
          </div>
          <div class="entry-date">${dateStr}</div>
        </div>
        <div class="entry-actions">
          <button class="entry-action-btn" title="Edit entry" data-action="edit-entry" data-entry-id="${entry.id}">✏️</button>
        </div>
      </div>
      ${activitiesHTML ? `<div class="entry-activities">${activitiesHTML}</div>` : ''}
      ${entry.notes ? `<div class="entry-notes">${this.escapeHtml(entry.notes)}</div>` : ''}
    `;

    card.querySelector('[data-action="edit-entry"]').addEventListener('click', (e) => {
      this.openEditModal(entry.id);
    });

    return card;
  }

  openEditModal(entryId) {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry) return;

    this.currentEditingEntryId = entryId;

    // Populate edit form
    const editMoodSelector = document.getElementById('editMoodSelector');
    editMoodSelector.innerHTML = '';
    this.moods.forEach(mood => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `mood-btn ${entry.mood === mood.id ? 'selected' : ''}`;
      btn.innerHTML = `<span class="mood-emoji">${mood.emoji}</span><span>${mood.label}</span>`;
      btn.addEventListener('click', () => {
        document.querySelectorAll('#editMoodSelector .mood-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      editMoodSelector.appendChild(btn);
    });

    const editActivitySelector = document.getElementById('editActivitySelector');
    editActivitySelector.innerHTML = '';
    this.activities.forEach(activity => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `activity-btn ${entry.activities.includes(activity.id) ? 'selected' : ''}`;
      btn.innerHTML = `<span class="activity-emoji">${activity.emoji}</span><span>${activity.label}</span>`;
      btn.addEventListener('click', () => btn.classList.toggle('selected'));
      editActivitySelector.appendChild(btn);
    });

    document.getElementById('editNotes').value = entry.notes;

    this.openModal('editModal');
  }

  saveEdit() {
    const entry = this.entries.find(e => e.id === this.currentEditingEntryId);
    if (!entry) return;

    const selectedMoodBtn = document.querySelector('#editMoodSelector .mood-btn.selected');
    if (!selectedMoodBtn) {
      this.showMessage('Please select a mood', 'error');
      return;
    }

    const mood = this.moods.find(m => m.label === selectedMoodBtn.textContent.trim());
    entry.mood = mood.id;

    const selectedActivityBtns = document.querySelectorAll('#editActivitySelector .activity-btn.selected');
    entry.activities = Array.from(selectedActivityBtns).map(btn => {
      const activity = this.activities.find(a => a.label === btn.textContent.trim());
      return activity.id;
    });

    entry.notes = document.getElementById('editNotes').value.trim();

    this.saveData();
    this.renderEntries();
    this.renderCalendar();
    this.updateStatistics();
    this.closeModal('editModal');
    this.showMessage('Entry updated successfully! ✓', 'success');
  }

  deleteEntry() {
    if (confirm('Are you sure you want to delete this entry?')) {
      this.entries = this.entries.filter(e => e.id !== this.currentEditingEntryId);
      this.saveData();
      this.renderEntries();
      this.renderCalendar();
      this.updateStatistics();
      this.closeModal('editModal');
      this.showMessage('Entry deleted', 'success');
    }
  }

  /* ============================================
     CALENDAR
     ============================================ */

  renderCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dayEl = this.createCalendarDay(day, true, null);
      calendarGrid.appendChild(dayEl);
    }

    // Days of current month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const hasEntry = this.entries.some(e => this.formatDate(new Date(e.date)) === this.formatDate(date));
      const isToday = date.toDateString() === today.toDateString();
      const dayEl = this.createCalendarDay(day, false, { hasEntry, isToday, date });
      calendarGrid.appendChild(dayEl);
    }

    // Days from next month
    const remainingDays = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
      const dayEl = this.createCalendarDay(day, true, null);
      calendarGrid.appendChild(dayEl);
    }
  }

  createCalendarDay(day, isOtherMonth, info) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;

    if (isOtherMonth) {
      dayEl.classList.add('other-month');
    } else {
      if (info.hasEntry) dayEl.classList.add('has-entry');
      if (info.isToday) dayEl.classList.add('today');
      dayEl.addEventListener('click', () => this.scrollToDateEntry(info.date));
      dayEl.style.cursor = info.hasEntry ? 'pointer' : 'default';
    }

    return dayEl;
  }

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
    this.renderCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
    this.renderCalendar();
  }

  scrollToDateEntry(date) {
    const dateStr = this.formatDate(date);
    const entry = this.entries.find(e => this.formatDate(new Date(e.date)) === dateStr);
    if (entry) {
      // Clear filters first
      document.getElementById('filterMood').value = '';
      document.getElementById('searchInput').value = '';
      this.renderEntries();

      // Find and scroll to the card
      setTimeout(() => {
        const cards = document.querySelectorAll('.entry-card');
        for (let card of cards) {
          if (card.querySelector(`[data-entry-id="${entry.id}"]`)) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.animation = 'fadeIn 500ms';
            break;
          }
        }
      }, 100);
    }
  }

  /* ============================================
     STATISTICS & CHARTS
     ============================================ */

  updateStatistics() {
    // Total entries
    document.getElementById('totalEntries').textContent = this.entries.length;

    // Entries this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekEntries = this.entries.filter(e => new Date(e.date) > weekAgo).length;
    document.getElementById('weekEntries').textContent = weekEntries;

    // Most common mood
    const moodCounts = {};
    this.entries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    const commonMoodId = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a])[0];
    const commonMood = this.moods.find(m => m.id === commonMoodId);
    document.getElementById('commonMood').textContent = commonMood ? `${commonMood.emoji} ${commonMood.label}` : '-';

    // Current streak
    const streak = this.calculateStreak();
    document.getElementById('streak').textContent = streak;

    // Update charts
    this.updateMoodChart();
    this.updateActivityChart();
  }

  calculateStreak() {
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateStr = this.formatDate(currentDate);
      const hasEntry = this.entries.some(e => this.formatDate(new Date(e.date)) === dateStr);

      if (!hasEntry) break;

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  updateMoodChart() {
    const canvas = document.getElementById('moodChart');
    if (!canvas) return;

    // Get last 30 days of entries
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentEntries = this.entries.filter(e => new Date(e.date) > thirtyDaysAgo);

    const moodCounts = {};
    this.moods.forEach(mood => moodCounts[mood.id] = 0);
    recentEntries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });

    const labels = this.moods.map(m => `${m.emoji} ${m.label}`);
    const data = this.moods.map(m => moodCounts[m.id]);
    const backgroundColor = this.moods.map(m => m.color);

    this.createChart(canvas, 'moodChart', 'bar', {
      labels: labels,
      datasets: [{
        label: 'Mood Count',
        data: data,
        backgroundColor: backgroundColor,
        borderRadius: 8,
        borderSkipped: false
      }]
    });
  }

  updateActivityChart() {
    const canvas = document.getElementById('activityChart');
    if (!canvas) return;

    const activityCounts = {};
    this.activities.forEach(act => activityCounts[act.id] = 0);
    this.entries.forEach(entry => {
      entry.activities.forEach(actId => {
        activityCounts[actId] = (activityCounts[actId] || 0) + 1;
      });
    });

    // Sort by count and take top 8
    const sorted = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const labels = sorted.map(([id]) => {
      const act = this.activities.find(a => a.id === id);
      return `${act.emoji} ${act.label}`;
    });
    const data = sorted.map(([, count]) => count);
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA'];

    this.createChart(canvas, 'activityChart', 'bar', {
      labels: labels,
      datasets: [{
        label: 'Activity Count',
        data: data,
        backgroundColor: colors.slice(0, data.length),
        borderRadius: 8,
        borderSkipped: false
      }]
    }, true);
  }

  createChart(canvas, chartId, type, config, indexAxis = false) {
    if (this.charts[chartId]) {
      this.charts[chartId].destroy();
    }

    const ctx = canvas.getContext('2d');
    const options = {
      indexAxis: indexAxis ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    };

    this.charts[chartId] = new Chart(ctx, {
      type: type,
      data: config,
      options: options
    });
  }

  /* ============================================
     CUSTOMIZATION
     ============================================ */

  updateFilterDropdown() {
    const filterMood = document.getElementById('filterMood');
    filterMood.innerHTML = '<option value="">All Moods</option>';
    this.moods.forEach(mood => {
      const option = document.createElement('option');
      option.value = mood.id;
      option.textContent = `${mood.emoji} ${mood.label}`;
      filterMood.appendChild(option);
    });
  }

  addMoodPrompt() {
    const emoji = prompt('Enter mood emoji (e.g., 😍):');
    if (!emoji) return;

    const label = prompt('Enter mood label (e.g., Loved):');
    if (!label) return;

    const id = label.toLowerCase().replace(/\s+/g, '_');
    this.moods.push({ id, label, emoji, color: '#' + Math.floor(Math.random() * 16777215).toString(16) });
    this.saveData();
    this.renderCustomMoodsList();
    this.renderMoodButtons();
  }

  addActivityPrompt() {
    const emoji = prompt('Enter activity emoji (e.g., 🧘):');
    if (!emoji) return;

    const label = prompt('Enter activity label (e.g., Meditation):');
    if (!label) return;

    const id = label.toLowerCase().replace(/\s+/g, '_');
    this.activities.push({ id, label, emoji });
    this.saveData();
    this.renderCustomActivitiesList();
    this.renderActivityButtons();
  }

  renderCustomMoodsList() {
    const list = document.getElementById('customMoodsList');
    if (!list) return;

    list.innerHTML = '';
    this.moods.forEach(mood => {
      const item = document.createElement('div');
      item.className = 'custom-item';
      item.innerHTML = `
        <div class="custom-item-content">
          <div class="custom-item-emoji">${mood.emoji}</div>
          <div class="custom-item-label">${mood.label}</div>
        </div>
        <button class="custom-item-delete" data-mood-id="${mood.id}" title="Delete mood">✕</button>
      `;
      item.querySelector('.custom-item-delete').addEventListener('click', () => {
        this.deleteMood(mood.id);
      });
      list.appendChild(item);
    });
  }

  renderCustomActivitiesList() {
    const list = document.getElementById('customActivitiesList');
    if (!list) return;

    list.innerHTML = '';
    this.activities.forEach(activity => {
      const item = document.createElement('div');
      item.className = 'custom-item';
      item.innerHTML = `
        <div class="custom-item-content">
          <div class="custom-item-emoji">${activity.emoji}</div>
          <div class="custom-item-label">${activity.label}</div>
        </div>
        <button class="custom-item-delete" data-activity-id="${activity.id}" title="Delete activity">✕</button>
      `;
      item.querySelector('.custom-item-delete').addEventListener('click', () => {
        this.deleteActivity(activity.id);
      });
      list.appendChild(item);
    });
  }

  deleteMood(moodId) {
    if (confirm('Delete this mood? Entries with this mood will remain.')) {
      this.moods = this.moods.filter(m => m.id !== moodId);
      this.saveData();
      this.renderCustomMoodsList();
      this.renderMoodButtons();
    }
  }

  deleteActivity(activityId) {
    if (confirm('Delete this activity? Entries with this activity will remain.')) {
      this.activities = this.activities.filter(a => a.id !== activityId);
      this.saveData();
      this.renderCustomActivitiesList();
      this.renderActivityButtons();
    }
  }

  /* ============================================
     EXPORT & IMPORT
     ============================================ */

  exportEntries() {
    const filterMood = document.getElementById('filterMood').value;
    let toExport = this.entries;

    if (filterMood) {
      toExport = this.entries.filter(e => e.mood === filterMood);
    }

    this.downloadJSON(toExport, 'mood-journal-entries.json');
  }

  exportDataJSON() {
    const data = {
      entries: this.entries,
      moods: this.moods,
      activities: this.activities,
      exportDate: new Date().toISOString()
    };
    this.downloadJSON(data, 'mood-journal-backup.json');
    this.closeModal('settingsModal');
  }

  exportDataCSV() {
    let csv = 'Date,Mood,Activities,Notes\n';

    this.entries.forEach(entry => {
      const date = new Date(entry.date);
      const mood = this.getMoodLabel(entry.mood);
      const activities = entry.activities.map(a => this.getActivityLabel(a)).join('; ');
      const notes = `"${entry.notes.replace(/"/g, '""')}"`;

      csv += `${this.formatDateLong(date)},${mood},"${activities}",${notes}\n`;
    });

    this.downloadCSV(csv, 'mood-journal-entries.csv');
    this.closeModal('settingsModal');
  }

  downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadFile(blob, filename);
  }

  downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    this.downloadFile(blob, filename);
  }

  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  clearAllData() {
    if (confirm('This will permanently delete ALL your entries, moods, and activities. Are you sure?')) {
      if (confirm('Click OK again to confirm deletion.')) {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.MOODS_KEY);
        localStorage.removeItem(this.ACTIVITIES_KEY);
        this.entries = [];
        this.moods = [...this.defaultMoods];
        this.activities = [...this.defaultActivities];
        this.saveData();
        this.renderEntries();
        this.renderMoodButtons();
        this.renderActivityButtons();
        this.renderCalendar();
        this.updateStatistics();
        this.closeModal('settingsModal');
        this.showMessage('All data cleared', 'success');
      }
    }
  }

  /* ============================================
     THEME MANAGEMENT
     ============================================ */

  setupTheme() {
    const fallbackTheme = localStorage.getItem(this.THEME_KEY) || 'cloudy';
    if (window.ThemeManager && typeof window.ThemeManager.init === 'function') {
      const activeTheme = window.ThemeManager.init();
      this.updateThemeButton(activeTheme);
      return;
    }

    document.documentElement.setAttribute('data-theme', fallbackTheme);
    this.updateThemeButton(fallbackTheme);
  }

  toggleTheme() {
    let activeTheme = document.documentElement.getAttribute('data-theme') || 'cloudy';
    if (window.ThemeManager && typeof window.ThemeManager.cycleTheme === 'function') {
      activeTheme = window.ThemeManager.cycleTheme();
    } else {
      const themeOrder = ['cloudy', 'nature', 'windy', 'disney'];
      const currentIndex = themeOrder.indexOf(activeTheme);
      activeTheme = themeOrder[(currentIndex + 1 + themeOrder.length) % themeOrder.length];
      document.documentElement.setAttribute('data-theme', activeTheme);
      localStorage.setItem(this.THEME_KEY, activeTheme);
    }

    this.updateThemeButton(activeTheme);
  }

  updateThemeButton(theme) {
    const themeIcons = {
      cloudy: '☁️',
      nature: '🌿',
      windy: '🌬️',
      disney: '✨'
    };

    const button = document.getElementById('themeToggleBtn');
    const icon = button?.querySelector('.theme-icon');
    if (button) {
      button.setAttribute('aria-label', 'Switch memory wall theme');
      button.setAttribute('title', `Current theme: ${theme}`);
    }
    if (icon) {
      icon.textContent = themeIcons[theme] || '🎨';
    }
  }

  /* ============================================
     NOTIFICATIONS
     ============================================ */

  setupNotifications() {
    const enabled = localStorage.getItem(this.NOTIFICATIONS_KEY) === 'true';
    const checkbox = document.getElementById('enableNotifications');
    if (checkbox) {
      checkbox.checked = enabled;
      document.getElementById('notificationTimeGroup').style.display = enabled ? 'flex' : 'none';
    }

    if ('Notification' in window && enabled) {
      if (Notification.permission === 'granted') {
        this.scheduleNotification();
      }
    }
  }

  toggleNotifications(enabled) {
    localStorage.setItem(this.NOTIFICATIONS_KEY, enabled);

    if (enabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.scheduleNotification();
          }
        });
      } else if (Notification.permission === 'granted') {
        this.scheduleNotification();
      }
    }
  }

  scheduleNotification() {
    const timeInput = document.getElementById('notificationTime');
    if (!timeInput) return;

    const [hours, minutes] = timeInput.value.split(':');
    const now = new Date();
    const notifTime = new Date();
    notifTime.setHours(parseInt(hours), parseInt(minutes), 0);

    if (notifTime <= now) {
      notifTime.setDate(notifTime.getDate() + 1);
    }

    const delay = notifTime.getTime() - now.getTime();

    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('Mood Journal Reminder', {
          body: 'How are you feeling today? Tell us your mood! 🎭',
          icon: '🎭',
          tag: 'mood-reminder',
          requireInteraction: false
        });
        this.scheduleNotification();
      }
    }, delay);
  }

  /* ============================================
     MODAL MANAGEMENT
     ============================================ */

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById('modalBackdrop');
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
    if (backdrop) {
      backdrop.classList.add('active');
    }

    // Render custom items if settings modal
    if (modalId === 'settingsModal') {
      this.renderCustomMoodsList();
      this.renderCustomActivitiesList();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById('modalBackdrop');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
    if (backdrop) {
      backdrop.classList.remove('active');
    }
  }

  /* ============================================
     UTILITY METHODS
     ============================================ */

  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  formatDateLong(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  }

  getMoodLabel(moodId) {
    const mood = this.moods.find(m => m.id === moodId);
    return mood ? mood.label : 'Unknown';
  }

  getActivityLabel(activityId) {
    const activity = this.activities.find(a => a.id === activityId);
    return activity ? activity.label : 'Unknown';
  }

  showMessage(message, type = 'success') {
    const messageEl = document.getElementById('saveMessage');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `save-message ${type}`;
      setTimeout(() => {
        messageEl.className = 'save-message';
      }, 3000);
    }
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

/* ============================================
   INITIALIZATION
   ============================================ */

let app;

document.addEventListener('DOMContentLoaded', () => {
  app = new MoodJournal();
});
