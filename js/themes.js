/*
 * Theme manager for wall themes.
 * Handles theme persistence, selector sync, and icon updates.
 */
(function () {
  const STORAGE_KEY = 'memory_journal_theme';
  const DEFAULT_THEME = 'cloudy';
  const THEMES = ['cloudy', 'nature', 'windy', 'disney'];

  const THEME_META = {
    cloudy: {
      icon: 'fas fa-cloud',
      buttonLabel: 'Switch to next wall theme. Current: Cloudy'
    },
    nature: {
      icon: 'fas fa-leaf',
      buttonLabel: 'Switch to next wall theme. Current: Nature'
    },
    windy: {
      icon: 'fas fa-wind',
      buttonLabel: 'Switch to next wall theme. Current: Windy'
    },
    disney: {
      icon: 'fas fa-wand-magic-sparkles',
      buttonLabel: 'Switch to next wall theme. Current: Disney style'
    }
  };

  function sanitizeTheme(theme) {
    return THEMES.includes(theme) ? theme : DEFAULT_THEME;
  }

  function getStoredTheme() {
    return sanitizeTheme(localStorage.getItem(STORAGE_KEY));
  }

  function updateButtonState(theme) {
    const button = document.getElementById('theme-toggle');
    if (!button) return;

    const icon = button.querySelector('i');
    if (icon) {
      icon.className = THEME_META[theme].icon;
    }

    button.setAttribute('aria-label', THEME_META[theme].buttonLabel);
    button.setAttribute('title', THEME_META[theme].buttonLabel);
  }

  function updateSelectorState(theme) {
    const selector = document.getElementById('theme-selector');
    if (selector) {
      selector.value = theme;
    }
  }

  function updatePreviewState(theme) {
    const swatches = document.querySelectorAll('.theme-swatch[data-theme]');
    swatches.forEach((swatch) => {
      const isActive = swatch.getAttribute('data-theme') === theme;
      swatch.classList.toggle('active', isActive);
      swatch.setAttribute('aria-checked', String(isActive));
    });
  }

  function applyTheme(theme) {
    const safeTheme = sanitizeTheme(theme);
    document.documentElement.setAttribute('data-theme', safeTheme);
    localStorage.setItem(STORAGE_KEY, safeTheme);
    updateSelectorState(safeTheme);
    updateButtonState(safeTheme);
    updatePreviewState(safeTheme);
    return safeTheme;
  }

  function cycleTheme() {
    const current = sanitizeTheme(document.documentElement.getAttribute('data-theme') || getStoredTheme());
    const currentIndex = THEMES.indexOf(current);
    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
    return applyTheme(nextTheme);
  }

  function bindControls() {
    const selector = document.getElementById('theme-selector');
    if (selector && !selector.dataset.themeBound) {
      selector.addEventListener('change', (event) => {
        applyTheme(event.target.value);
      });
      selector.dataset.themeBound = 'true';
    }

    const swatches = document.querySelectorAll('.theme-swatch[data-theme]');
    swatches.forEach((swatch) => {
      if (swatch.dataset.themeBound) return;

      swatch.addEventListener('click', () => {
        applyTheme(swatch.getAttribute('data-theme'));
      });

      swatch.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          applyTheme(swatch.getAttribute('data-theme'));
        }
      });

      swatch.dataset.themeBound = 'true';
    });

    updateButtonState(sanitizeTheme(document.documentElement.getAttribute('data-theme') || getStoredTheme()));
    updateSelectorState(sanitizeTheme(document.documentElement.getAttribute('data-theme') || getStoredTheme()));
    updatePreviewState(sanitizeTheme(document.documentElement.getAttribute('data-theme') || getStoredTheme()));
  }

  function init() {
    const current = getStoredTheme();
    applyTheme(current);
    bindControls();
    return current;
  }

  window.ThemeManager = {
    init,
    applyTheme,
    cycleTheme,
    bindControls,
    getStoredTheme,
    themes: THEMES.slice()
  };
})();
