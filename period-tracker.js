(function () {
  'use strict';

  class PeriodTracker {
    constructor() {
      this.STORAGE_KEY = 'memory_journal_period_tracker';
      this.data = this.loadData();
      this.init();
    }

    init() {
      this.bindEvents();
      this.render();
    }

    bindEvents() {
      const saveSettingsBtn = document.getElementById('saveSettingsBtn');
      saveSettingsBtn?.addEventListener('click', () => {
        const cycleLength = Number(document.getElementById('cycleLengthInput')?.value || 0);
        const periodLength = Number(document.getElementById('periodLengthInput')?.value || 0);

        if (!this.isValidNumber(cycleLength, 21, 45) || !this.isValidNumber(periodLength, 2, 10)) {
          window.alert('Cycle length must be 21-45 days and period length must be 2-10 days.');
          return;
        }

        this.data.cycleLength = cycleLength;
        this.data.periodLength = periodLength;
        this.saveData();
        this.render();
      });

      const startTodayBtn = document.getElementById('startTodayBtn');
      startTodayBtn?.addEventListener('click', () => {
        const today = this.getTodayKey();
        const latestStart = this.getLatestStart();

        if (latestStart === today) {
          window.alert('Today is already logged as a start date.');
          return;
        }

        this.data.startDates.push(today);
        this.data.startDates = this.getUniqueSortedStarts(this.data.startDates);
        this.saveData();
        this.render();
      });

      const endTodayBtn = document.getElementById('endTodayBtn');
      endTodayBtn?.addEventListener('click', () => {
        const latestStart = this.getLatestStart();
        const today = this.getTodayKey();

        if (!latestStart) {
          window.alert('Log a start date first.');
          return;
        }

        if (this.compareDateKeys(today, latestStart) < 0) {
          window.alert('End date cannot be before start date.');
          return;
        }

        this.data.endDates[latestStart] = today;
        this.saveData();
        this.render();
      });

      const resetLatestBtn = document.getElementById('resetLatestBtn');
      resetLatestBtn?.addEventListener('click', () => {
        const latestStart = this.getLatestStart();
        if (!latestStart) {
          return;
        }

        if (!window.confirm('Remove the latest period log?')) {
          return;
        }

        this.data.startDates = this.data.startDates.filter((date) => date !== latestStart);
        delete this.data.endDates[latestStart];
        this.saveData();
        this.render();
      });
    }

    loadData() {
      const fallback = {
        cycleLength: 28,
        periodLength: 5,
        startDates: [],
        endDates: {}
      };

      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
          return fallback;
        }

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
          return fallback;
        }

        const cycleLength = this.isValidNumber(Number(parsed.cycleLength), 21, 45) ? Number(parsed.cycleLength) : 28;
        const periodLength = this.isValidNumber(Number(parsed.periodLength), 2, 10) ? Number(parsed.periodLength) : 5;
        const startDates = Array.isArray(parsed.startDates) ? this.getUniqueSortedStarts(parsed.startDates) : [];
        const endDates = parsed.endDates && typeof parsed.endDates === 'object' ? parsed.endDates : {};

        return {
          cycleLength: cycleLength,
          periodLength: periodLength,
          startDates: startDates,
          endDates: endDates
        };
      } catch (error) {
        return fallback;
      }
    }

    saveData() {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }

    isValidNumber(value, min, max) {
      return Number.isFinite(value) && value >= min && value <= max;
    }

    getUniqueSortedStarts(dates) {
      const unique = Array.from(new Set(dates.map((date) => String(date))));
      return unique.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort((a, b) => a.localeCompare(b));
    }

    getTodayKey() {
      return this.formatDateKey(new Date());
    }

    formatDateKey(dateObj) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    parseDateKey(dateKey) {
      return new Date(dateKey + 'T00:00:00');
    }

    addDays(dateKey, days) {
      const d = this.parseDateKey(dateKey);
      d.setDate(d.getDate() + days);
      return this.formatDateKey(d);
    }

    diffInDays(fromKey, toKey) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const from = this.parseDateKey(fromKey).getTime();
      const to = this.parseDateKey(toKey).getTime();
      return Math.round((to - from) / msPerDay);
    }

    compareDateKeys(a, b) {
      return a.localeCompare(b);
    }

    formatPrettyDate(dateKey) {
      const d = this.parseDateKey(dateKey);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }

    getLatestStart() {
      if (this.data.startDates.length === 0) {
        return '';
      }

      return this.data.startDates[this.data.startDates.length - 1];
    }

    getLatestEnd() {
      const latestStart = this.getLatestStart();
      if (!latestStart) {
        return '';
      }

      return String(this.data.endDates[latestStart] || '');
    }

    getPredictedNextStart() {
      const latestStart = this.getLatestStart();
      if (!latestStart) {
        return '';
      }

      return this.addDays(latestStart, this.data.cycleLength);
    }

    getAverageCycleLength() {
      if (this.data.startDates.length < 2) {
        return 0;
      }

      let total = 0;
      let count = 0;
      for (let i = 1; i < this.data.startDates.length; i += 1) {
        total += this.diffInDays(this.data.startDates[i - 1], this.data.startDates[i]);
        count += 1;
      }

      return count > 0 ? Math.round(total / count) : 0;
    }

    getLastPeriodLength() {
      const latestStart = this.getLatestStart();
      const latestEnd = this.getLatestEnd();
      if (!latestStart || !latestEnd) {
        return 0;
      }

      return this.diffInDays(latestStart, latestEnd) + 1;
    }

    getCycleProgressPercent() {
      const latestStart = this.getLatestStart();
      if (!latestStart) {
        return 0;
      }

      const today = this.getTodayKey();
      const elapsed = this.diffInDays(latestStart, today);
      const ratio = Math.max(0, Math.min(elapsed / this.data.cycleLength, 1));
      return Math.round(ratio * 100);
    }

    render() {
      this.renderStatus();
      this.renderSettings();
      this.renderStats();
      this.renderHistory();
    }

    renderStatus() {
      const progressPercentEl = document.getElementById('progressPercent');
      const progressRing = document.getElementById('progressRing');
      const statusLine = document.getElementById('statusLine');
      const nextDateLine = document.getElementById('nextDateLine');
      const latestStartValue = document.getElementById('latestStartValue');
      const latestEndValue = document.getElementById('latestEndValue');

      const latestStart = this.getLatestStart();
      const latestEnd = this.getLatestEnd();
      const predictedNext = this.getPredictedNextStart();
      const percent = this.getCycleProgressPercent();

      if (progressPercentEl) {
        progressPercentEl.textContent = percent + '%';
      }

      if (progressRing) {
        progressRing.style.setProperty('--percent', String(percent));
      }

      if (latestStartValue) {
        latestStartValue.textContent = latestStart ? this.formatPrettyDate(latestStart) : 'Not logged';
      }

      if (latestEndValue) {
        latestEndValue.textContent = latestEnd ? this.formatPrettyDate(latestEnd) : 'Not logged';
      }

      if (!latestStart || !predictedNext) {
        if (statusLine) {
          statusLine.textContent = 'Log your first start date';
        }
        if (nextDateLine) {
          nextDateLine.textContent = 'Next prediction will appear here.';
        }
        return;
      }

      const today = this.getTodayKey();
      const daysUntil = this.diffInDays(today, predictedNext);

      const periodEndEstimate = latestEnd || this.addDays(latestStart, this.data.periodLength - 1);
      const onPeriod = this.compareDateKeys(today, latestStart) >= 0 && this.compareDateKeys(today, periodEndEstimate) <= 0;

      if (statusLine) {
        if (onPeriod) {
          statusLine.textContent = 'Currently in period window';
        } else if (daysUntil > 0) {
          statusLine.textContent = daysUntil + (daysUntil === 1 ? ' day until next period' : ' days until next period');
        } else if (daysUntil === 0) {
          statusLine.textContent = 'Expected start is today';
        } else {
          statusLine.textContent = Math.abs(daysUntil) + (Math.abs(daysUntil) === 1 ? ' day past expected date' : ' days past expected date');
        }
      }

      if (nextDateLine) {
        nextDateLine.textContent = 'Predicted next start: ' + this.formatPrettyDate(predictedNext);
      }
    }

    renderSettings() {
      const cycleLengthInput = document.getElementById('cycleLengthInput');
      const periodLengthInput = document.getElementById('periodLengthInput');

      if (cycleLengthInput) {
        cycleLengthInput.value = String(this.data.cycleLength);
      }

      if (periodLengthInput) {
        periodLengthInput.value = String(this.data.periodLength);
      }
    }

    renderStats() {
      const cyclesValue = document.getElementById('cyclesValue');
      const averageCycleValue = document.getElementById('averageCycleValue');
      const lastLengthValue = document.getElementById('lastLengthValue');

      const cycleCount = this.data.startDates.length;
      const averageCycle = this.getAverageCycleLength();
      const lastPeriodLength = this.getLastPeriodLength();

      if (cyclesValue) {
        cyclesValue.textContent = String(cycleCount);
      }

      if (averageCycleValue) {
        averageCycleValue.textContent = averageCycle > 0 ? averageCycle + ' days' : '-';
      }

      if (lastLengthValue) {
        lastLengthValue.textContent = lastPeriodLength > 0 ? lastPeriodLength + ' days' : '-';
      }
    }

    renderHistory() {
      const historyList = document.getElementById('historyList');
      const historyEmpty = document.getElementById('historyEmpty');
      if (!historyList || !historyEmpty) {
        return;
      }

      historyList.innerHTML = '';
      const startDates = this.data.startDates.slice().reverse().slice(0, 10);

      if (startDates.length === 0) {
        historyEmpty.style.display = 'block';
        return;
      }

      historyEmpty.style.display = 'none';

      startDates.forEach((start) => {
        const end = String(this.data.endDates[start] || '');
        const periodLength = end ? this.diffInDays(start, end) + 1 : this.data.periodLength;
        const ratio = Math.max(0, Math.min((periodLength / this.data.cycleLength) * 100, 100));

        const row = document.createElement('div');
        row.className = 'history-item' + (end ? ' completed' : '');
        row.innerHTML =
          '<span>' + this.formatPrettyDate(start) + '</span>' +
          '<div class="history-bar"><div class="history-fill" style="width:' + ratio + '%"></div></div>' +
          '<span class="history-meta">' + periodLength + 'd</span>';

        historyList.appendChild(row);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    new PeriodTracker();
  });
})();
