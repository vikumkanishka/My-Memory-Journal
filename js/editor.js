// --- Scrapbook Editor Logic ---

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('canvas')) return; // Run only on editor page

  const canvas = document.getElementById('canvas');
  const addTextBtn = document.getElementById('add-text-btn');
  const addMediaInput = document.getElementById('add-media-input');
  const addStickerBtn = document.getElementById('add-sticker-btn');
  const bgSelector = document.getElementById('bg-selector');
  const saveBtn = document.getElementById('save-scrapbook-btn');
  const dateInput = document.getElementById('scrapbook-date');
  
  const contextMenu = document.getElementById('context-menu');
  const contextTools = document.getElementById('context-tools');
  const contextTitle = document.getElementById('context-title');

  let elementsData = [];
  let selectedElementId = null;
  
  // Drag / Resize State
  let isDragging = false;
  let isResizing = false;
  let startX, startY, origX, origY, origW, origH;

  const urlParams = new URLSearchParams(window.location.search);
  const entryId = urlParams.get('id');
  let isEditMode = false;

  // Init Date
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  // Edit Mode Loading
  if (entryId) {
    const entry = getEntryById(entryId);
    if (entry && entry.isScrapbook) {
      isEditMode = true;
      document.getElementById('scrapbook-title').value = entry.title;
      document.getElementById('scrapbook-date').value = entry.date;
      document.getElementById('scrapbook-mood').value = entry.mood;
      bgSelector.value = entry.background || 'plain';
      canvas.setAttribute('data-bg', bgSelector.value);
      
      elementsData = entry.elements;
      renderAllElements();
    }
  }

  function genId() { return 'el_' + Date.now() + Math.random().toString(36).substr(2, 5); }

  function createElement(type, content, styles = {}) {
    const id = genId();
    const elData = {
      id,
      type,
      content,
      x: 50 + (Math.random() * 100),
      y: 50 + (canvas.scrollTop || 0) + (Math.random() * 50),
      width: type === 'text' ? 250 : (type === 'sticker' ? 80 : 300),
      height: type === 'text' ? 50 : (type === 'sticker' ? 80 : 300),
      styles: {
        zIndex: elementsData.length + 10,
        fontFamily: "'Poppins', sans-serif",
        fontSize: "18px",
        color: "#4a4a4a",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "left",
        frame: "none",
        ...styles
      }
    };
    elementsData.push(elData);
    renderElement(elData);
    selectElement(id);
  }

  // --- Toolbar Add Handlers ---
  addTextBtn.addEventListener('click', () => createElement('text', 'Double click to edit text'));
  
  addMediaInput.addEventListener('change', (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        createElement(type, ev.target.result);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  });

  const emojiGrid = document.getElementById('emoji-grid');
  const customEmojiInput = document.getElementById('custom-emoji-input');
  const addCustomEmojiBtn = document.getElementById('add-custom-emoji');

  const defaultEmojis = ['💖','✨','🌟','🌷','🌸','🎀','📌','🎈','🎵','🎨','📷','☕'];
  
  if (emojiGrid) {
    defaultEmojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.className = 'tool-btn';
      btn.style.padding = '8px';
      btn.style.justifyContent = 'center';
      btn.style.marginBottom = '0';
      btn.textContent = emoji;
      btn.title = 'Add ' + emoji;
      btn.onclick = () => createElement('sticker', emoji);
      emojiGrid.appendChild(btn);
    });
  }

  if (addCustomEmojiBtn) {
    addCustomEmojiBtn.onclick = () => {
      const val = customEmojiInput.value.trim();
      if(val) {
         createElement('sticker', val);
         customEmojiInput.value = '';
      }
    };
  }

  bgSelector.addEventListener('change', (e) => {
    canvas.setAttribute('data-bg', e.target.value);
  });


  // --- Render & Interaction Core ---
  function renderElement(data) {
    let node = document.getElementById(data.id);
    if (!node) {
      node = document.createElement('div');
      node.id = data.id;
      node.className = `canvas-element el-${data.type}`;
      
      // Handlers
      node.addEventListener('mousedown', (e) => handleMouseDown(e, data.id));
      
      // Text Editing
      if(data.type === 'text') {
        node.addEventListener('dblclick', () => {
          node.setAttribute('contenteditable', 'true');
          node.focus();
        });
        node.addEventListener('blur', () => {
          node.setAttribute('contenteditable', 'false');
          // Update data content and clean handles
          let rawHtml = node.innerHTML;
          rawHtml = rawHtml.replace(/<div class="resize-handle"><\/div>/gi, '');
          data.content = rawHtml;
        });
      }
      
      canvas.appendChild(node);
    }

    // Coordinates mapping
    node.style.left = data.x + 'px';
    node.style.top = data.y + 'px';
    node.style.width = data.width + 'px';
    if (data.type !== 'text') {
      node.style.height = data.height + 'px';
    } else {
      node.style.height = 'auto'; // Revert auto for texts so content fits
    }
    node.style.zIndex = data.styles.zIndex;

    // Remove existing handle to prevent duplicates later
    const existingHandle = node.querySelector('.resize-handle');
    if (existingHandle) existingHandle.remove();

    // Reapply specific content logic
    if (data.type === 'text') {
      node.style.fontFamily = data.styles.fontFamily;
      node.style.fontSize = data.styles.fontSize;
      node.style.color = data.styles.color;
      node.style.fontWeight = data.styles.fontWeight;
      node.style.fontStyle = data.styles.fontStyle;
      node.style.textAlign = data.styles.textAlign;
      node.innerHTML = data.content; 
    } 
    else if (data.type === 'image') {
      let img = node.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        node.appendChild(img);
      }
      img.src = data.content;
      node.className = `canvas-element el-image frame-${data.styles.frame}`;
    }
    else if (data.type === 'video') {
      let vid = node.querySelector('video');
      if(!vid) {
        vid = document.createElement('video');
        vid.controls = true;
        vid.style.width = '100%';
        vid.style.height = '100%';
        node.appendChild(vid);
      }
      if (vid.src !== data.content) vid.src = data.content;
    }
    else if (data.type === 'sticker') {
      node.innerHTML = data.content;
      node.style.fontSize = data.width + 'px';
    }

    // Append standard resize handle
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.addEventListener('mousedown', (e) => handleResizeDown(e, data.id));
    node.appendChild(handle);

    // Maintain selection styling
    if (selectedElementId === data.id) {
      node.classList.add('selected');
    }
  }

  function renderAllElements() {
    canvas.innerHTML = '';
    elementsData.forEach(data => renderElement(data));
  }

  // --- Mouse Actions ---
  function selectElement(id) {
    if (selectedElementId && id !== selectedElementId) {
       // Defocus previous
       const prevNode = document.getElementById(selectedElementId);
       if(prevNode && prevNode.getAttribute('contenteditable') === 'true') {
          prevNode.setAttribute('contenteditable', 'false');
          prevNode.blur();
       }
    }

    selectedElementId = id;
    document.querySelectorAll('.canvas-element').forEach(el => el.classList.remove('selected'));
    
    if (id) {
      document.getElementById(id).classList.add('selected');
      updateContextMenu(id);
    } else {
      contextMenu.classList.remove('active');
    }
  }

  canvas.addEventListener('mousedown', (e) => {
    if (e.target === canvas) {
      selectElement(null);
    }
  });

  function handleMouseDown(e, id) {
    if (e.target.classList.contains('resize-handle')) return;
    if (e.target.tagName === 'VIDEO') return; 
    
    // Check if clicking inside an active contenteditable text
    const node = document.getElementById(id);
    if (node.getAttribute('contenteditable') === 'true') {
      return; 
    }
    
    selectElement(id);
    const data = elementsData.find(el => el.id === id);
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origX = data.x;
    origY = data.y;
    e.stopPropagation();
  }

  function handleResizeDown(e, id) {
    e.stopPropagation();
    selectElement(id);
    const data = elementsData.find(el => el.id === id);
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    origW = data.width;
    origH = data.height;
  }

  document.addEventListener('mousemove', (e) => {
    if (isDragging && selectedElementId) {
      const data = elementsData.find(el => el.id === selectedElementId);
      data.x = origX + (e.clientX - startX);
      data.y = origY + (e.clientY - startY);
      renderElement(data);
    }
    else if (isResizing && selectedElementId) {
      const data = elementsData.find(el => el.id === selectedElementId);
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      data.width = Math.max(30, origW + dx);
      if (data.type !== 'text') {
        data.height = Math.max(30, origH + dy);
      }
      renderElement(data);
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
  });

  // Global Delete Hotkey
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
      const node = document.getElementById(selectedElementId);
      if (node && node.getAttribute('contenteditable') !== 'true') {
        elementsData = elementsData.filter(d => d.id !== selectedElementId);
        node.remove();
        selectElement(null);
      }
    }
  });

  // --- Context Menu Settings ---
  function updateContextMenu(id) {
    const data = elementsData.find(el => el.id === id);
    if (!data) return;
    
    contextTitle.textContent = data.type.toUpperCase();
    contextMenu.classList.add('active');
    contextTools.innerHTML = '';
    
    if (data.type === 'text') {
      const fontSel = document.createElement('select');
      fontSel.className = 'context-select';
      fontSel.innerHTML = `
        <option value="'Poppins', sans-serif">Poppins</option>
        <option value="'Playfair Display', serif">Playfair</option>
        <option value="'Dancing Script', cursive">Dancing Script</option>
        <option value="'Indie Flower', cursive">Indie Flower</option>
      `;
      fontSel.value = data.styles.fontFamily;
      fontSel.onchange = (e) => { data.styles.fontFamily = e.target.value; renderElement(data); };

      const colorInp = document.createElement('input');
      colorInp.type = 'color';
      colorInp.className = 'context-btn';
      colorInp.title = 'Text Color';
      colorInp.value = data.styles.color || '#4a4a4a';
      colorInp.onchange = (e) => { data.styles.color = e.target.value; renderElement(data); };
      
      const sizeInp = document.createElement('input');
      sizeInp.type = 'number';
      sizeInp.className = 'context-select';
      sizeInp.style.width = '60px';
      sizeInp.title = 'Font Size';
      sizeInp.value = parseInt(data.styles.fontSize) || 16;
      sizeInp.onchange = (e) => { data.styles.fontSize = e.target.value + 'px'; renderElement(data); };

      const alignBtn = document.createElement('button');
      alignBtn.className = 'context-btn';
      alignBtn.innerHTML = '<i class="fas fa-align-left"></i>';
      alignBtn.onclick = () => {
        const aligns = ['left', 'center', 'right'];
        let idx = aligns.indexOf(data.styles.textAlign || 'left');
        idx = (idx + 1) % aligns.length;
        data.styles.textAlign = aligns[idx];
        alignBtn.innerHTML = `<i class="fas fa-align-${data.styles.textAlign}"></i>`;
        renderElement(data);
      };
      // init align icon
      if(data.styles.textAlign) alignBtn.innerHTML = `<i class="fas fa-align-${data.styles.textAlign}"></i>`;

      contextTools.append(fontSel, sizeInp, colorInp, alignBtn);
    }
    
    if (data.type === 'image') {
      const frameSel = document.createElement('select');
      frameSel.className = 'context-select';
      frameSel.title = 'Image Frame';
      frameSel.innerHTML = `
        <option value="none">No Frame</option>
        <option value="polaroid">Polaroid</option>
        <option value="vintage">Vintage Border</option>
        <option value="shadow">Soft Shadow</option>
      `;
      frameSel.value = data.styles.frame || 'none';
      frameSel.onchange = (e) => { data.styles.frame = e.target.value; renderElement(data); };
      contextTools.appendChild(frameSel);
    }

    // Common z-index and delete tools
    const layerUp = document.createElement('button');
    layerUp.className = 'context-btn';
    layerUp.title = 'Bring Forward';
    layerUp.innerHTML = '<i class="fas fa-arrow-up"></i>';
    layerUp.onclick = () => { data.styles.zIndex += 1; renderElement(data); };
    
    const layerDown = document.createElement('button');
    layerDown.className = 'context-btn';
    layerDown.title = 'Send Backward';
    layerDown.innerHTML = '<i class="fas fa-arrow-down"></i>';
    layerDown.onclick = () => { data.styles.zIndex -= 1; renderElement(data); };

    const delBtn = document.createElement('button');
    delBtn.className = 'context-btn danger';
    delBtn.title = 'Delete Element';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.onclick = () => {
      elementsData = elementsData.filter(d => d.id !== id);
      document.getElementById(id).remove();
      selectElement(null);
    };

    contextTools.append(layerUp, layerDown, delBtn);
  }

  // --- Saving the Scrapbook ---
  saveBtn.addEventListener('click', () => {
    // Unfocus anything editable
    document.querySelectorAll('.el-text').forEach(node => {
      if(node.getAttribute('contenteditable') === 'true') {
        node.setAttribute('contenteditable', 'false');
        node.blur();
        const data = elementsData.find(el => el.id === node.id);
        if(data) {
           data.content = node.innerHTML.replace(/<div class="resize-handle"><\/div>/gi, '');
        }
      }
    });

    const title = document.getElementById('scrapbook-title').value.trim();
    const date = document.getElementById('scrapbook-date').value;
    const mood = document.getElementById('scrapbook-mood').value;

    if (!title) {
      showToast('Need a title for your scrapbook!', true);
      return;
    }

    const entry = {
      id: isEditMode ? entryId : Date.now().toString(),
      isScrapbook: true,
      title,
      date,
      mood,
      background: bgSelector.value,
      elements: elementsData,
      content: "A beautiful scrapbook memory." // Default preview text
    };
    
    // Attempt to extract text for the list preview
    const textEls = elementsData.filter(e => e.type === 'text');
    if (textEls.length > 0) {
      entry.content = textEls[0].content.replace(/<[^>]+>/g, '').substring(0, 150);
    }
    
    // Attempt to extract an image for the thumbnail
    const imgEls = elementsData.filter(e => e.type === 'image');
    if (imgEls.length > 0) {
      entry.image = imgEls[0].content;
    }

    saveEntry(entry);
    showToast('Scrapbook Saved Successfully!');
    setTimeout(() => {
      window.location.href = 'entries.html';
    }, 1500);
  });
});
