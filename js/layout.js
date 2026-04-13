/*
 * Shared layout helpers for Memory Journal.
 * Renders the signed-in user controls in the header across pages.
 */
(function () {
  function renderAuthContainer() {
    const container = document.getElementById('auth-container');
    if (!container || typeof getCurrentUser !== 'function') return;

    const currentUser = getCurrentUser();

    if (currentUser) {
      container.innerHTML = `
        <div class="auth-user-badge" aria-label="Signed in user">
          <span>Welcome, <strong>${currentUser.fullName}</strong></span>
        </div>
        <div class="auth-actions">
          <button type="button" class="auth-action auth-action-danger" id="logout-button">Logout</button>
        </div>
      `;

      const logoutButton = document.getElementById('logout-button');
      if (logoutButton) {
        logoutButton.addEventListener('click', () => {
          logout();
        });
      }
      return;
    }

    container.innerHTML = `
      <div class="auth-actions">
        <a href="login.html" class="auth-action auth-action-primary">Log In</a>
        <a href="register.html" class="auth-action auth-action-secondary">Sign Up</a>
      </div>
    `;
  }

  function init() {
    renderAuthContainer();
  }

  window.MemoryJournalLayout = {
    init,
    renderAuthContainer
  };

  document.addEventListener('DOMContentLoaded', init);
})();
