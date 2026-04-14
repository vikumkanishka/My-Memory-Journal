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
    this.THEME_KEY = 'mood_journal_theme';
    this.NOTIFICATIONS_KEY = 'mood_journal_notifications';

    // Default moods with emojis
    this.defaultMoods = [
      { id: 'happy', label: 'Happy', emoji: 'ðŸ˜„', color: '#FFD700' },
      { id: 'good', label: 'Good', emoji: 'ðŸ˜Š', color: '#87CEEB' },
      { id: 'neutral', label: 'Neutral', emoji: 'ðŸ˜', color: '#D3D3D3' },
      { id: 'sad', label: 'Sad', emoji: 'ðŸ˜¢', color: '#4169E1' },
      { id: 'angry', label: 'Angry', emoji: 'ðŸ˜ ', color: '#DC143C' }
    ];

    // Default activities with emojis
    this.defaultActivities = [
      { id: 'study', label: 'Study', emoji: 'ðŸ“š' },
      { id: 'exercise', label: 'Exercise', emoji: 'ðŸ’ª' },
      { id: 'work', label: 'Work', emoji: 'ðŸ’¼' },
      { id: 'friends', label: 'Friends', emoji: 'ðŸ‘¥' },
      { id: 'gaming', label: 'Gaming', emoji: 'ðŸŽ®' },
      { id: 'reading', label: 'Reading', emoji: 'ðŸ“–' },
      { id: 'cooking', label: 'Cooking', emoji: 'ðŸ³' },
      { id: 'music', label: 'Music', emoji: 'ðŸŽµ' }
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

    // Theme toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => this.toggleTheme());

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
    this.showMessage('Entry saved successfully! ðŸŽ‰', 'success');
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
          <button class="entry-action-btn" title="Edit entry" data-action="edit-entry" data-entry-id="${entry.id}">âœï¸</button>
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

