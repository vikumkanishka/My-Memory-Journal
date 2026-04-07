/**
 * CONSTANTS - Centralized configuration
 * Prevents magic numbers scattered throughout the codebase
 */

export const CONFIG = {
  // Storage
  STORAGE_KEY: 'journalEntries',
  THEME_KEY: 'memory_journal_theme',
  
  // File Upload
  MAX_IMAGE_SIZE: 3 * 1024 * 1024, // 3MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4'],
  
  // UI
  TOAST_DURATION: 3000, // 3 seconds
  DEBOUNCE_DELAY: 300, // 300ms for search
  
  // Content
  PREVIEW_LENGTH: 150, // Characters to preview in cards
  
  // Moods - Centralized to avoid duplication
  MOODS: [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😌', label: 'Calm' },
    { emoji: '😤', label: 'Frustrated' },
    { emoji: '🤩', label: 'Excited' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '🤔', label: 'Thoughtful' },
    { emoji: '😰', label: 'Anxious' },
    { emoji: '🥰', label: 'Loved' }
  ],
  
  // Date Formats
  DATE_FORMAT_SHORT: { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' },
  DATE_FORMAT_LONG: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
};

/**
 * QUOTES
 */
export const QUOTES = [
  { text: "Journaling is like whispering to one's self and listening at the same time.", author: "Mina Murray" },
  { text: "Writing is medicine. It is an appropriate antidote to injury.", author: "Julia Cameron" }
];

/**
 * VALIDATION RULES
 */
export const VALIDATION = {
  isValidImage: (file) => {
    if (!file) return false;
    if (file.size > CONFIG.MAX_IMAGE_SIZE) return false;
    return CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type);
  },
  
  isValidEntry: (entry) => {
    return entry &&
           typeof entry.id === 'string' &&
           typeof entry.title === 'string' &&
           typeof entry.date === 'string' &&
           typeof entry.content === 'string' &&
           entry.title.trim().length > 0;
  }
};
