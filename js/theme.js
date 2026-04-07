/**
 * THEME MODULE - Handles dark/light theme switching
 */

import { CONFIG } from './constants.js';

export const Theme = {
  /**
   * Initialize theme on page load
   */
  init: () => {
    const theme = localStorage.getItem(CONFIG.THEME_KEY) || 'light';
    Theme.set(theme);
  },

  /**
   * Set theme
   */
  set: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(CONFIG.THEME_KEY, theme);
    Theme.updateIcon(theme);
  },

  /**
   * Toggle between light and dark
   */
  toggle: () => {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    Theme.set(newTheme);
  },

  /**
   * Update theme toggle icon
   */
  updateIcon: (theme) => {
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      // Accessibility improvement
      const btn = document.querySelector('#theme-toggle');
      if (btn) {
        btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        btn.setAttribute('aria-pressed', 'true');
      }
    }
  }
};
