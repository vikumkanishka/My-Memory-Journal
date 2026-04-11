/**
 * ============================================
 * Authentication Logic for Memory Journal
 * Includes: Registration, Login, Validation
 * Storage: localStorage (with JSON structure)
 * ============================================
 */

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const USERS_STORAGE_KEY = 'memoryJournal_users';
const CURRENT_USER_KEY = 'memoryJournal_currentUser';
const SPECIAL_CHARS = /[!@#$%^&*]/;

// Demo User (for testing purposes)
const DEMO_USER = {
  id: 'demo_001',
  fullName: 'Demo User',
  username: 'Demo@123',
  password: 'password123',
  email: 'demo@example.com',
  createdAt: new Date().toISOString(),
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the storage with demo user if empty
 */
function initializeStorage() {
  const users = getUsersFromStorage();
  
  // If no users exist, add demo user
  if (users.length === 0) {
    users.push(DEMO_USER);
    saveUsersToStorage(users);
  }
}

/**
 * Get all users from localStorage
 * @returns {Array} Array of user objects
 */
function getUsersFromStorage() {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save users to localStorage
 * @param {Array} users - Array of user objects
 */
function saveUsersToStorage(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Get currently logged-in user from localStorage
 * @returns {Object|null} Current user object or null
 */
function getCurrentUser() {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Set the current logged-in user
 * @param {Object} user - User object to set as current
 */
function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

/**
 * Clear current user session (logout)
 */
function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// ============================================
// REGISTRATION VALIDATION
// ============================================

/**
 * Validate full name
 * @param {string} fullName - Full name to validate
 * @returns {Object} {isValid: boolean, message: string}
 */
function validateFullName(fullName) {
  if (!fullName.trim()) {
    return { isValid: false, message: 'Full name is required.' };
  }
  
  if (fullName.trim().length < 2) {
    return { isValid: false, message: 'Full name must be at least 2 characters.' };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Real-time username validation
 * Checks as user types the requirements
 */
function validateUsername() {
  const username = document.getElementById('username').value;
  const fullName = document.getElementById('fullName').value;
  
  // Check length (6-20 chars, no spaces)
  const lengthValid = username.length >= 6 && username.length <= 20 && !username.includes(' ');
  updateRequirement('req-length', lengthValid);
  
  // Check uppercase letter
  const uppercaseValid = /[A-Z]/.test(username);
  updateRequirement('req-uppercase', uppercaseValid);
  
  // Check number
  const numberValid = /[0-9]/.test(username);
  updateRequirement('req-number', numberValid);
  
  // Check special character
  const specialValid = SPECIAL_CHARS.test(username);
  updateRequirement('req-special', specialValid);
  
  // Check name inclusion
  const nameValid = fullName.trim() && isNameIncluded(username, fullName);
  updateRequirement('req-name', nameValid);
}

/**
 * Update requirement UI element
 * @param {string} requirementId - ID of requirement element
 * @param {boolean} isMet - Whether requirement is met
 */
function updateRequirement(requirementId, isMet) {
  const element = document.getElementById(requirementId);
  if (element) {
    element.classList.remove('met', 'unmet');
    element.classList.add(isMet ? 'met' : 'unmet');
    
    // Update icon
    const icon = element.querySelector('.icon');
    if (icon) {
      icon.textContent = isMet ? '✓' : '○';
    }
  }
}

/**
 * Check if username includes part of full name
 * @param {string} username - Username to check
 * @param {string} fullName - Full name to check against
 * @returns {boolean} True if username contains part of full name
 */
function isNameIncluded(username, fullName) {
  const nameParts = fullName.toLowerCase().split(' ');
  const usernameLower = username.toLowerCase();
  
  // Check each word in the full name
  return nameParts.some(part => 
    part.length > 0 && usernameLower.includes(part)
  );
}

/**
 * Validate complete username against all requirements
 * @param {string} username - Username to validate
 * @param {string} fullName - Full name for validation
 * @returns {Object} {isValid: boolean, message: string}
 */
function validateUsernameComplete(username, fullName) {
  // Length check
  if (username.length < 6 || username.length > 20) {
    return { isValid: false, message: 'Username must be 6–20 characters.' };
  }
  
  // No spaces
  if (username.includes(' ')) {
    return { isValid: false, message: 'Username cannot contain spaces.' };
  }
  
  // Uppercase letter
  if (!/[A-Z]/.test(username)) {
    return { isValid: false, message: 'Username must contain at least one uppercase letter.' };
  }
  
  // Number
  if (!/[0-9]/.test(username)) {
    return { isValid: false, message: 'Username must contain at least one number.' };
  }
  
  // Special character
  if (!SPECIAL_CHARS.test(username)) {
    return { isValid: false, message: 'Username must contain at least one special character (!@#$%^&*).' };
  }
  
  // Name inclusion
  if (!isNameIncluded(username, fullName)) {
    return { isValid: false, message: 'Username must include part of your full name.' };
  }
  
  // Unique check
  const users = getUsersFromStorage();
  if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    return { isValid: false, message: 'Username already exists. Please choose another.' };
  }
  
  return { isValid: true, message: '' };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} {strength: 'weak'|'medium'|'strong', message: string}
 */
function validatePasswordStrength(password) {
  let strength = 'weak';
  
  if (password.length >= 8) {
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) {
      strength = 'strong';
    } else if (/[0-9]/.test(password) || /[A-Z]/.test(password)) {
      strength = 'medium';
    }
  }
  
  return { strength };
}

/**
 * Update password strength indicator
 */
function updatePasswordStrength() {
  const password = document.getElementById('password').value;
  const strengthDiv = document.getElementById('passwordStrength');
  
  if (!strengthDiv) return;
  
  if (!password) {
    strengthDiv.className = 'password-strength';
    return;
  }
  
  const { strength } = validatePasswordStrength(password);
  strengthDiv.className = `password-strength ${strength}`;
}

/**
 * Validate password match
 */
function validatePasswordMatch() {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorElement = document.getElementById('confirmPasswordError');
  
  if (!errorElement) return;
  
  if (password && confirmPassword && password !== confirmPassword) {
    errorElement.textContent = 'Passwords do not match.';
    errorElement.classList.add('show');
  } else {
    errorElement.textContent = '';
    errorElement.classList.remove('show');
  }
}

/**
 * Toggle password visibility
 * @param {string} inputId - ID of password input
 */
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

// ============================================
// REGISTRATION HANDLER
// ============================================

/**
 * Handle registration form submission
 * @param {Event} event - Form submit event
 */
function handleRegister(event) {
  event.preventDefault();
  
  // Initialize storage
  initializeStorage();
  
  // Get form values
  const fullName = document.getElementById('fullName').value.trim();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Clear all previous error messages
  clearRegistrationErrors();
  
  // Validate full name
  const fullNameValidation = validateFullName(fullName);
  if (!fullNameValidation.isValid) {
    showError('fullNameError', fullNameValidation.message);
    return;
  }
  
  // Validate username
  const usernameValidation = validateUsernameComplete(username, fullName);
  if (!usernameValidation.isValid) {
    showError('usernameError', usernameValidation.message);
    return;
  }
  
  // Validate password
  if (!password || password.length < 6) {
    showError('passwordError', 'Password must be at least 6 characters.');
    return;
  }
  
  // Validate password match
  if (password !== confirmPassword) {
    showError('confirmPasswordError', 'Passwords do not match.');
    return;
  }
  
  // Validate email if provided
  if (email && !isValidEmail(email)) {
    showError('emailError', 'Please enter a valid email address.');
    return;
  }
  
  // Create new user object
  const newUser = {
    id: generateUserId(),
    fullName,
    username,
    email: email || null,
    password, // In production, this would be hashed
    createdAt: new Date().toISOString(),
  };
  
  // Save user to storage
  const users = getUsersFromStorage();
  users.push(newUser);
  saveUsersToStorage(users);
  
  // Show success message and redirect
  showSuccessMessage();
  setTimeout(() => {
    window.location.href = 'login.html?registered=true';
  }, 2000);
}

/**
 * Clear all registration error messages
 */
function clearRegistrationErrors() {
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
}

/**
 * Show error message
 * @param {string} elementId - ID of error element
 * @param {string} message - Error message to show
 */
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.classList.add('show');
  }
}

/**
 * Show success message
 */
function showSuccessMessage() {
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.textContent = '✓ Account Created!';
    submitBtn.disabled = true;
    submitBtn.style.background = 'linear-gradient(135deg, #a8e6cf 0%, #bfa2db 100%)';
  }
}

// ============================================
// LOGIN HANDLER
// ============================================

/**
 * Handle login form submission
 * @param {Event} event - Form submit event
 */
function handleLogin(event) {
  event.preventDefault();
  
  // Initialize storage
  initializeStorage();
  
  // Get form values
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  // Clear previous errors
  clearLoginErrors();
  
  // Basic validation
  if (!username) {
    showLoginError('Username is required.');
    return;
  }
  
  if (!password) {
    showLoginError('Password is required.');
    return;
  }
  
  // Find user in storage
  const users = getUsersFromStorage();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  // Check if user exists and password matches
  if (!user || user.password !== password) {
    showLoginError('Invalid username or password. Please try again.');
    return;
  }
  
  // Successful login
  setCurrentUser({
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
  });
  
  // Show success and redirect
  showLoginSuccess();
  setTimeout(() => {
    window.location.href = 'index.html?loggedIn=true';
  }, 1500);
}

/**
 * Clear login error messages
 */
function clearLoginErrors() {
  const errorElement = document.getElementById('loginErrorAlert');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

/**
 * Show login error message
 * @param {string} message - Error message
 */
function showLoginError(message) {
  const errorAlert = document.getElementById('loginErrorAlert');
  const errorText = document.getElementById('loginErrorText');
  
  if (errorAlert && errorText) {
    errorText.textContent = message;
    errorAlert.style.display = 'flex';
  }
}

/**
 * Show login success message
 */
function showLoginSuccess() {
  const submitBtn = document.getElementById('loginSubmitBtn');
  if (submitBtn) {
    submitBtn.textContent = '✓ Logging in...';
    submitBtn.disabled = true;
  }
}

// ============================================
// LOGOUT FUNCTION
// ============================================

/**
 * Logout the current user
 */
function logout() {
  clearCurrentUser();
  window.location.href = 'login.html?loggedOut=true';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate unique user ID
 * @returns {string} Unique user ID
 */
function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
function isLoggedIn() {
  return !!getCurrentUser();
}

/**
 * Get formatted date
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================
// PAGE INITIALIZATION
// ============================================

/**
 * Initialize page based on context
 */
document.addEventListener('DOMContentLoaded', function() {
  // Check which page we're on
  const currentPage = window.location.pathname.split('/').pop();
  
  // Initialize storage on any auth page
  initializeStorage();
  
  // Add event listeners for password field
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('input', updatePasswordStrength);
  }
  
  // Check for logged-in status
  checkAuthStatus();
});

/**
 * Check and handle authentication status messages
 */
function checkAuthStatus() {
  const params = new URLSearchParams(window.location.search);
  
  // Check if just registered
  if (params.get('registered') === 'true') {
    console.log('Registration successful! You can now log in.');
  }
  
  // Check if just logged out
  if (params.get('loggedOut') === 'true') {
    console.log('You have been logged out.');
  }
  
  // Check if already logged in
  if (params.get('loggedIn') === 'true') {
    console.log('Login successful! Welcome back.');
  }
}

// ============================================
// DEBUGGING UTILITIES (Remove in production)
// ============================================

/**
 * Debug: View all stored users (console only)
 */
function debugViewUsers() {
  console.log('Stored Users:', getUsersFromStorage());
}

/**
 * Debug: View current user (console only)
 */
function debugViewCurrentUser() {
  console.log('Current User:', getCurrentUser());
}

/**
 * Debug: Clear all users and reset storage
 */
function debugResetStorage() {
  localStorage.removeItem(USERS_STORAGE_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  initializeStorage();
  console.log('Storage reset. Demo user re-initialized.');
}

// Export for use with Node.js/Express (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateUsername: validateUsernameComplete,
    validatePasswordStrength,
    isValidEmail,
    isNameIncluded,
  };
}
