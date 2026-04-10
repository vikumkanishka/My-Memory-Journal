window.initJournalComposerPage = () => {
  const form = document.getElementById('journal-entry-form');
  if (!form) return;

  const entryIdInput = document.getElementById('journal-entry-id');
  const titleInput = document.getElementById('journal-title');
  const dateInput = document.getElementById('journal-date');
  const editor = document.getElementById('journal-editor');
  const moodButtons = Array.from(document.querySelectorAll('.mood-chip'));
  const imageInput = document.getElementById('journal-images');
  const imageGallery = document.getElementById('image-gallery');
  const tagInput = document.getElementById('tag-input');
  const addTagBtn = document.getElementById('add-tag-btn');
  const tagList = document.getElementById('tag-list');
  const quickTagButtons = Array.from(document.querySelectorAll('.quick-tag'));
  const privacyToggle = document.getElementById('privacy-toggle');
  const privacyLabel = document.getElementById('privacy-label');
  const favoriteToggle = document.getElementById('favorite-toggle');
  const locationInput = document.getElementById('entry-location');
  const statusText = document.getElementById('save-status');
  const draftStatus = document.getElementById('draft-status');
  const statusMeter = document.getElementById('status-meter-fill');
  const errorsBox = document.getElementById('form-errors');
  const cancelBtn = document.getElementById('cancel-entry');
  const saveDraftBtn = document.getElementById('save-draft-btn');
  const saveEntryBtn = document.getElementById('save-entry-btn');
  const toolbarButtons = Array.from(document.querySelectorAll('.tool-action'));

  const draftKeyBase = 'memory_journal_entry_draft';
  const today = new Date().toISOString().split('T')[0];
  const urlParams = new URLSearchParams(window.location.search);
  const editingEntryId = urlParams.get('id') || '';

  let activeMood = '😊';
  let activePrivacy = 'private';
  let activeFavorite = false;
  let tags = [];
  let images = [];
  let draftTimer = null;

  const draftKey = editingEntryId ? `${draftKeyBase}_${editingEntryId}` : `${draftKeyBase}_new`;

  const backendPlaceholder = async (payload) => Promise.resolve(payload);

  const setStatus = (message, strength = 35) => {
    if (statusText) statusText.textContent = message;
    if (draftStatus) draftStatus.textContent = message;
    if (statusMeter) statusMeter.style.width = `${Math.max(12, Math.min(100, strength))}%`;
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

  const addTag = (rawTag) => {
    const tag = normalizeTag(rawTag);
    if (!tag) return;

    const exists = tags.some((currentTag) => currentTag.toLowerCase() === tag.toLowerCase());
    if (exists) return;

    tags.push(tag);
    renderTags();
    scheduleDraftSave('Draft updated');
  };

  const removeTag = (tagToRemove) => {
    tags = tags.filter((tag) => tag.toLowerCase() !== tagToRemove.toLowerCase());
    renderTags();
    scheduleDraftSave('Draft updated');
  };

  const renderTags = () => {
    if (!tagList) return;

    tagList.innerHTML = tags.length
      ? tags.map((tag) => `
        <span class="tag-chip">
          <span>#${escapeHtml(tag)}</span>
          <button type="button" aria-label="Remove ${escapeHtml(tag)} tag" data-tag-remove="${escapeHtml(tag)}"><i class="fas fa-times"></i></button>
        </span>
      `).join('')
      : '<span class="tag-chip muted">No tags yet</span>';

    tagList.querySelectorAll('[data-tag-remove]').forEach((button) => {
      button.addEventListener('click', () => removeTag(button.getAttribute('data-tag-remove') || ''));
    });
  };

  const renderImages = () => {
    if (!imageGallery) return;

    imageGallery.innerHTML = images.length
      ? images.map((image, index) => `
        <figure class="image-card">
          <img src="${escapeHtml(image.src)}" alt="Attached photo ${index + 1}">
          <button type="button" data-image-remove="${index}" aria-label="Remove photo ${index + 1}"><i class="fas fa-times"></i></button>
          <span>${escapeHtml(image.name || `Photo ${index + 1}`)}</span>
        </figure>
      `).join('')
      : '';

    imageGallery.querySelectorAll('[data-image-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.getAttribute('data-image-remove'));
        images.splice(index, 1);
        renderImages();
        scheduleDraftSave('Draft updated');
      });
    });
  };

  const setMood = (mood) => {
    activeMood = mood;
    moodButtons.forEach((button) => {
      const isActive = button.dataset.mood === mood;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    scheduleDraftSave('Mood saved locally');
  };

  const setPrivacy = (isPublic) => {
    activePrivacy = isPublic ? 'public' : 'private';
    if (privacyToggle) {
      privacyToggle.classList.toggle('is-public', isPublic);
      privacyToggle.setAttribute('aria-pressed', String(isPublic));
    }
    if (privacyLabel) {
      privacyLabel.textContent = isPublic ? 'Public' : 'Private';
    }
    scheduleDraftSave('Privacy saved locally');
  };

  const setFavorite = (nextState) => {
    activeFavorite = Boolean(nextState);
    if (favoriteToggle) {
      favoriteToggle.classList.toggle('is-active', activeFavorite);
      favoriteToggle.setAttribute('aria-pressed', String(activeFavorite));
      const icon = favoriteToggle.querySelector('i');
      if (icon) {
        icon.className = activeFavorite ? 'fas fa-star' : 'far fa-star';
      }
    }
    scheduleDraftSave('Highlight saved locally');
  };

  const readEditorHtml = () => sanitizeJournalHtml(editor ? editor.innerHTML : '');

  const setEditorHtml = (html) => {
    if (!editor) return;
    const normalizedHtml = String(html || '').trim();
    editor.innerHTML = normalizedHtml || '';
    if (!normalizedHtml) {
      editor.innerHTML = '';
    }
  };

  const serializeDraft = () => ({
    title: titleInput ? titleInput.value.trim() : '',
    date: dateInput ? dateInput.value : today,
    mood: activeMood,
    content: readEditorHtml(),
    tags,
    privacy: activePrivacy,
    favorite: activeFavorite,
    location: locationInput ? locationInput.value.trim() : '',
    images,
    entryId: editingEntryId || null,
    updatedAt: new Date().toISOString()
  });

  const persistDraft = () => {
    const draft = serializeDraft();
    localStorage.setItem(draftKey, JSON.stringify(draft));
    setStatus('Saved just now', 85);
  };

  const scheduleDraftSave = (message = 'Saved just now') => {
    if (draftTimer) clearTimeout(draftTimer);
    setStatus(message, 42);
    draftTimer = setTimeout(() => {
      persistDraft();
    }, 700);
  };

  const loadEntry = (entry) => {
    if (!entry) return;

    if (entry.title && titleInput) titleInput.value = entry.title;
    if (entry.date && dateInput) dateInput.value = entry.date;
    if (entry.mood) setMood(entry.mood);
    if (entry.location && locationInput) locationInput.value = entry.location;
    if (entry.content) {
      setEditorHtml(entry.content);
    }
    tags = Array.isArray(entry.tags) ? entry.tags.map(normalizeTag).filter(Boolean) : [];
    images = Array.isArray(entry.images) && entry.images.length ? entry.images.map((image) => ({
      src: image.src || image,
      name: image.name || 'Photo'
    })) : (entry.image ? [{ src: entry.image, name: 'Photo 1' }] : []);
    setPrivacy(entry.privacy === 'public');
    setFavorite(Boolean(entry.favorite));
    renderTags();
    renderImages();
  };

  const loadDraft = () => {
    const draft = localStorage.getItem(draftKey);
    if (!draft) return;

    try {
      const parsed = JSON.parse(draft);
      if (parsed.title && titleInput) titleInput.value = parsed.title;
      if (parsed.date && dateInput) dateInput.value = parsed.date;
      if (parsed.mood) setMood(parsed.mood);
      if (parsed.content) setEditorHtml(parsed.content);
      if (parsed.location && locationInput) locationInput.value = parsed.location;
      tags = Array.isArray(parsed.tags) ? parsed.tags.map(normalizeTag).filter(Boolean) : tags;
      images = Array.isArray(parsed.images) ? parsed.images.map((image) => ({
        src: image.src || image,
        name: image.name || 'Photo'
      })) : images;
      setPrivacy(parsed.privacy === 'public');
      setFavorite(Boolean(parsed.favorite));
      renderTags();
      renderImages();
      setStatus('Draft restored', 68);
    } catch (error) {
      console.error('Draft restore failed:', error);
    }
  };

  const validatePayload = (payload, allowDraft = false) => {
    const errors = [];
    if (!payload.title) errors.push('Add a title for your memory.');
    if (!allowDraft && !payload.content.replace(/<[^>]+>/g, '').trim()) {
      errors.push('Write a little something in the journal body.');
    }
    if (payload.images.length > 6) errors.push('You can attach up to 6 photos only.');
    return errors;
  };

  const buildPayload = (isDraft = false) => ({
    id: editingEntryId || Date.now().toString(),
    title: titleInput ? titleInput.value.trim() : '',
    date: dateInput ? dateInput.value : today,
    mood: activeMood,
    content: readEditorHtml(),
    plainText: editor ? editor.innerText.trim() : '',
    tags: tags.slice(),
    privacy: activePrivacy,
    favorite: activeFavorite,
    location: locationInput ? locationInput.value.trim() : '',
    images: images.map((image) => ({ ...image })),
    image: images[0]?.src || '',
    isDraft,
    createdAt: editingEntryId ? undefined : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contentType: 'rich-text'
  });

  const savePayload = async (isDraft = false) => {
    const payload = buildPayload(isDraft);
    const errors = validatePayload(payload, isDraft);

    showErrors(errors);
    if (errors.length) {
      setStatus('Fix the highlighted issues first', 24);
      return;
    }

    try {
      const existing = editingEntryId ? getEntryById(editingEntryId) : null;
      if (existing?.createdAt) payload.createdAt = existing.createdAt;

      saveEntry(payload);
      await backendPlaceholder(payload);
      localStorage.removeItem(draftKey);
      showErrors([]);
      showToast(isDraft ? 'Draft saved.' : 'Entry saved successfully!');
      setStatus(isDraft ? 'Draft saved' : 'Saved just now', 100);

      if (!isDraft) {
        setTimeout(() => {
          window.location.href = 'entries.html';
        }, 900);
      }
    } catch (error) {
      console.error('Save entry error:', error);
      showToast('Could not save the entry right now.', true);
      setStatus('Save failed', 20);
    }
  };

  const attachImageFiles = async (files) => {
    const filesArray = Array.from(files || []);
    if (!filesArray.length) return;

    if (images.length + filesArray.length > 6) {
      showToast('You can attach up to 6 photos.', true);
      return;
    }

    for (const file of filesArray) {
      if (!file.type.startsWith('image/')) continue;
      const compressed = await compressImage(file);
      images.push({
        src: compressed,
        name: file.name.replace(/\.[^.]+$/, '') || 'Photo'
      });
    }

    renderImages();
    scheduleDraftSave('Photos saved locally');
  };

  const compressImage = (file, maxWidth = 1600, quality = 0.82) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }

          const outputReader = new FileReader();
          outputReader.onerror = reject;
          outputReader.onload = () => resolve(String(outputReader.result));
          outputReader.readAsDataURL(blob);
        }, 'image/jpeg', quality);
      };
      img.src = String(event.target.result);
    };
    reader.readAsDataURL(file);
  });

  toolbarButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const command = button.dataset.command;
      if (!command || !editor) return;

      editor.focus();
      if (command === 'formatBlockQuote') {
        document.execCommand('formatBlock', false, 'blockquote');
      } else {
        document.execCommand(command, false, null);
      }
      scheduleDraftSave('Formatting saved locally');
    });
  });

  moodButtons.forEach((button) => {
    button.addEventListener('click', () => setMood(button.dataset.mood || '😊'));
  });

  if (privacyToggle) {
    privacyToggle.addEventListener('click', () => setPrivacy(activePrivacy === 'private'));
  }

  if (favoriteToggle) {
    favoriteToggle.addEventListener('click', () => setFavorite(!activeFavorite));
  }

  if (tagInput) {
    tagInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        addTag(tagInput.value);
        tagInput.value = '';
      }
    });
  }

  if (addTagBtn) {
    addTagBtn.addEventListener('click', () => {
      addTag(tagInput.value);
      tagInput.value = '';
      tagInput.focus();
    });
  }

  quickTagButtons.forEach((button) => {
    button.addEventListener('click', () => addTag(button.dataset.tag || button.textContent));
  });

  if (imageInput) {
    imageInput.addEventListener('change', async (event) => {
      await attachImageFiles(event.target.files);
      event.target.value = '';
    });
  }

  if (editor) {
    editor.addEventListener('input', () => scheduleDraftSave('Draft updated'));
    editor.addEventListener('blur', () => scheduleDraftSave('Draft updated'));
    editor.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveEntryBtn?.click();
      }
    });
  }

  [titleInput, dateInput, locationInput].forEach((field) => {
    if (!field) return;
    field.addEventListener('input', () => scheduleDraftSave('Draft updated'));
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      window.location.href = 'entries.html';
    });
  }

  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', () => savePayload(true));
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    savePayload(false);
  });

  if (editingEntryId) {
    const existing = getEntryById(editingEntryId);
    if (existing) {
      loadEntry(existing);
      setStatus('Editing an existing memory', 72);
      if (entryIdInput) entryIdInput.value = editingEntryId;
    }
  } else {
    if (dateInput && !dateInput.value) dateInput.value = today;
    setPrivacy(false);
    renderTags();
    renderImages();
    loadDraft();
  }

  if (editor && !editor.innerHTML.trim()) {
    editor.innerHTML = '';
  }

  if (editingEntryId) {
    setStatus('Editing an existing memory', 72);
  } else if (localStorage.getItem(draftKey)) {
    setStatus('Draft restored', 68);
  } else {
    setStatus('Saved just now', 45);
  }
  showErrors([]);
};