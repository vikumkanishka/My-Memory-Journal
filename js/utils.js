/**
 * UTILITY FUNCTIONS MODULE
 * Shared utilities for the application
 */

import { CONFIG } from './constants.js';

/**
 * Show toast notification with improved accessibility
 */
export const showToast = (message, isError = false) => {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  const icon = isError ? 'fa-exclamation-circle' : 'fa-check-circle';
  toast.className = `toast-msg ${isError ? 'error' : 'success'}`;
  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${sanitizeHTML(message)}</span>`;

  // Trigger animation with reflow
  void toast.offsetWidth;
  toast.classList.add('show');

  // Clear existing timeout
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  
  // Auto-hide
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, CONFIG.TOAST_DURATION);
};

/**
 * Debounce function - prevents excessive function calls
 * Usage: const debouncedSearch = debounce(searchFunc, 300);
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Format date safely with error handling
 */
export const formatDate = (dateString, formatStyle = 'short') => {
  try {
    const date = new Date(dateString);
    const style = formatStyle === 'long' ? CONFIG.DATE_FORMAT_LONG : CONFIG.DATE_FORMAT_SHORT;
    return date.toLocaleDateString(undefined, style);
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

/**
 * Sanitize HTML to prevent XSS attacks
 */
export const sanitizeHTML = (dirty) => {
  const div = document.createElement('div');
  div.textContent = dirty;
  return div.innerHTML;
};

/**
 * Highlight text in content for search results
 */
export const highlightText = (text, query) => {
  if (!query) return sanitizeHTML(text);
  
  try {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const highlighted = text.replace(regex, '<mark>$1</mark>');
    return highlighted;
  } catch (error) {
    console.error('Highlight error:', error);
    return sanitizeHTML(text);
  }
};

/**
 * Get text preview of specified length
 */
export const getTextPreview = (text, maxLength = CONFIG.PREVIEW_LENGTH) => {
  const plainText = text.replace(/<[^>]+>/g, '').trim();
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...' 
    : plainText;
};

/**
 * Compress image before storing (returns Promise)
 */
export const compressImage = (file, maxWidth = 1024, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          const reader2 = new FileReader();
          reader2.readAsDataURL(blob);
          reader2.onload = () => resolve(reader2.result);
          reader2.onerror = reject;
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create accessible mood selector element
 */
export const createMoodOptions = (selectedMood = null) => {
  return CONFIG.MOODS.map(mood => 
    `<option value="${mood.emoji}" ${selectedMood === mood.emoji ? 'selected' : ''}>
      ${mood.emoji} ${mood.label}
    </option>`
  ).join('');
};
