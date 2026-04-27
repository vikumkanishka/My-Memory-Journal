(function () {
  'use strict';

  class ExpenseTracker {
    constructor() {
      this.STORAGE_KEY = 'memory_journal_expense_entries';
      this.BUDGET_KEY = 'memory_journal_expense_budget';
      this.entries = this.loadEntries();
      this.budget = this.loadBudget();
      this.init();
    }

    init() {
      this.bindEvents();
      this.render();
    }

    bindEvents() {
      const addExpenseBtn = document.getElementById('addExpenseBtn');
      addExpenseBtn?.addEventListener('click', () => {
        this.handleAddExpense();
      });

      // Allow Enter key to submit
      const expenseAmount = document.getElementById('expenseAmount');
      const expenseNote = document.getElementById('expenseNote');
      expenseAmount?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleAddExpense();
      });
      expenseNote?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleAddExpense();
      });

      const saveBudgetBtn = document.getElementById('saveBudgetBtn');
      saveBudgetBtn?.addEventListener('click', () => {
        const budgetInput = document.getElementById('budgetInput');
        const budget = Number(budgetInput?.value || 0);
        if (!this.isValidAmount(budget, 100, 50000)) {
          window.alert('Set a budget between $100 and $50000.');
          return;
        }

        this.budget = budget;
        localStorage.setItem(this.BUDGET_KEY, String(budget));
        this.render();
      });

      const resetMonthBtn = document.getElementById('resetMonthBtn');
      resetMonthBtn?.addEventListener('click', () => {
        if (!window.confirm('Reset all expenses for this month?')) {
          return;
        }

        const currentMonth = this.getCurrentMonth();
        this.entries = this.entries.filter((entry) => !entry.date.startsWith(currentMonth));
        this.saveEntries();
        this.render();
      });
    }

    handleAddExpense() {
      const amountInput = document.getElementById('expenseAmount');
      const categorySelect = document.getElementById('categorySelect');
      const noteInput = document.getElementById('expenseNote');

      const amount = Number(amountInput?.value || 0);
      const category = categorySelect?.value || 'other';
      const note = (noteInput?.value || '').trim();

      if (!this.isValidAmount(amount, 0.01, 10000)) {
        window.alert('Enter an amount between $0.01 and $10000.');
        return;
      }

      this.addExpense(amount, category, note);
      if (amountInput) amountInput.value = '';
      if (noteInput) noteInput.value = '';
    }

    addExpense(amount, category, note) {
      const now = new Date();
      const dateStr = this.formatDateKey(now);
      const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

      const expense = {
        id: Date.now(),
        date: dateStr,
        time: timeStr,
        amount: Number(amount),
        category: String(category),
        note: String(note)
      };

      this.entries.push(expense);
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

    loadBudget() {
      const raw = Number(localStorage.getItem(this.BUDGET_KEY));
      return this.isValidAmount(raw, 100, 50000) ? raw : 2000;
    }

    isValidAmount(value, min, max) {
      return Number.isFinite(value) && value >= min && value <= max;
    }

    getCurrentMonth() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return year + '-' + month;
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

    getTodayAmount() {
      const today = this.formatDateKey(new Date());
      return this.entries
        .filter((entry) => entry.date === today)
        .reduce((sum, entry) => sum + entry.amount, 0);
    }

    getMonthAmount() {
      const currentMonth = this.getCurrentMonth();
      return this.entries
        .filter((entry) => entry.date.startsWith(currentMonth))
        .reduce((sum, entry) => sum + entry.amount, 0);
    }

    getMonthlyAverage() {
      const monthlyTotals = this.getMonthlyTotals();
      if (monthlyTotals.length === 0) {
        return 0;
      }
      const sum = monthlyTotals.reduce((total, amount) => total + amount, 0);
      return sum / monthlyTotals.length;
    }

    getMonthlyTotals() {
      const months = {};
      this.entries.forEach((entry) => {
        const monthKey = entry.date.substring(0, 7);
        months[monthKey] = (months[monthKey] || 0) + entry.amount;
      });
      return Object.values(months);
    }

    getHighestDayAmount() {
      const dailyTotals = {};
      this.entries.forEach((entry) => {
        dailyTotals[entry.date] = (dailyTotals[entry.date] || 0) + entry.amount;
      });
      const amounts = Object.values(dailyTotals);
      return amounts.length > 0 ? Math.max(...amounts) : 0;
    }

    getCategoryBreakdown() {
      const breakdown = {};
      const currentMonth = this.getCurrentMonth();
      
      this.entries
        .filter((entry) => entry.date.startsWith(currentMonth))
        .forEach((entry) => {
          breakdown[entry.category] = (breakdown[entry.category] || 0) + entry.amount;
        });

      return breakdown;
    }

    getCategoryLabel(category) {
      const labels = {
        food: '🍔 Food',
        transport: '🚗 Transport',
        utilities: '⚡ Utilities',
        entertainment: '🎬 Entertainment',
        health: '⚕️ Health',
        shopping: '🛍️ Shopping',
        other: '📝 Other'
      };
      return labels[category] || '📝 ' + category;
    }

    getRecentExpenses(limit = 30) {
      return this.entries.slice().reverse().slice(0, limit);
    }

    render() {
      this.renderToday();
      this.renderMonth();
      this.renderStats();
      this.renderCategories();
      this.renderHistory();
    }

    renderToday() {
      const todayAmount = this.getTodayAmount();
      const todayAmountEl = document.getElementById('todayAmount');
      if (todayAmountEl) {
        todayAmountEl.textContent = '$' + todayAmount.toFixed(2);
      }
    }

    renderMonth() {
      const monthAmount = this.getMonthAmount();
      const percent = Math.min(Math.round((monthAmount / this.budget) * 100), 100);

      const monthAmountEl = document.getElementById('monthAmount');
      const monthBudgetEl = document.getElementById('monthBudget');
      const progressPercentEl = document.getElementById('progressPercent');
      const progressRing = document.getElementById('progressRing');
      const budgetInput = document.getElementById('budgetInput');

      if (monthAmountEl) {
        monthAmountEl.textContent = '$' + monthAmount.toFixed(2);
      }
      if (monthBudgetEl) {
        monthBudgetEl.textContent = '$' + this.budget.toFixed(2);
      }
      if (progressPercentEl) {
        progressPercentEl.textContent = percent + '%';
      }
      if (progressRing) {
        progressRing.style.setProperty('--percent', String(percent));
      }
      if (budgetInput) {
        budgetInput.value = String(this.budget);
      }
    }

    renderStats() {
      const monthlyAvgValue = document.getElementById('monthlyAvgValue');
      const highestDayValue = document.getElementById('highestDayValue');
      const transactionCountValue = document.getElementById('transactionCountValue');

      const monthlyAvg = this.getMonthlyAverage();
      const highestDay = this.getHighestDayAmount();
      const transactionCount = this.entries.length;

      if (monthlyAvgValue) {
        monthlyAvgValue.textContent = '$' + monthlyAvg.toFixed(2);
      }
      if (highestDayValue) {
        highestDayValue.textContent = '$' + highestDay.toFixed(2);
      }
      if (transactionCountValue) {
        transactionCountValue.textContent = String(transactionCount);
      }
    }

    renderCategories() {
      const categoryBreakdown = document.getElementById('categoryBreakdown');
      const categoryEmpty = document.getElementById('categoryEmpty');
      if (!categoryBreakdown || !categoryEmpty) {
        return;
      }

      const breakdown = this.getCategoryBreakdown();
      const hasData = Object.keys(breakdown).length > 0;
      categoryBreakdown.innerHTML = '';

      if (!hasData) {
        categoryEmpty.style.display = 'block';
        return;
      }

      categoryEmpty.style.display = 'none';

      Object.entries(breakdown)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, amount]) => {
          const item = document.createElement('div');
          item.className = 'category-item';
          item.innerHTML =
            '<span class="category-item-name">' + this.getCategoryLabel(category) + '</span>' +
            '<span class="category-item-amount">$' + amount.toFixed(2) + '</span>';
          categoryBreakdown.appendChild(item);
        });
    }

    renderHistory() {
      const historyList = document.getElementById('historyList');
      const historyEmpty = document.getElementById('historyEmpty');
      if (!historyList || !historyEmpty) {
        return;
      }

      const recent = this.getRecentExpenses();
      historyList.innerHTML = '';

      if (recent.length === 0) {
        historyEmpty.style.display = 'block';
        return;
      }

      historyEmpty.style.display = 'none';

      recent.forEach((expense) => {
        const item = document.createElement('div');
        const monthAmount = this.getMonthAmount();
        const isOverBudget = monthAmount > this.budget;
        
        item.className = 'history-item' + (isOverBudget ? ' over-budget' : '');
        const noteHtml = expense.note ? '<p class="history-item-note">' + this.escapeHtml(expense.note) + '</p>' : '';
        
        item.innerHTML =
          '<span class="history-item-date">' + this.formatPrettyDate(expense.date) + ' ' + expense.time + '</span>' +
          '<div class="history-item-details">' +
          '<p class="history-item-category">' + this.getCategoryLabel(expense.category) + '</p>' +
          noteHtml +
          '</div>' +
          '<span class="history-item-amount">$' + expense.amount.toFixed(2) + '</span>';

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
    new ExpenseTracker();
  });
})();
