/*
 * Edit profile page behavior.
 * Saves user profile fields and confirms theme choices selected in the memory wall section.
 */
(function () {
  'use strict';

  const PROFILE_STORAGE_KEY = 'memoryJournal_currentUser';

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

  function initThemeSaveAction() {
    const saveThemeButton = document.getElementById('save-theme-btn');
    if (!saveThemeButton) {
      return;
    }

    saveThemeButton.addEventListener('click', function () {
      if (window.ThemeManager && typeof window.ThemeManager.getStoredTheme === 'function') {
        const activeTheme = window.ThemeManager.getStoredTheme();
        window.ThemeManager.applyTheme(activeTheme);
      }

      showToast('Memory wall theme saved for all pages.', false);
    });
  }

  function initPage() {
    if (window.ThemeManager) {
      window.ThemeManager.init();
      window.ThemeManager.bindControls();
    }

    initProfileForm();
    initThemeSaveAction();
  }

  document.addEventListener('DOMContentLoaded', initPage);
})();
