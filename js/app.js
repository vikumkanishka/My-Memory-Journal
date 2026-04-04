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
  const theme = localStorage.getItem(THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  let theme = document.documentElement.getAttribute('data-theme');
  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#theme-toggle i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
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

// --- View Initializers ---

function initNewEntryPage() {
  const form = document.getElementById('entry-form');
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
    e.title.toLowerCase().includes(query) || 
    e.content.toLowerCase().includes(query)
  );
}

function filterEntries(mood, entries) {
  return entries.filter(e => e.mood === mood);
}

function highlightText(text, query) {
  if (!query) return text;
  // Replace the exact matching string ignoring case
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
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
    
    let imgHtml = '';
    if (entry.image) {
      imgHtml = `
        <div class="card-img-wrapper">
          <img src="${entry.image}" class="card-img" alt="Memory thumbnail">
        </div>
      `;
    }
    
    // Preview - Limit to first 100-150 characters
    let plainTextContent = entry.content.replace(/<[^>]+>/g, '');
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
            <div class="card-date">${formattedDate}</div>
            <h3 class="card-title">${highlightedTitle}</h3>
          </div>
          <div class="mood">${entry.mood}</div>
        </div>
        <div class="card-text">${highlightedPreview}</div>
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

  document.getElementById('view-title').textContent = entry.title;
  document.getElementById('view-date').innerHTML = `<i class="far fa-calendar-alt"></i> ${formattedDate}`;
  document.getElementById('view-mood').textContent = entry.mood;

  if (entry.isScrapbook) {
     const viewContent = document.getElementById('view-content');
     viewContent.innerHTML = '';
     viewContent.style.padding = '0';
     
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
     viewContent.appendChild(canvasWrap);
     
     const imgEl = document.getElementById('view-image');
     if (imgEl) imgEl.style.display = 'none';
     
     document.getElementById('edit-btn').onclick = () => window.location.href = `new.html?id=${entry.id}`;
  } else {
     document.getElementById('view-content').textContent = entry.content;
     if (entry.image) {
       const imgEl = document.getElementById('view-image');
       imgEl.src = entry.image;
       imgEl.style.display = 'block';
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
  
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path === '/' || path.endsWith('memory-journal/')) {
    setRandomQuote();
  } else if (path.endsWith('new.html')) {
    initNewEntryPage();
  } else if (path.endsWith('entries.html')) {
    initEntriesPage();
  } else if (path.endsWith('view.html')) {
    initViewPage();
  }
});
