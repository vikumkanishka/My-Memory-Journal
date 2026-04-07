/**
 * STORAGE MODULE - Handles all localStorage operations
 * Separated from UI logic for better maintainability
 */

import { CONFIG, VALIDATION } from './constants.js';

export const Storage = {
  /**
   * Get all journal entries
   */
  getEntries: () => {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading entries:', error);
      return [];
    }
  },

  /**
   * Save all entries
   */
  saveEntries: (entries) => {
    try {
      if (!Array.isArray(entries)) throw new Error('Entries must be an array');
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving entries:', error);
      throw error;
    }
  },

  /**
   * Get single entry by ID
   */
  getEntryById: (id) => {
    const entries = Storage.getEntries();
    return entries.find(e => e.id === id);
  },

  /**
   * Save or update single entry
   */
  saveEntry: (entry) => {
    // Validate entry structure
    if (!VALIDATION.isValidEntry(entry)) {
      throw new Error('Invalid entry format');
    }

    try {
      const entries = Storage.getEntries();
      const existingIndex = entries.findIndex(e => e.id === entry.id);
      
      if (existingIndex > -1) {
        entries[existingIndex] = entry;
      } else {
        entries.push(entry);
      }
      
      // Sort by date (newest first)
      entries.sort((a, b) => new Date(b.date) - new Date(a.date));
      Storage.saveEntries(entries);
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error;
    }
  },

  /**
   * Delete entry by ID
   */
  deleteEntry: (id) => {
    try {
      const entries = Storage.getEntries();
      const filtered = entries.filter(e => e.id !== id);
      Storage.saveEntries(filtered);
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  },

  /**
   * Import entries from JSON
   */
  importEntries: (newEntries) => {
    if (!Array.isArray(newEntries)) {
      throw new Error('Import data must be an array');
    }

    try {
      const current = Storage.getEntries();
      const currentIds = new Set(current.map(e => e.id));
      
      // Merge: only add new entries (avoid duplicates)
      newEntries.forEach(entry => {
        if (VALIDATION.isValidEntry(entry) && !currentIds.has(entry.id)) {
          current.push(entry);
        }
      });
      
      Storage.saveEntries(current);
      return current.length;
    } catch (error) {
      console.error('Error importing entries:', error);
      throw error;
    }
  },

  /**
   * Export all entries as JSON
   */
  exportEntries: () => {
    return Storage.getEntries();
  }
};
