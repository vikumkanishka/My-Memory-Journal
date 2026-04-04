document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('open-export-pdf-btn');
  if (!openBtn) return;

  const modal = document.getElementById('export-pdf-modal');
  const cancelBtn = document.getElementById('cancel-pdf-export');
  const generateBtn = document.getElementById('generate-pdf-btn');
  const loadingIndicator = document.getElementById('pdf-loading');
  
  const startDateInput = document.getElementById('pdf-start-date');
  const endDateInput = document.getElementById('pdf-end-date');
  const pdfContainer = document.getElementById('pdf-export-container');

  // Set default dates
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
  endDateInput.value = today.toISOString().split('T')[0];

  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  generateBtn.addEventListener('click', async () => {
    const start = startDateInput.value;
    const end = endDateInput.value;
    
    if (!start || !end) {
      showToast('Please select both start and end dates.', true);
      return;
    }

    if (start > end) {
      showToast('Start date must be before end date.', true);
      return;
    }

    const allEntries = getEntries();
    // Sort ascending for chronological reading in PDF
    let filtered = allEntries.filter(e => e.date >= start && e.date <= end);
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filtered.length === 0) {
      showToast('No memories found for this time period 💭', true);
      modal.classList.remove('active');
      return;
    }

    // Disable UI & Show loading
    generateBtn.disabled = true;
    cancelBtn.disabled = true;
    loadingIndicator.classList.add('active');

    try {
      buildPdfHtml(filtered, start, end);
      
      const opt = {
        margin:       10,
        filename:     `journal_${start}_to_${end}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // html2pdf is an async library that uses promises
      await html2pdf().set(opt).from(pdfContainer).toPdf().get('pdf').then(function (pdf) {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(10);
          pdf.setTextColor(150);
          pdf.text('Page ' + i + ' of ' + totalPages, pdf.internal.pageSize.getWidth() - 1.2, pdf.internal.pageSize.getHeight() - 0.5);
          pdf.text('My Memory Journal', 0.5, pdf.internal.pageSize.getHeight() - 0.5);
        }
      }).save();
      
      showToast('PDF Generated successfully!');
      modal.classList.remove('active');
    } catch (e) {
      console.error('PDF Generation Error:', e);
      showToast('Error generating PDF.', true);
    } finally {
      // Re-enable UI
      generateBtn.disabled = false;
      cancelBtn.disabled = false;
      loadingIndicator.classList.remove('active');
      pdfContainer.innerHTML = ''; // Clean up heavy DOM memory
    }
  });

  function buildPdfHtml(entries, start, end) {
    let html = '';
    
    // Formatting date safely
    const formatDate = (ds) => {
        try { 
            const d = new Date(ds);
            // Adjust to avoiding timezone shift making date wrong
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
            return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); 
        }
        catch(e) { return ds; }
    };

    // Cover Page
    html += `
      <div class="pdf-cover-page">
        <h1 class="pdf-cover-title">My Memory Journal</h1>
        <div class="pdf-cover-subtitle">${formatDate(start)} <br>to<br> ${formatDate(end)}</div>
      </div>
    `;

    // Entries
    entries.forEach(entry => {
      html += `
        <div class="journal-entry">
        <div class="pdf-entry">
          <div class="pdf-entry-header">
            <h2 class="pdf-entry-title">${entry.title}</h2>
            <div class="pdf-entry-meta">
              <span>${formatDate(entry.date)}</span>
              <span>${entry.mood}</span>
            </div>
          </div>
      `;

      if (entry.isScrapbook) {
         html += `<div class="pdf-scrapbook-canvas" data-bg="${entry.background || 'plain'}">`;
         entry.elements.forEach(el => {
            html += `<div class="pdf-canvas-element el-${el.type}" style="left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; ${el.type !== 'text' ? 'height: ' + el.height + 'px;' : ''} z-index: ${el.styles.zIndex};">`;
            
            if (el.type === 'text') {
              html += `<div style="font-family: ${el.styles.fontFamily}; color: ${el.styles.color}; font-size: ${el.styles.fontSize}; font-weight: ${el.styles.fontWeight}; font-style: ${el.styles.fontStyle}; text-align: ${el.styles.textAlign};">${el.content}</div>`;
            } else if (el.type === 'image') {
              html += `<img src="${el.content}" class="frame-${el.styles.frame}" style="width:100%;height:100%;object-fit:cover;">`;
            } else if (el.type === 'video') {
              html += `<div class="pdf-placeholder-video" style="width:100%;height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;"><i class="fas fa-video"></i> Video</div>`;
            } else if (el.type === 'sticker') {
              html += `<div style="font-size: ${el.width}px; transform: translateY(-50%);">${el.content}</div>`;
            }
            html += `</div>`;
         });
         html += `</div>`;
      } else {
         // Standard Entry Format
         let plainTextContent = entry.content;
         html += `<div class="pdf-entry-content">${plainTextContent}</div>`;
         if (entry.image) {
            html += `<img src="${entry.image}" class="pdf-entry-image">`;
         }
      }

      html += `</div></div>`; // Close .pdf-entry and .journal-entry
    });

    pdfContainer.innerHTML = html;
  }
});
