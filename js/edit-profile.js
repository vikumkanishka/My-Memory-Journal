/*
 * Edit profile page behavior.
 * Saves user profile fields and handles theme selection with emoji buttons.
 */
(function () {
  'use strict';

  const PROFILE_STORAGE_KEY = 'memoryJournal_currentUser';
  const THEME_STORAGE_KEY = 'memory_journal_theme';

  // Theme emojis for visual representation
  const THEME_EMOJIS = {
    cloudy: '☁️',
    nature: '🌿',
    windy: '💨',
    disney: '✨'
  };

  const THEME_LABELS = {
    cloudy: 'Cloudy',
    nature: 'Nature',
    windy: 'Windy',
    disney: 'Magical'
  };

  const THEMES = ['cloudy', 'nature', 'windy', 'disney'];

  function getCurrentUserSafe() {
    if (typeof getCurrentUser === 'function') {
      return getCurrentUser();
    }

    try {
      const value = localStorage.getItem(PROFILE_STORAGE_KEY);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  }

  function saveCurrentUserSafe(user) {
    if (!user) {
      return;
    }

    if (typeof setCurrentUser === 'function') {
      setCurrentUser(user);
      return;
    }

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(user));
  }

  function showToast(message, isError) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, Boolean(isError));
      return;
    }

    const prefix = isError ? 'Error: ' : '';
    window.alert(prefix + message);
  }

  function initProfileForm() {
    const form = document.getElementById('profile-form');
    const fullNameInput = document.getElementById('profile-full-name');
    const emailInput = document.getElementById('profile-email');

    if (!form || !fullNameInput || !emailInput) {
      return;
    }

    const user = getCurrentUserSafe();
    if (user) {
      fullNameInput.value = user.fullName || '';
      emailInput.value = user.email || '';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const currentUser = getCurrentUserSafe();
      if (!currentUser) {
        showToast('Please log in to edit your profile.', true);
        window.location.href = 'login.html';
        return;
      }

      const updatedUser = {
        ...currentUser,
        fullName: fullNameInput.value.trim() || currentUser.fullName,
        email: emailInput.value.trim()
      };

      saveCurrentUserSafe(updatedUser);
      showToast('Profile updated successfully.', false);
    });
  }

  function initThemeSelector() {
    const themeSelector = document.getElementById('profileThemeSelector');
    if (!themeSelector) {
      return;
    }

    // Get stored theme
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'cloudy';

    // Populate theme buttons
    THEMES.forEach((theme) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mood-btn';
      button.setAttribute('data-theme', theme);
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(theme === storedTheme));
      button.setAttribute('aria-label', THEME_LABELS[theme]);
      button.textContent = THEME_EMOJIS[theme];

      if (theme === storedTheme) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => {
        // Update all buttons
        document.querySelectorAll('#profileThemeSelector .mood-btn').forEach((btn) => {
          btn.classList.remove('active');
          btn.setAttribute('aria-checked', 'false');
        });

        // Activate this button
        button.classList.add('active');
        button.setAttribute('aria-checked', 'true');
      });

      themeSelector.appendChild(button);
    });
  }

  function initThemeSaveAction() {
    const saveThemeButton = document.getElementById('save-theme-btn');
    if (!saveThemeButton) {
      return;
    }

    saveThemeButton.addEventListener('click', function () {
      const activeButton = document.querySelector('#profileThemeSelector .mood-btn.active');
      if (activeButton) {
        const selectedTheme = activeButton.getAttribute('data-theme');
        
        // Apply theme using ThemeManager if available
        if (window.ThemeManager && typeof window.ThemeManager.applyTheme === 'function') {
          window.ThemeManager.applyTheme(selectedTheme);
        } else {
          // Fallback: save directly
          localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
          document.documentElement.setAttribute('data-theme', selectedTheme);
        }

        showToast('Theme saved successfully.', false);
      } else {
        showToast('Please select a theme first.', true);
      }
    });
  }

  function initPage() {
    if (window.ThemeManager) {
      window.ThemeManager.init();
      window.ThemeManager.bindControls();
    }

    initProfileForm();
    initThemeSelector();
    initThemeSaveAction();
  }

  document.addEventListener('DOMContentLoaded', initPage);
})();
