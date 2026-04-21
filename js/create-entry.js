window.initJournalComposerPage = () => {
  const form = document.getElementById('journal-entry-form');
  if (!form) return;

  const entryIdInput = document.getElementById('journal-entry-id');
  const titleInput = document.getElementById('journal-title');
  const dateInput = document.getElementById('journal-date');
  const moodSelect = document.getElementById('journal-mood');
  const locationInput = document.getElementById('entry-location');
  const editor = document.getElementById('journal-editor');
  const tagInput = document.getElementById('tag-input');
  const tagList = document.getElementById('tag-list');
  const addTagBtn = document.getElementById('add-tag-btn');
  const quickTagButtons = Array.from(document.querySelectorAll('.quick-tag'));
  const saveStatus = document.getElementById('save-status');
  const lastEdited = document.getElementById('last-edited');
  const wordCount = document.getElementById('word-count');
  const errorsBox = document.getElementById('form-errors');
  const saveDraftBtn = document.getElementById('save-draft-btn');
  const saveEntryBtn = document.getElementById('save-entry-btn');
  const cancelBtn = document.getElementById('cancel-entry');
  const imageInput = document.getElementById('journal-image-input');
  const imageButton = document.getElementById('image-button');
  const clearFormatButton = document.getElementById('clear-format-button');
  const headingSelect = document.getElementById('heading-select');
  const fontFamilySelect = document.getElementById('font-family-select');
  const fontSizeSelect = document.getElementById('font-size-select');
  const textColorInput = document.getElementById('text-color-input');
  const highlightColorInput = document.getElementById('highlight-color-input');
  const recentEntries = document.getElementById('recent-entries');
  const recentEntryCount = document.getElementById('recent-entry-count');
  const imageCropperModal = document.getElementById('image-cropper-modal');
  const cropperPreview = document.getElementById('cropper-preview');
  const cropApplyBtn = document.getElementById('crop-apply');
  const cropCancelButtons = Array.from(document.querySelectorAll('[data-modal-cancel]'));
  const cropRotateLeftBtn = document.getElementById('crop-rotate-left');
  const cropRotateRightBtn = document.getElementById('crop-rotate-right');
  const sidebarDarkToggle = document.getElementById('sidebar-dark-toggle');
  const sidebarFocusToggle = document.getElementById('sidebar-focus-toggle');
  const sidebarFullscreenToggle = document.getElementById('sidebar-fullscreen-toggle');
  const sidebarExportPdf = document.getElementById('sidebar-export-pdf');

  const STORAGE_PREFIX = 'memory_journal_writer_draft';
  const today = new Date().toISOString().split('T')[0];
  const queryParams = new URLSearchParams(window.location.search);
  const editingEntryId = queryParams.get('id') || '';
  const draftKey = editingEntryId ? `${STORAGE_PREFIX}_${editingEntryId}` : `${STORAGE_PREFIX}_new`;

  const state = {
    tags: [],
    selectedRange: null,
    draggedFigure: null,
    cropper: null,
    cropQueue: [],
    activeCrop: null,
    saveTimer: null,
    focusMode: false,
    fullscreen: false,
    activeDraft: null
  };

  const notify = (message, isError = false) => {
    if (typeof showToast === 'function') {
      showToast(message, isError);
      return;
    }

    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = isError ? 'toast-msg error show' : 'toast-msg success show';
    window.clearTimeout(window.toastTimeout);
    window.toastTimeout = window.setTimeout(() => {
      toast.className = toast.className.replace(' show', '');
    }, 2500);
  };

  const getEntries = () => {
    try {
      const raw = localStorage.getItem('journalEntries');
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  };

  const getEntryById = (id) => {
    const normalized = String(id || '');
    return getEntries().find((entry) => String(entry?.id || '') === normalized) || null;
  };

  const saveEntry = (entry) => {
    const entries = getEntries();
    const normalized = String(entry?.id || '');
    const index = entries.findIndex((current) => String(current?.id || '') === normalized);

    if (index >= 0) {
      entries[index] = entry;
    } else {
      entries.push(entry);
    }

    entries.sort((left, right) => new Date(right.date) - new Date(left.date));
    localStorage.setItem('journalEntries', JSON.stringify(entries));
  };

  const formatDateTime = (value) => {
    try {
      return new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (error) {
      return 'just now';
    }
  };

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const sanitizeEditorHtml = (html = '') => {
    const template = document.createElement('template');
    template.innerHTML = String(html);

    const allowedTags = new Set([
      'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI', 'BLOCKQUOTE',
      'A', 'SPAN', 'DIV', 'FIGURE', 'FIGCAPTION', 'IMG', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'
    ]);
    const allowedAttrs = {
      A: new Set(['href', 'target', 'rel', 'title']),
      IMG: new Set(['src', 'alt', 'title', 'loading', 'width', 'height', 'draggable']),
      FIGURE: new Set(['draggable'])
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

      Array.from(node.attributes).forEach((attribute) => {
        if (attribute.name === 'style') {
          element.setAttribute('style', attribute.value);
          return;
        }

        if (attribute.name.startsWith('data-')) {
          element.setAttribute(attribute.name, attribute.value);
          return;
        }

        const allowed = allowedAttrs[tagName];
        if (allowed && allowed.has(attribute.name)) {
          element.setAttribute(attribute.name, attribute.value);
        }
      });

      if (tagName === 'A') {
        const href = node.getAttribute('href') || '';
        if (/^(https?:|mailto:|#)/i.test(href)) {
          element.setAttribute('href', href);
        }
        element.setAttribute('target', '_blank');
        element.setAttribute('rel', 'noreferrer noopener');
      }

      if (tagName === 'IMG') {
        const src = node.getAttribute('src') || '';
        if (/^(data:image\/|https?:|blob:)/i.test(src)) {
          element.setAttribute('src', src);
        }
      }

      children.forEach((child) => element.appendChild(child));
      return element;
    };

    const container = document.createElement('div');
    Array.from(template.content.childNodes).forEach((node) => {
      container.appendChild(sanitizeNode(node));
    });

    return container.innerHTML;
  };

  const getSelectionRange = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return null;
    return range;
  };

  const saveSelection = () => {
    const range = getSelectionRange();
    if (range) {
      state.selectedRange = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    if (!state.selectedRange) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(state.selectedRange);
  };

  const focusEditor = () => {
    editor.focus();
  };

  const updateMetrics = () => {
    const plainText = (editor.textContent || '').trim();
    const words = plainText ? plainText.split(/\s+/).length : 0;
    if (wordCount) wordCount.textContent = `${words} word${words === 1 ? '' : 's'}`;
  };

  const setSaveStatus = (message, accent = 60) => {
    if (saveStatus) saveStatus.textContent = message;
    if (lastEdited) lastEdited.textContent = `Last edited ${formatDateTime(new Date())}`;
    if (wordCount && accent) {
      wordCount.dataset.accent = String(accent);
    }
  };

  const showErrors = (messages = []) => {
    if (!errorsBox) return;
    if (!messages.length) {
      errorsBox.classList.remove('active');
      errorsBox.innerHTML = '';
      return;
    }

    errorsBox.innerHTML = messages.map((message) => `<div>${escapeHtml(message)}</div>`).join('');
    errorsBox.classList.add('active');
  };

  const normalizeTag = (value) => String(value || '').trim().replace(/^#/, '').replace(/\s+/g, ' ');

  const renderTags = () => {
    if (!tagList) return;

    tagList.innerHTML = state.tags.length
      ? state.tags.map((tag) => `
        <span class="tag-chip">
          <span>#${escapeHtml(tag)}</span>
          <button type="button" aria-label="Remove ${escapeHtml(tag)} tag" data-tag-remove="${escapeHtml(tag)}"><i class="fas fa-times"></i></button>
        </span>
      `).join('')
      : '<span class="tag-chip"><span>No tags yet</span></span>';

    tagList.querySelectorAll('[data-tag-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        const tag = normalizeTag(button.getAttribute('data-tag-remove'));
        state.tags = state.tags.filter((current) => current.toLowerCase() !== tag.toLowerCase());
        renderTags();
        scheduleAutosave('Tags updated');
      });
    });
  };

  const addTag = (value) => {
    const tag = normalizeTag(value);
    if (!tag) return;

    const exists = state.tags.some((current) => current.toLowerCase() === tag.toLowerCase());
    if (exists) return;

    state.tags.push(tag);
    renderTags();
    scheduleAutosave('Tags updated');
  };

  const renderRecentEntries = () => {
    if (!recentEntries) return;
    const entries = getEntries().slice().sort((left, right) => new Date(right.date) - new Date(left.date)).slice(0, 6);
    if (recentEntryCount) {
      recentEntryCount.textContent = String(entries.length);
    }

    if (!entries.length) {
      recentEntries.innerHTML = '<div class="recent-entry" tabindex="0"><strong>No entries yet</strong><small>Your first journal page will appear here.</small></div>';
      return;
    }

    recentEntries.innerHTML = entries.map((entry) => {
      const title = entry.title || 'Untitled Entry';
      const date = formatDateTime(entry.updatedAt || entry.date || new Date());
      const mood = entry.mood || '✍️';
      const status = entry.isDraft ? 'Draft' : 'Saved';
      return `
        <button type="button" class="recent-entry" data-open-entry="${escapeHtml(String(entry.id || ''))}">
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(date)} · ${escapeHtml(mood)} · ${escapeHtml(status)}</small>
        </button>
      `;
    }).join('');

    recentEntries.querySelectorAll('[data-open-entry]').forEach((button) => {
      button.addEventListener('click', () => {
        const entryId = button.getAttribute('data-open-entry');
        if (!entryId) return;
        window.location.href = `new.html?id=${encodeURIComponent(entryId)}`;
      });
    });
  };

  const collectImageData = () => Array.from(editor.querySelectorAll('figure.journal-figure img')).map((image, index) => {
    const figure = image.closest('figure.journal-figure');
    const caption = figure ? (figure.querySelector('figcaption')?.textContent || '') : '';
    const width = figure ? Math.round(figure.getBoundingClientRect().width) : image.naturalWidth || 0;
    return {
      src: image.getAttribute('src') || '',
      name: image.getAttribute('alt') || `Photo ${index + 1}`,
      caption: caption.trim(),
      width
    };
  }).filter((image) => image.src);

  const syncFigureSizes = () => {
    editor.querySelectorAll('figure.journal-figure').forEach((figure) => {
      const width = Math.round(figure.getBoundingClientRect().width);
      if (width > 0) {
        figure.style.width = `${width}px`;
        figure.dataset.width = String(width);
      }
    });
  };

  const applyFigureDecorations = () => {
    editor.querySelectorAll('figure.journal-figure').forEach((figure) => {
      figure.classList.add('journal-figure');
      figure.setAttribute('draggable', 'true');
      figure.setAttribute('contenteditable', 'false');

      if (figure.dataset.width && !figure.style.width) {
        figure.style.width = `${figure.dataset.width}px`;
      }

      let removeButton = figure.querySelector('.figure-remove');
      if (!removeButton) {
        removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'figure-remove';
        removeButton.setAttribute('aria-label', 'Remove image');
        removeButton.innerHTML = '<i class="fas fa-times"></i>';
        figure.prepend(removeButton);
      }

      const caption = figure.querySelector('figcaption');
      if (caption) {
        caption.setAttribute('contenteditable', 'true');
        caption.setAttribute('data-placeholder', 'Add a caption');
      }

      if (!figure.dataset.bound) {
        figure.dataset.bound = 'true';

        figure.addEventListener('dragstart', (event) => {
          state.draggedFigure = figure;
          figure.classList.add('is-dragging');
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', 'journal-figure');
          }
        });

        figure.addEventListener('dragend', () => {
          state.draggedFigure = null;
          figure.classList.remove('is-dragging');
        });

        figure.addEventListener('click', (event) => {
          const target = event.target;
          if (target.closest('.figure-remove')) {
            figure.remove();
            scheduleAutosave('Image removed');
            updateMetrics();
            return;
          }
        });
      }
    });
  };

  const setEditorHtml = (html) => {
    editor.innerHTML = sanitizeEditorHtml(html || '');
    applyFigureDecorations();
    syncFigureSizes();
    updateMetrics();
  };

  const insertNodeAtSelection = (node) => {
    restoreSelection();
    const range = getSelectionRange() || document.createRange();
    if (!getSelectionRange()) {
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    saveSelection();
    applyFigureDecorations();
    syncFigureSizes();
  };

  const insertHtmlAtSelection = (html) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const fragment = document.createDocumentFragment();
    Array.from(wrapper.childNodes).forEach((node) => fragment.appendChild(node));

    restoreSelection();
    const range = getSelectionRange() || document.createRange();
    if (!getSelectionRange()) {
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    range.deleteContents();
    range.insertNode(fragment);
    editor.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
    applyFigureDecorations();
    syncFigureSizes();
  };

  const insertImageFigure = (src, name = 'Inserted image') => {
    const figure = document.createElement('figure');
    figure.className = 'journal-figure';
    figure.setAttribute('draggable', 'true');
    figure.setAttribute('contenteditable', 'false');
    figure.style.width = '560px';
    figure.dataset.width = '560';
    figure.innerHTML = `
      <img src="${escapeHtml(src)}" alt="${escapeHtml(name)}">
      <figcaption contenteditable="true" data-placeholder="Add a caption"></figcaption>
    `;

    insertNodeAtSelection(figure);
    figure.insertAdjacentHTML('afterend', '<p><br></p>');
    saveSelection();
    notify('Image inserted');
    scheduleAutosave('Image inserted');
  };

  const applyInlineStyle = (styleMap) => {
    restoreSelection();
    const range = getSelectionRange();
    if (!range || range.collapsed) {
      return false;
    }

    const span = document.createElement('span');
    Object.entries(styleMap).forEach(([property, value]) => {
      if (value) {
        span.style[property] = value;
      }
    });
    span.appendChild(range.extractContents());
    range.insertNode(span);
    range.selectNodeContents(span);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    saveSelection();
    applyFigureDecorations();
    return true;
  };

  const applyCommand = (command, value = null) => {
    focusEditor();
    restoreSelection();

    if (command === 'blockquote') {
      document.execCommand('formatBlock', false, 'blockquote');
      scheduleAutosave('Block quote applied');
      return;
    }

    if (command === 'formatBlock') {
      document.execCommand('formatBlock', false, value || 'p');
      scheduleAutosave('Heading updated');
      return;
    }

    if (command === 'fontFamily') {
      if (applyInlineStyle({ fontFamily: value })) {
        scheduleAutosave('Font updated');
      }
      return;
    }

    if (command === 'fontSize') {
      if (applyInlineStyle({ fontSize: value })) {
        scheduleAutosave('Font size updated');
      }
      return;
    }

    if (command === 'foreColor') {
      if (applyInlineStyle({ color: value })) {
        scheduleAutosave('Text color updated');
      }
      return;
    }

    if (command === 'hiliteColor') {
      if (applyInlineStyle({ backgroundColor: value })) {
        scheduleAutosave('Highlight updated');
      }
      return;
    }

    document.execCommand(command, false, value);
    scheduleAutosave('Formatting updated');
  };

  const refreshDraftState = () => {
    const draft = {
      title: titleInput.value.trim(),
      date: dateInput.value,
      mood: moodSelect.value,
      location: locationInput.value.trim(),
      tags: state.tags.slice(),
      content: sanitizeEditorHtml(editor.innerHTML),
      updatedAt: new Date().toISOString()
    };

    state.activeDraft = draft;
    localStorage.setItem(draftKey, JSON.stringify(draft));
    setSaveStatus('Saved locally');
    renderRecentEntries();
  };

  const scheduleAutosave = (message = 'Saving locally...') => {
    if (state.saveTimer) {
      window.clearTimeout(state.saveTimer);
    }

    setSaveStatus(message, 40);
    state.saveTimer = window.setTimeout(() => {
      refreshDraftState();
    }, 650);
  };

  const validatePayload = (payload, allowDraft = false) => {
    const errors = [];
    if (!allowDraft && !payload.title) {
      errors.push('Add a title for the entry.');
    }

    if (!allowDraft && !payload.plainText) {
      errors.push('Write at least a little content before saving.');
    }

    return errors;
  };

  const buildPayload = (isDraft = false) => {
    syncFigureSizes();
    const content = sanitizeEditorHtml(editor.innerHTML);
    const images = collectImageData();
    const existing = editingEntryId ? getEntryById(editingEntryId) : null;
    const id = editingEntryId || entryIdInput.value || String(Date.now());

    return {
      id,
      title: titleInput.value.trim(),
      date: dateInput.value || today,
      mood: moodSelect.value,
      location: locationInput.value.trim(),
      tags: state.tags.slice(),
      content,
      plainText: editor.textContent.trim(),
      images,
      image: images[0]?.src || '',
      isDraft,
      privacy: existing?.privacy || 'private',
      favorite: Boolean(existing?.favorite),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contentType: 'rich-document'
    };
  };

  const savePayload = async (isDraft = false) => {
    const payload = buildPayload(isDraft);
    const errors = validatePayload(payload, isDraft);
    showErrors(errors);

    if (errors.length) {
      setSaveStatus('Fix the highlighted issues first', 20);
      notify(errors[0], true);
      return;
    }

    try {
      if (editingEntryId) {
        const existing = getEntryById(editingEntryId);
        if (existing?.createdAt) {
          payload.createdAt = existing.createdAt;
        }
      }

      saveEntry(payload);
      localStorage.removeItem(draftKey);
      renderRecentEntries();
      showErrors([]);
      setSaveStatus(isDraft ? 'Draft saved' : 'Entry saved', 95);
      notify(isDraft ? 'Draft saved locally.' : 'Entry saved successfully.');

      if (!isDraft) {
        window.setTimeout(() => {
          window.location.href = 'entries.html';
        }, 850);
      }
    } catch (error) {
      console.error(error);
      notify('Could not save the entry.', true);
      setSaveStatus('Save failed', 15);
    }
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(draftKey);
      if (!draft) return false;

      const parsed = JSON.parse(draft);
      if (parsed.title) titleInput.value = parsed.title;
      if (parsed.date) dateInput.value = parsed.date;
      if (parsed.mood) moodSelect.value = parsed.mood;
      if (parsed.location) locationInput.value = parsed.location;
      state.tags = Array.isArray(parsed.tags) ? parsed.tags.map(normalizeTag).filter(Boolean) : [];
      if (parsed.content) setEditorHtml(parsed.content);
      renderTags();
      setSaveStatus('Draft restored', 75);
      return true;
    } catch (error) {
      console.error('Draft restore failed', error);
      return false;
    }
  };

  const loadEntry = (entry) => {
    if (!entry) return;
    entryIdInput.value = entry.id || '';
    titleInput.value = entry.title || '';
    dateInput.value = entry.date || today;
    moodSelect.value = entry.mood || '😊';
    locationInput.value = entry.location || '';
    state.tags = Array.isArray(entry.tags) ? entry.tags.map(normalizeTag).filter(Boolean) : [];
    setEditorHtml(entry.content || '');
    renderTags();
    setSaveStatus('Editing existing memory', 80);
  };

  const applyThemeToggle = () => {
    if (typeof toggleTheme === 'function') {
      toggleTheme();
      return;
    }

    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('memory_journal_theme', next);
  };

  const toggleFocusMode = () => {
    state.focusMode = !state.focusMode;
    document.body.classList.toggle('focus-mode', state.focusMode);

    let exitButton = document.getElementById('focus-exit-btn');
    if (state.focusMode) {
      if (!exitButton) {
        exitButton = document.createElement('button');
        exitButton.type = 'button';
        exitButton.id = 'focus-exit-btn';
        exitButton.className = 'focus-exit-btn';
        exitButton.textContent = 'Exit focus mode';
        exitButton.addEventListener('click', toggleFocusMode);
        document.body.appendChild(exitButton);
      }
      exitButton.hidden = false;
      notify('Focus mode enabled');
    } else if (exitButton) {
      exitButton.hidden = true;
      notify('Focus mode disabled');
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        state.fullscreen = true;
        notify('Fullscreen enabled');
      } else {
        await document.exitFullscreen();
        state.fullscreen = false;
        notify('Fullscreen disabled');
      }
    } catch (error) {
      notify('Fullscreen is unavailable here.', true);
    }
  };

  const exportPdf = async () => {
    if (typeof window.html2pdf !== 'function') {
      notify('PDF export is not available right now.', true);
      return;
    }

    syncFigureSizes();
    const options = {
      margin: 12,
      filename: `${(titleInput.value || 'journal-entry').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'journal-entry'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    };

    await window.html2pdf().set(options).from(form).save();
    notify('PDF export started.');
  };

  const openCropper = (dataUrl, fileName = 'image') => {
    if (!imageCropperModal || !cropperPreview) return;

    state.activeCrop = { dataUrl, fileName };
    cropperPreview.src = dataUrl;
    imageCropperModal.hidden = false;
    document.body.classList.add('modal-open');

    window.requestAnimationFrame(() => {
      if (state.cropper) {
        state.cropper.destroy();
      }

      if (typeof Cropper === 'function') {
        state.cropper = new Cropper(cropperPreview, {
          aspectRatio: NaN,
          viewMode: 1,
          dragMode: 'move',
          autoCropArea: 0.92,
          background: false,
          responsive: true
        });
      }
    });
  };

  const closeCropper = () => {
    if (state.cropper) {
      state.cropper.destroy();
      state.cropper = null;
    }

    if (imageCropperModal) {
      imageCropperModal.hidden = true;
    }

    document.body.classList.remove('modal-open');
    state.activeCrop = null;
  };

  const processImageQueue = async () => {
    if (state.cropQueue.length === 0) return;
    const next = state.cropQueue.shift();
    const reader = new FileReader();

    reader.onload = () => openCropper(String(reader.result || ''), next.name);
    reader.readAsDataURL(next.file);
  };

  const queueImageFiles = (files) => {
    const images = Array.from(files || []).filter((file) => file.type.startsWith('image/'));
    if (!images.length) return;

    state.cropQueue.push(...images.map((file) => ({ file, name: file.name.replace(/\.[^.]+$/, '') || 'Image' })));
    if (!state.activeCrop) {
      processImageQueue();
    }
  };

  const insertCroppedImage = () => {
    if (!state.cropper || !state.activeCrop) return;

    const canvas = state.cropper.getCroppedCanvas({
      imageSmoothingQuality: 'high',
      maxWidth: 1800,
      maxHeight: 1800
    });

    const src = canvas.toDataURL('image/jpeg', 0.93);
    insertImageFigure(src, state.activeCrop.fileName);
    closeCropper();

    if (state.cropQueue.length) {
      processImageQueue();
    }
  };

  const handlePaste = (event) => {
    const clipboard = event.clipboardData || window.clipboardData;
    if (!clipboard) return;

    const imageItem = Array.from(clipboard.items || []).find((item) => item.type && item.type.startsWith('image/'));
    if (!imageItem) return;

    event.preventDefault();
    const file = imageItem.getAsFile();
    if (file) {
      queueImageFiles([file]);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []).filter((file) => file.type.startsWith('image/'));
    if (files.length) {
      queueImageFiles(files);
      return;
    }

    if (state.draggedFigure) {
      const targetFigure = event.target.closest('figure.journal-figure');
      if (targetFigure && targetFigure !== state.draggedFigure) {
        targetFigure.parentNode.insertBefore(state.draggedFigure, targetFigure);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const restoreFromStorage = () => {
    if (editingEntryId) {
      const entry = getEntryById(editingEntryId);
      if (entry) {
        loadEntry(entry);
        return;
      }
    }

    if (!loadDraft()) {
      dateInput.value = dateInput.value || today;
      moodSelect.value = moodSelect.value || '😊';
      setEditorHtml('');
    }
  };

  toolbarButtons().forEach((button) => button.addEventListener('pointerdown', saveSelection));
  [imageButton, clearFormatButton, headingSelect, fontFamilySelect, fontSizeSelect, textColorInput, highlightColorInput]
    .forEach((control) => control?.addEventListener('pointerdown', saveSelection));

  function toolbarButtons() {
    return Array.from(document.querySelectorAll('[data-command]'));
  }

  toolbarButtons().forEach((button) => {
    button.addEventListener('click', () => {
      const command = button.getAttribute('data-command');
      if (!command) return;
      if (command === 'blockquote') {
        applyCommand('blockquote');
        return;
      }
      applyCommand(command);
    });
  });

  headingSelect?.addEventListener('change', () => {
    applyCommand('formatBlock', headingSelect.value === 'p' ? 'p' : headingSelect.value);
    headingSelect.value = 'p';
  });

  fontFamilySelect?.addEventListener('change', () => {
    if (fontFamilySelect.value) {
      applyCommand('fontFamily', fontFamilySelect.value);
    }
  });

  fontSizeSelect?.addEventListener('change', () => {
    if (fontSizeSelect.value) {
      applyCommand('fontSize', fontSizeSelect.value);
    }
  });

  textColorInput?.addEventListener('input', () => {
    applyCommand('foreColor', textColorInput.value);
  });

  highlightColorInput?.addEventListener('input', () => {
    applyCommand('hiliteColor', highlightColorInput.value);
  });

  imageButton?.addEventListener('click', () => imageInput?.click());

  clearFormatButton?.addEventListener('click', () => {
    restoreSelection();
    document.execCommand('removeFormat', false, null);
    scheduleAutosave('Formatting cleared');
  });

  sidebarDarkToggle?.addEventListener('click', applyThemeToggle);
  sidebarFocusToggle?.addEventListener('click', toggleFocusMode);
  sidebarFullscreenToggle?.addEventListener('click', toggleFullscreen);
  sidebarExportPdf?.addEventListener('click', exportPdf);

  saveDraftBtn?.addEventListener('click', () => savePayload(true));
  saveEntryBtn?.addEventListener('click', () => savePayload(false));
  cancelBtn?.addEventListener('click', () => {
    window.location.href = 'entries.html';
  });

  addTagBtn?.addEventListener('click', () => {
    addTag(tagInput.value);
    tagInput.value = '';
    tagInput.focus();
  });

  tagInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(tagInput.value);
      tagInput.value = '';
    }
  });

  quickTagButtons.forEach((button) => {
    button.addEventListener('click', () => addTag(button.dataset.tag || button.textContent || ''));
  });

  imageInput?.addEventListener('change', (event) => {
    queueImageFiles(event.target.files);
    event.target.value = '';
  });

  cropApplyBtn?.addEventListener('click', insertCroppedImage);
  cropRotateLeftBtn?.addEventListener('click', () => state.cropper?.rotate(-90));
  cropRotateRightBtn?.addEventListener('click', () => state.cropper?.rotate(90));
  cropCancelButtons.forEach((button) => button.addEventListener('click', closeCropper));

  editor?.addEventListener('input', () => {
    applyFigureDecorations();
    syncFigureSizes();
    updateMetrics();
    scheduleAutosave('Draft updated');
  });

  editor?.addEventListener('mouseup', saveSelection);
  editor?.addEventListener('keyup', saveSelection);
  editor?.addEventListener('focus', saveSelection);
  editor?.addEventListener('paste', handlePaste);
  editor?.addEventListener('drop', handleDrop);
  editor?.addEventListener('dragover', handleDragOver);
  editor?.addEventListener('blur', () => {
    applyFigureDecorations();
    syncFigureSizes();
  });

  document.addEventListener('selectionchange', () => {
    if (document.activeElement === editor || editor.contains(window.getSelection()?.anchorNode || null)) {
      saveSelection();
    }
  });

  window.addEventListener('resize', () => {
    syncFigureSizes();
  });

  if (dateInput && !dateInput.value) {
    dateInput.value = today;
  }

  renderRecentEntries();
  restoreFromStorage();
  applyFigureDecorations();
  syncFigureSizes();
  renderTags();
  updateMetrics();
  setSaveStatus('Autosave ready', 55);
  showErrors([]);
  localStorage.removeItem(draftKey + '_stale');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    savePayload(false);
  });

  if (entryIdInput && editingEntryId) {
    entryIdInput.value = editingEntryId;
  }

  if (state.fullscreen && document.fullscreenElement) {
    state.fullscreen = true;
  }
};