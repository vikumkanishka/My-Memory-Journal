// --- State & Storage ---
const STORAGE_KEY = 'journalEntries';
const THEME_KEY = 'memory_journal_theme';

function getEntries() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getEntryById(id) {
  return getEntries().find(e => e.id === id);
}

function saveEntry(entry) {
  const entries = getEntries();
  const existingIndex = entries.findIndex(e => e.id === entry.id);
  if (existingIndex > -1) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveEntries(entries);
}

function deleteEntry(id) {
  const entries = getEntries();
  const filtered = entries.filter(e => e.id !== id);
  saveEntries(filtered);
}

// --- Theme Management ---
function initTheme() {
  if (window.ThemeManager) {
    window.ThemeManager.init();
    return;
  }

  const theme = localStorage.getItem(THEME_KEY) || 'cloudy';
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  if (window.ThemeManager) {
    window.ThemeManager.cycleTheme();
    return;
  }

  const current = document.documentElement.getAttribute('data-theme') || 'cloudy';
  const themes = ['cloudy', 'nature', 'windy', 'disney'];
  const nextIndex = (themes.indexOf(current) + 1) % themes.length;
  const nextTheme = themes[nextIndex];
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
}

// --- DOM Utilities ---
function showToast(message, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = 'toast-msg' + (isError ? ' error' : '');
  toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${message}`;
  
  void toast.offsetWidth; // Force reflow
  
  toast.classList.add('show');
  
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- Quotes ---
const quotes = [
  { text: "Journaling is like whispering to one's self and listening at the same time.", author: "Mina Murray" },
  { text: "Writing is medicine. It is an appropriate antidote to injury.", author: "Julia Cameron" }
];

function setRandomQuote() {
  const quoteEl = document.getElementById('daily-quote');
  if (quoteEl) {
    const random = quotes[Math.floor(Math.random() * quotes.length)];
    quoteEl.innerHTML = `
      <i class="fas fa-quote-left"></i>
      <div class="quote-text">"${random.text}"</div>
      <div class="quote-author">- ${random.author}</div>
    `;
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeJournalHtml(html = '') {
  const template = document.createElement('template');
  template.innerHTML = String(html);

  const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'A', 'SPAN', 'DIV']);
  const allowedAttrs = {
    A: new Set(['href', 'target', 'rel', 'title'])
  };

  const sanitizeNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || '');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return document.createDocumentFragment();
    }

    const tagName = node.tagName.toUpperCase();
    const children = Array.from(node.childNodes).map(sanitizeNode);

    if (!allowedTags.has(tagName)) {
      const fragment = document.createDocumentFragment();
      children.forEach((child) => fragment.appendChild(child));
      return fragment;
    }

    const element = document.createElement(tagName.toLowerCase());

    if (tagName === 'A') {
      const href = node.getAttribute('href') || '';
      if (/^(https?:|mailto:|#)/i.test(href)) {
        element.setAttribute('href', href);
      }
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noreferrer noopener');
    }

    Array.from(node.attributes).forEach((attribute) => {
      const allowed = allowedAttrs[tagName];
      if (allowed && allowed.has(attribute.name)) {
        element.setAttribute(attribute.name, attribute.value);
      }
    });

    children.forEach((child) => element.appendChild(child));
    return element;
  };

  const container = document.createElement('div');
  Array.from(template.content.childNodes).forEach((node) => {
    container.appendChild(sanitizeNode(node));
  });

  return container.innerHTML;
}

function renderJournalContent(content = '') {
  const rawContent = String(content || '');
  if (!rawContent.trim()) {
    return '';
  }

  if (/<[a-z][\s\S]*>/i.test(rawContent)) {
    return sanitizeJournalHtml(rawContent);
  }

  return `<p>${escapeHtml(rawContent).replace(/\n/g, '<br>')}</p>`;
}

function getEntryCoverImage(entry) {
  if (Array.isArray(entry?.images) && entry.images.length > 0) {
    const firstImage = entry.images[0];
    if (typeof firstImage === 'string') {
      return firstImage;
    }

    if (firstImage && typeof firstImage === 'object') {
      return firstImage.src || firstImage.url || '';
    }
  }

  return entry?.image || '';
}

function normalizeEntryTags(entry) {
  if (Array.isArray(entry?.tags)) {
    return entry.tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof entry?.tags === 'string') {
    return entry.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
}

// --- View Initializers ---

function initNewEntryPage() {
  const form = document.getElementById('entry-form');
  if (!form) return;
  const imageInput = document.getElementById('image');
  const imagePreview = document.getElementById('image-preview');
  const previewContainer = document.getElementById('preview-container');
  const removeImgBtn = document.getElementById('remove-img');
  const contentArea = document.getElementById('content');
  const wordCount = document.getElementById('word-count');
  const dateInput = document.getElementById('date');
  
  let base64Image = null;
  
  // Checking for Edit Mode
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');
  let isEditMode = false;
  
  if (editId) {
    const entry = getEntryById(editId);
    if (entry) {
      isEditMode = true;
      document.querySelector('.page-title').textContent = "Edit Journal Entry";
      document.getElementById('title').value = entry.title;
      dateInput.value = entry.date;
      document.getElementById('mood').value = entry.mood;
      contentArea.value = entry.content;
      
      if (entry.image) {
        base64Image = entry.image;
        imagePreview.src = base64Image;
        previewContainer.style.display = 'inline-block';
      }
      
      // Update word count
      const text = entry.content.trim();
      const words = text ? text.split(/\s+/).length : 0;
      wordCount.textContent = `${words} words`;
    }
  } else {
    // New entry auto date
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
  
  contentArea.addEventListener('input', () => {
    const text = contentArea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    wordCount.textContent = `${words} words`;
  });
  
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) { // 3MB limit
        showToast('Image is too large. Max 3MB.', true);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        base64Image = ev.target.result;
        imagePreview.src = base64Image;
        previewContainer.style.display = 'inline-block';
      };
      reader.readAsDataURL(file);
    }
  });
  
  removeImgBtn.addEventListener('click', () => {
    base64Image = null;
    imageInput.value = '';
    previewContainer.style.display = 'none';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const entry = {
      id: isEditMode ? editId : Date.now().toString(),
      title: document.getElementById('title').value,
      date: dateInput.value,
      mood: document.getElementById('mood').value,
      content: contentArea.value,
      image: base64Image
    };
    saveEntry(entry);
    showToast(isEditMode ? 'Entry updated!' : 'Entry saved successfully!');
    setTimeout(() => {
      window.location.href = 'entries.html';
    }, 1500);
  });
}

let allEntries = [];

function initEntriesPage() {
  allEntries = getEntries();
  const searchInput = document.getElementById('search-input');
  const moodFilter = document.getElementById('filter-mood');
  const sortDate = document.getElementById('sort-date');
  const exportBtn = document.getElementById('export-btn');
  const importInput = document.getElementById('import-input');
  const gridBtn = document.getElementById('grid-view-btn');
  const listBtn = document.getElementById('list-view-btn');
  
  displayEntries(allEntries);
  
  function applyFilters() {
    const query = searchInput.value.toLowerCase();
    const mood = moodFilter.value;
    const sort = sortDate.value;
    
    let filtered = allEntries;
    
    if (query) {
       filtered = searchEntries(query, filtered);
    }
    
    if (mood !== 'all') {
       filtered = filterEntries(mood, filtered);
    }
    
    if (sort === 'oldest') {
       filtered = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
       filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    displayEntries(filtered, query);
  }
  
  searchInput.addEventListener('input', applyFilters);
  moodFilter.addEventListener('change', applyFilters);
  sortDate.addEventListener('change', applyFilters);
  
  // View Toggle
  if (gridBtn && listBtn) {
    gridBtn.addEventListener('click', () => {
      document.getElementById('entries-container').classList.remove('list-view');
      gridBtn.classList.add('active');
      listBtn.classList.remove('active');
    });
    listBtn.addEventListener('click', () => {
      document.getElementById('entries-container').classList.add('list-view');
      listBtn.classList.add('active');
      gridBtn.classList.remove('active');
    });
  }

  // Import / Export
  exportBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allEntries));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "journal_entries.json");
    dlAnchorElem.click();
  });
  
  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (Array.isArray(imported)) {
            // merge
            const current = getEntries();
            const currentIds = new Set(current.map(en => en.id));
            imported.forEach(en => {
              if(!currentIds.has(en.id)) {
                current.push(en);
              }
            });
            saveEntries(current);
            allEntries = getEntries();
            applyFilters();
            showToast('Memories imported successfully!');
          }
        } catch(err) {
          showToast('Invalid JSON file.', true);
        }
      };
      reader.readAsText(file);
    }
  });

  // Global Delete Modal handling
  const cancelDeleteBtn = document.getElementById('cancel-delete');
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  let entryToDelete = null;

  window.openDeleteModal = function(id) {
    entryToDelete = id;
    document.getElementById('delete-modal').classList.add('active');
  };

  cancelDeleteBtn.addEventListener('click', () => {
    entryToDelete = null;
    document.getElementById('delete-modal').classList.remove('active');
  });

  confirmDeleteBtn.addEventListener('click', () => {
    if (entryToDelete) {
      deleteEntry(entryToDelete);
      allEntries = getEntries();
      applyFilters();
      document.getElementById('delete-modal').classList.remove('active');
      showToast('Memory deleted.');
    }
  });
}

function searchEntries(query, entries) {
  return entries.filter(e => 
    String(e.title || '').toLowerCase().includes(query) || 
    String(e.content || '').toLowerCase().includes(query) ||
    normalizeEntryTags(e).join(' ').toLowerCase().includes(query) ||
    String(e.location || '').toLowerCase().includes(query)
  );
}

function filterEntries(mood, entries) {
  return entries.filter(e => e.mood === mood);
}

function highlightText(text, query) {
  const safeText = escapeHtml(text || '');
  if (!query) return safeText;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return safeText.replace(regex, '<mark>$1</mark>');
}

function displayEntries(entriesList, highlightQuery = '') {
  const container = document.getElementById('entries-container');
  container.innerHTML = '';
  
  if (entriesList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-book-open"></i>
        <p>No memories yet. Start writing your first journal 💭</p>
        <a href="new.html" class="btn btn-primary">Create Entry</a>
      </div>
    `;
    return;
  }
  
  entriesList.forEach(entry => {
    const card = document.createElement('div');
    card.className = 'entry-card';
    
    const coverImage = getEntryCoverImage(entry);
    const tags = normalizeEntryTags(entry);
    const statusPill = entry.isDraft ? 'Draft' : (entry.privacy === 'public' ? 'Public' : 'Private');

    let imgHtml = '';
    if (coverImage) {
      imgHtml = `
        <div class="card-img-wrapper">
          <img src="${escapeHtml(coverImage)}" class="card-img" alt="Memory thumbnail">
        </div>
      `;
    }
    
    // Preview - Limit to first 100-150 characters
    let plainTextContent = String(entry.content || '').replace(/<[^>]+>/g, '');
    let preview = plainTextContent.length > 150 ? plainTextContent.substring(0, 150) + '...' : plainTextContent;
    
    let highlightedTitle = highlightText(entry.title, highlightQuery);
    let highlightedPreview = highlightText(preview, highlightQuery);
    
    // Formatting date safely
    let formattedDate = entry.date;
    try {
        formattedDate = new Date(entry.date).toLocaleDateString(undefined, {
            weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch(e) {}

    card.innerHTML = `
      ${imgHtml}
      <div class="card-content">
        <div class="card-header">
          <div>
            <div class="card-date">${escapeHtml(formattedDate)}</div>
            <h3 class="card-title">${highlightedTitle}</h3>
          </div>
          <div class="card-badges">
            ${entry.favorite ? '<span class="card-badge favorite"><i class="fas fa-star"></i></span>' : ''}
            <div class="mood">${escapeHtml(entry.mood || '')}</div>
          </div>
        </div>
        <div class="card-text">${highlightedPreview}</div>
        ${tags.length ? `<div class="card-tags">${tags.slice(0, 3).map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        <div class="card-status-row">
          <span class="status-pill ${entry.isDraft ? 'draft' : entry.privacy === 'public' ? 'public' : 'private'}">${escapeHtml(statusPill)}</span>
          ${entry.location ? `<span class="location-pill"><i class="fas fa-location-dot"></i> ${escapeHtml(entry.location)}</span>` : ''}
        </div>
        <div class="card-footer">
          <div class="card-actions">
            <a href="view.html?id=${entry.id}" class="icon-btn" title="View"><i class="fas fa-eye"></i></a>
            <a href="new.html?id=${entry.id}" class="icon-btn" title="Edit"><i class="fas fa-edit"></i></a>
            <button onclick="window.openDeleteModal('${entry.id}')" class="icon-btn danger" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function initViewPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if(!id) {
    window.location.href = 'entries.html';
    return;
  }
  
  const entry = getEntryById(id);
  if(!entry) {
    window.location.href = 'entries.html';
    return;
  }
  
  let formattedDate = entry.date;
  try {
      formattedDate = new Date(entry.date).toLocaleDateString(undefined, {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
  } catch(e) {}

  const titleEl = document.getElementById('view-title');
  const dateEl = document.getElementById('view-date');
  const moodEl = document.getElementById('view-mood');
  const privacyEl = document.getElementById('view-privacy');
  const favoriteEl = document.getElementById('view-favorite');
  const locationEl = document.getElementById('view-location');
  const tagsEl = document.getElementById('view-tags');
  const galleryEl = document.getElementById('view-gallery');
  const contentEl = document.getElementById('view-content');

  if (titleEl) titleEl.textContent = entry.title;
  if (dateEl) dateEl.innerHTML = `<i class="far fa-calendar-alt"></i> ${escapeHtml(formattedDate)}`;
  if (moodEl) moodEl.textContent = entry.mood || '';
  if (privacyEl) privacyEl.textContent = entry.isDraft ? 'Draft' : (entry.privacy === 'public' ? 'Public memory' : 'Private memory');
  if (favoriteEl) favoriteEl.innerHTML = entry.favorite ? '<i class="fas fa-star"></i> Highlighted memory' : '<i class="far fa-star"></i> Regular memory';
  if (locationEl) locationEl.textContent = entry.location ? `Captured in ${entry.location}` : 'No location added';

  const tags = normalizeEntryTags(entry);
  if (tagsEl) {
    tagsEl.innerHTML = tags.length ? tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join('') : '<span class="tag-chip muted">No tags</span>';
  }

  const images = Array.isArray(entry.images) && entry.images.length > 0 ? entry.images : (entry.image ? [entry.image] : []);
  if (galleryEl) {
    galleryEl.innerHTML = images.length
      ? images.map((image, index) => {
        const src = typeof image === 'string' ? image : image?.src || image?.url || '';
        const label = typeof image === 'string' ? `Photo ${index + 1}` : image?.name || `Photo ${index + 1}`;
        return `<figure class="view-gallery-item"><img src="${escapeHtml(src)}" alt="Memory photo ${index + 1}"><figcaption>${escapeHtml(label)}</figcaption></figure>`;
      }).join('')
      : '';
  }

  if (entry.isScrapbook) {
     if (contentEl) {
       contentEl.innerHTML = '';
       contentEl.style.padding = '0';
     }
     
     const canvasWrap = document.createElement('div');
     canvasWrap.className = 'scrapbook-canvas';
     canvasWrap.setAttribute('data-bg', entry.background || 'plain');
     canvasWrap.style.width = '100%'; 
     canvasWrap.style.minHeight = '800px';
     
     entry.elements.forEach(data => {
        let node = document.createElement('div');
        node.className = `canvas-element el-${data.type}`;
        node.style.left = data.x + 'px';
        node.style.top = data.y + 'px';
        node.style.width = data.width + 'px';
        if(data.type !== 'text') node.style.height = data.height + 'px';
        node.style.zIndex = data.styles.zIndex;
        node.style.position = 'absolute';
        node.style.pointerEvents = 'none';
        
        if (data.type === 'text') {
           node.style.fontFamily = data.styles.fontFamily;
           node.style.fontSize = data.styles.fontSize;
           node.style.color = data.styles.color;
           node.style.textAlign = data.styles.textAlign;
           node.style.fontWeight = data.styles.fontWeight;
           node.style.fontStyle = data.styles.fontStyle;
           node.innerHTML = data.content;
        } else if (data.type === 'image') {
           node.className += ` frame-${data.styles.frame}`;
           node.innerHTML = `<img src="${data.content}" style="width:100%;height:100%;object-fit:cover;">`;
        } else if (data.type === 'video') {
           node.style.pointerEvents = 'auto';
           node.innerHTML = `<video src="${data.content}" controls style="width:100%;height:100%;object-fit:cover;"></video>`;
        } else if (data.type === 'sticker') {
           node.innerHTML = data.content;
           node.style.fontSize = data.width + 'px';
        }
        canvasWrap.appendChild(node);
     });
     if (contentEl) {
       contentEl.appendChild(canvasWrap);
     }
     
     document.getElementById('edit-btn').onclick = () => window.location.href = `new.html?id=${entry.id}`;
  } else {
     if (contentEl) {
       contentEl.innerHTML = renderJournalContent(entry.content || '');
     }
     document.getElementById('edit-btn').onclick = () => window.location.href = `new.html?id=${entry.id}`;
  }

  const deleteModal = document.getElementById('delete-modal');
  document.getElementById('delete-entry-btn').addEventListener('click', () => {
    deleteModal.classList.add('active');
  });
  
  document.getElementById('cancel-delete').addEventListener('click', () => {
    deleteModal.classList.remove('active');
  });

  document.getElementById('confirm-delete').addEventListener('click', () => {
    deleteEntry(entry.id);
    showToast('Memory deleted.');
    setTimeout(() => {
      window.location.href = 'entries.html';
    }, 1000);
  });
}

// --- Global Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  const themeToggleGrp = document.getElementById('theme-toggle');
  if (themeToggleGrp) {
    themeToggleGrp.addEventListener('click', toggleTheme);
  }

  const themeSelector = document.getElementById('theme-selector');
  if (themeSelector && window.ThemeManager) {
    window.ThemeManager.bindControls();
  }
  
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path === '/' || path.endsWith('memory-journal/')) {
    setRandomQuote();
  } else if (path.endsWith('new.html')) {
    if (typeof window.initJournalComposerPage === 'function' && document.getElementById('journal-entry-form')) {
      window.initJournalComposerPage();
    } else {
      initNewEntryPage();
    }
  } else if (path.endsWith('entries.html')) {
    initEntriesPage();
  } else if (path.endsWith('view.html')) {
    initViewPage();
  }
});
