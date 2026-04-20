/*
 * Shared navbar controller for all pages.
 * Handles: mobile menu, profile dropdown, active link state, and logout behavior.
 */
(function () {
  'use strict';

  function safeGetCurrentUser() {
    if (typeof getCurrentUser === 'function') {
      return getCurrentUser();
    }

    try {
      const stored = localStorage.getItem('memoryJournal_currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  function safeLogout() {
    if (typeof logout === 'function') {
      logout();
      return;
    }

    localStorage.removeItem('memoryJournal_currentUser');
    window.location.href = 'login.html?loggedOut=true';
  }

  function initNavbar() {
    const navRoot = document.querySelector('.site-nav');
    const menuButton = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('primary-navigation');
    const overlay = document.getElementById('nav-overlay');
    const profileItem = navRoot ? navRoot.querySelector('.profile-item') : null;
    const profileButton = document.getElementById('profile-menu-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileLabel = document.getElementById('profile-menu-label');
    const logoutButton = document.getElementById('profile-logout-button');

    if (!menuButton || !navMenu || !overlay || !navRoot) {
      return;
    }

    const mobileMedia = window.matchMedia('(max-width: 768px)');

    function isMenuOpen() {
      return document.body.classList.contains('nav-open');
    }

    function setExpandedState(isOpen) {
      document.body.classList.toggle('nav-open', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
      overlay.setAttribute('aria-hidden', String(!isOpen));

      if (mobileMedia.matches) {
        navMenu.setAttribute('aria-hidden', String(!isOpen));
      } else {
        navMenu.removeAttribute('aria-hidden');
      }
    }

    function closeMenu(returnFocus) {
      if (!isMenuOpen()) {
        return;
      }

      setExpandedState(false);
      if (returnFocus) {
        menuButton.focus();
      }
    }

    function openMenu() {
      setExpandedState(true);
      const firstFocusable = navMenu.querySelector('a[href], button:not([disabled])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    function toggleMenu() {
      if (isMenuOpen()) {
        closeMenu(true);
      } else {
        openMenu();
      }
    }

    function closeProfileDropdown(returnFocus) {
      if (!profileItem || !profileButton) {
        return;
      }

      profileItem.classList.remove('is-open');
      profileButton.setAttribute('aria-expanded', 'false');
      if (returnFocus) {
        profileButton.focus();
      }
    }

    function openProfileDropdown() {
      if (!profileItem || !profileButton || !profileDropdown) {
        return;
      }

      profileItem.classList.add('is-open');
      profileButton.setAttribute('aria-expanded', 'true');
      const firstMenuAction = profileDropdown.querySelector('a[href], button:not([disabled])');
      if (firstMenuAction) {
        firstMenuAction.focus();
      }
    }

    function toggleProfileDropdown() {
      if (!profileItem) {
        return;
      }

      if (profileItem.classList.contains('is-open')) {
        closeProfileDropdown(true);
      } else {
        openProfileDropdown();
      }
    }

    function syncForViewport() {
      if (!mobileMedia.matches) {
        setExpandedState(false);
        navMenu.removeAttribute('aria-hidden');
      } else {
        navMenu.setAttribute('aria-hidden', String(!isMenuOpen()));
      }
    }

    function updateActiveLink() {
      const currentPath = window.location.pathname.split('/').pop() || 'index.html';
      const navLinks = navMenu.querySelectorAll(':scope > li > a[href]');

      navLinks.forEach((link) => {
        const href = (link.getAttribute('href') || '').split('#')[0];
        const isActive = href === currentPath;

        link.classList.toggle('active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    function hydrateProfileLabel() {
      if (!profileLabel) {
        return;
      }

      const currentUser = safeGetCurrentUser();
      if (currentUser && currentUser.fullName) {
        const firstName = String(currentUser.fullName).trim().split(/\s+/)[0] || 'Profile';
        profileLabel.textContent = firstName;
      } else {
        profileLabel.textContent = 'Profile';
      }
    }

    menuButton.addEventListener('click', toggleMenu);

    overlay.addEventListener('click', function () {
      closeMenu(false);
      closeProfileDropdown(false);
    });

    navMenu.addEventListener('click', function (event) {
      const navLink = event.target.closest('a[href]');
      if (navLink && mobileMedia.matches) {
        closeMenu(false);
      }
    });

    if (profileButton) {
      profileButton.addEventListener('click', function () {
        toggleProfileDropdown();
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener('click', function () {
        safeLogout();
      });
    }

    // Theme switcher in dropdown
    const THEME_STORAGE_KEY = 'memory_journal_theme';
    
    function setupThemeSwitcher() {
      const themeButtons = document.querySelectorAll('.theme-icon-btn');
      
      if (themeButtons.length === 0) {
        console.warn('Theme buttons not found');
        return;
      }

      function updateThemeButtonStates(activeTheme) {
        themeButtons.forEach((btn) => {
          const btnTheme = btn.getAttribute('data-theme');
          const isActive = btnTheme === activeTheme;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-pressed', String(isActive));
        });
      }

      // Initialize button states
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
      updateThemeButtonStates(storedTheme);

      // Attach click handlers
      themeButtons.forEach((btn) => {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          
          const selectedTheme = this.getAttribute('data-theme');
          
          // Apply theme
          if (window.ThemeManager && typeof window.ThemeManager.applyTheme === 'function') {
            window.ThemeManager.applyTheme(selectedTheme);
          } else {
            localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
            document.documentElement.setAttribute('data-theme', selectedTheme);
          }

          updateThemeButtonStates(selectedTheme);
          closeProfileDropdown(false);
        });
      });
    }

    setupThemeSwitcher();

    document.addEventListener('click', function (event) {
      const clickedInsideNav = navRoot.contains(event.target);

      if (profileItem && profileItem.classList.contains('is-open') && !clickedInsideNav) {
        closeProfileDropdown(false);
      }

      if (mobileMedia.matches && isMenuOpen()) {
        const clickedToggle = menuButton.contains(event.target);
        if (!clickedInsideNav && !clickedToggle) {
          closeMenu(false);
        }
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMenu(true);
        closeProfileDropdown(true);
      }
    });

    if (typeof mobileMedia.addEventListener === 'function') {
      mobileMedia.addEventListener('change', syncForViewport);
    } else {
      mobileMedia.addListener(syncForViewport);
    }

    hydrateProfileLabel();
    updateActiveLink();
    syncForViewport();
  }

  document.addEventListener('DOMContentLoaded', initNavbar);
})();
