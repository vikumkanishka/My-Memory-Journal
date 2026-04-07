document.addEventListener('DOMContentLoaded', () => {
  const PX_PER_MM = 96 / 25.4;
  const DEFAULT_PAGE = {
    widthMm: 210,
    heightMm: 297,
    orientation: 'portrait'
  };

  const openBtn = document.getElementById('open-export-pdf-btn');
  if (!openBtn) return;

  const modal = document.getElementById('export-pdf-modal');
  const cancelBtn = document.getElementById('cancel-pdf-export');
  const generateBtn = document.getElementById('generate-pdf-btn');
  const loadingIndicator = document.getElementById('pdf-loading');

  const startDateInput = document.getElementById('pdf-start-date');
  const endDateInput = document.getElementById('pdf-end-date');
  const moodFilterInput = document.getElementById('pdf-filter-mood');
  const pdfContainer = document.getElementById('pdf-export-container');

  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  generateBtn.addEventListener('click', async () => {
    const start = startDateInput.value;
    const end = endDateInput.value;
    const selectedMood = moodFilterInput ? moodFilterInput.value : 'all';
    const hasDateRange = Boolean(start && end);
    const hasPartialDateRange = Boolean((start && !end) || (!start && end));
    const hasMoodFilter = selectedMood !== 'all';

    if (hasPartialDateRange) {
      showToast('Please select both start and end dates for date-range filtering.', true);
      return;
    }

    if (hasDateRange && start > end) {
      showToast('Start date must be before end date.', true);
      return;
    }

    if (!hasDateRange && !hasMoodFilter) {
      showToast('Choose a date range, a mood, or both before exporting.', true);
      return;
    }

    const allEntries = getEntries();
    const filtered = allEntries
      .filter((entry) => {
        const inRange = hasDateRange ? entry.date >= start && entry.date <= end : true;
        const moodMatch = hasMoodFilter ? entry.mood === selectedMood : true;
        return inRange && moodMatch;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filtered.length === 0) {
      showToast('No memories found for the selected filter(s) 💭', true);
      modal.classList.remove('active');
      return;
    }

    const filterTitle = getFilterTitle(start, end, selectedMood, hasDateRange, hasMoodFilter);
    const fileSuffix = getFileSuffix(start, end, selectedMood, hasDateRange, hasMoodFilter);
    const pageConfig = getPageConfig(pdfContainer);

    generateBtn.disabled = true;
    cancelBtn.disabled = true;
    loadingIndicator.classList.add('active');

    try {
      applyPdfPageDimensions(pdfContainer, pageConfig);
      buildPdfHtml(filtered, filterTitle, pageConfig, pdfContainer);
      await waitForPdfAssets(pdfContainer);
      fitOverflowToSinglePage(pdfContainer);

      const opt = {
        margin: 0,
        filename: `journal_${fileSuffix}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#fdfbf7',
          windowWidth: pageConfig.widthPx,
          windowHeight: pageConfig.heightPx,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: {
          unit: 'mm',
          format: [pageConfig.widthMm, pageConfig.heightMm],
          orientation: pageConfig.orientation
        },
        pagebreak: {
          mode: ['css'],
          before: '.pdf-page-break',
          avoid: ['.pdf-page', '.journal-entry']
        }
      };

      await html2pdf().set(opt).from(pdfContainer).save();

      showToast('PDF Generated successfully!');
      modal.classList.remove('active');
    } catch (e) {
      console.error('PDF Generation Error:', e);
      showToast('Error generating PDF.', true);
    } finally {
      generateBtn.disabled = false;
      cancelBtn.disabled = false;
      loadingIndicator.classList.remove('active');
      pdfContainer.innerHTML = '';
    }
  });

  function buildPdfHtml(entries, subtitleText, pageConfig, container) {
    let html = '';

    html += `
      <section class="pdf-page pdf-cover-page">
        <div class="pdf-page-content">
          <h1 class="pdf-cover-title">My Memory Journal</h1>
          <div class="pdf-cover-subtitle">${escapeHtml(subtitleText)}</div>
        </div>
      </section>
      <div class="pdf-page-break"></div>
    `;

    const contentWidthPx = Math.max(200, Math.round(pageConfig.widthPx - pageConfig.paddingPx * 2));
    const scrapbookHeight = Math.max(400, Math.round(pageConfig.heightPx - pageConfig.paddingPx * 2 - 160));

    entries.forEach((entry, index) => {
      html += `
        <section class="pdf-page pdf-entry-page journal-entry">
          <div class="pdf-page-content">
            <div class="pdf-scale-target">
              <div class="pdf-entry-header">
                <h2 class="pdf-entry-title">${escapeHtml(entry.title || 'Untitled')}</h2>
                <div class="pdf-entry-meta">
                  <span>${formatDate(entry.date)}</span>
                  <span>${escapeHtml(entry.mood || '')}</span>
                </div>
              </div>
      `;

      if (entry.isScrapbook) {
        html += `<div class="pdf-scrapbook-canvas" data-bg="${escapeHtml(entry.background || 'plain')}" style="height:${scrapbookHeight}px;">`;

        (entry.elements || []).forEach((el) => {
          const styles = el.styles || {};
          const zIndex = Number.isFinite(Number(styles.zIndex)) ? Number(styles.zIndex) : 1;
          const left = Number.isFinite(Number(el.x)) ? Number(el.x) : 0;
          const top = Number.isFinite(Number(el.y)) ? Number(el.y) : 0;
          const width = Number.isFinite(Number(el.width)) ? Number(el.width) : 120;
          const height = Number.isFinite(Number(el.height)) ? Number(el.height) : 120;

          html += `<div class="pdf-canvas-element el-${escapeHtml(el.type || 'unknown')}" style="left:${left}px;top:${top}px;width:${width}px;${el.type !== 'text' ? `height:${height}px;` : ''}z-index:${zIndex};">`;

          if (el.type === 'text') {
            html += `<div style="font-family:${escapeHtml(styles.fontFamily || 'inherit')};color:${escapeHtml(styles.color || '#333')};font-size:${normalizeCssUnit(styles.fontSize, '16px')};font-weight:${escapeHtml(styles.fontWeight || '400')};font-style:${escapeHtml(styles.fontStyle || 'normal')};text-align:${escapeHtml(styles.textAlign || 'left')};">${escapeHtml(el.content || '')}</div>`;
          } else if (el.type === 'image') {
            html += `<img src="${escapeHtml(el.content || '')}" class="frame-${escapeHtml(styles.frame || 'none')}" style="width:100%;height:100%;object-fit:cover;">`;
          } else if (el.type === 'video') {
            html += `<div class="pdf-placeholder-video" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;"><i class="fas fa-video"></i> Video</div>`;
          } else if (el.type === 'sticker') {
            html += `<div style="font-size:${Math.max(16, width)}px;line-height:1;">${escapeHtml(el.content || '')}</div>`;
          }

          html += '</div>';
        });

        html += '</div>';
      } else {
        html += `<div class="pdf-entry-content">${formatEntryContent(entry.content)}</div>`;
        if (entry.image) {
          html += `<img src="${escapeHtml(entry.image)}" class="pdf-entry-image">`;
        }
      }

      html += `
            </div>
          </div>
        </section>
      `;

      if (index < entries.length - 1) {
        html += '<div class="pdf-page-break"></div>';
      }
    });

    container.innerHTML = html;
    container.style.width = `${pageConfig.widthPx}px`;
    container.style.maxWidth = `${pageConfig.widthPx}px`;
    container.style.minWidth = `${pageConfig.widthPx}px`;
    container.style.setProperty('--pdf-content-width-px', `${contentWidthPx}px`);
  }

  function applyPdfPageDimensions(container, pageConfig) {
    container.style.setProperty('--pdf-page-width-px', `${pageConfig.widthPx}px`);
    container.style.setProperty('--pdf-page-height-px', `${pageConfig.heightPx}px`);
    container.style.setProperty('--pdf-page-padding-px', `${pageConfig.paddingPx}px`);
  }

  function getPageConfig(container) {
    const config = { ...DEFAULT_PAGE };
    const dataset = container ? container.dataset : {};
    const widthMm = Number(dataset.pdfWidthMm);
    const heightMm = Number(dataset.pdfHeightMm);

    if (Number.isFinite(widthMm) && Number.isFinite(heightMm) && widthMm > 0 && heightMm > 0) {
      config.widthMm = widthMm;
      config.heightMm = heightMm;
      config.orientation = widthMm > heightMm ? 'landscape' : 'portrait';
    }

    const paddingPx = Number(dataset.pdfPaddingPx);
    config.paddingPx = Number.isFinite(paddingPx) && paddingPx >= 0 ? paddingPx : 40;
    config.widthPx = Math.round(config.widthMm * PX_PER_MM);
    config.heightPx = Math.round(config.heightMm * PX_PER_MM);

    return config;
  }

  async function waitForPdfAssets(container) {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const images = Array.from(container.querySelectorAll('img'));
    if (images.length === 0) {
      return;
    }

    await Promise.all(
      images.map((img) => {
        if (img.complete) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
  }

  function fitOverflowToSinglePage(container) {
    const entryPages = container.querySelectorAll('.pdf-entry-page');
    entryPages.forEach((page) => {
      const viewport = page.querySelector('.pdf-page-content');
      const scaleTarget = page.querySelector('.pdf-scale-target');
      if (!viewport || !scaleTarget) {
        return;
      }

      scaleTarget.style.transform = 'none';
      scaleTarget.style.width = '100%';

      const widthScale = viewport.clientWidth / Math.max(scaleTarget.scrollWidth, 1);
      const heightScale = viewport.clientHeight / Math.max(scaleTarget.scrollHeight, 1);
      const scale = Math.min(1, widthScale, heightScale);

      if (scale < 1) {
        scaleTarget.style.transform = `scale(${scale})`;
        scaleTarget.style.transformOrigin = 'top left';
        scaleTarget.style.width = `${100 / scale}%`;
      }
    });
  }

  function getFilterTitle(start, end, mood, hasDateRange, hasMoodFilter) {
    const parts = [];

    if (hasDateRange) {
      parts.push(`${formatDate(start)} to ${formatDate(end)}`);
    }

    if (hasMoodFilter) {
      parts.push(`Mood: ${mood}`);
    }

    return parts.join(' | ');
  }

  function getFileSuffix(start, end, mood, hasDateRange, hasMoodFilter) {
    const parts = [];

    if (hasDateRange) {
      parts.push(`${start}_to_${end}`);
    }

    if (hasMoodFilter) {
      parts.push(`mood_${encodeURIComponent(mood)}`);
    }

    return parts.join('_') || 'filtered';
  }

  function formatDate(ds) {
    try {
      const d = new Date(ds);
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return ds;
    }
  }

  function normalizeCssUnit(value, fallback) {
    if (value === undefined || value === null) {
      return fallback;
    }

    const str = String(value).trim();
    if (!str) {
      return fallback;
    }

    return /[a-z%]+$/i.test(str) ? str : `${str}px`;
  }

  function formatEntryContent(content) {
    return escapeHtml(content || '').replace(/\n/g, '<br>');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
