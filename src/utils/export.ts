export function downloadTxtFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadHtmlBook(
  filename: string,
  title: string,
  content: string,
  isRtl: boolean,
  targetLangName: string
): void {
  const formattedHtml = `<!DOCTYPE html>
<html lang="${isRtl ? 'ur' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} - LingoNovel AI Translation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: ${isRtl ? "'Noto Nastaliq Urdu', 'Noto Sans Arabic', serif" : "'Source Serif 4', Georgia, serif"};
      max-width: 800px;
      margin: 40px auto;
      padding: 0 24px;
      line-height: ${isRtl ? '2.4' : '1.8'};
      font-size: ${isRtl ? '19px' : '17px'};
      color: #1e293b;
      background: #fafaf9;
    }
    header {
      text-align: center;
      margin-bottom: 48px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e2e8f0;
    }
    h1 {
      font-size: 28px;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .meta {
      font-size: 13px;
      color: #64748b;
      font-family: system-ui, sans-serif;
    }
    p {
      margin-bottom: 1.5em;
      text-align: justify;
    }
    .chapter-heading {
      font-size: 22px;
      font-weight: bold;
      margin-top: 48px;
      margin-bottom: 20px;
      color: #3b82f6;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">Translated into ${escapeHtml(targetLangName)} by LingoNovel AI • ${new Date().toLocaleDateString()}</div>
  </header>
  <main>
    ${content
      .split('\n\n')
      .map((para) => {
        const trimmed = para.trim();
        if (/^(?:chapter|prologue|epilogue|book|part)\b/i.test(trimmed)) {
          return `<h2 class="chapter-heading">${escapeHtml(trimmed)}</h2>`;
        }
        return `<p>${escapeHtml(trimmed).replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n')}
  </main>
</body>
</html>`;

  const blob = new Blob([formattedHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openPrintablePdfView(
  title: string,
  content: string,
  isRtl: boolean,
  targetLangName: string
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the printable PDF document.');
    return;
  }

  const paragraphsHtml = content
    .split('\n\n')
    .map((para) => {
      const trimmed = para.trim();
      if (/^(?:chapter|prologue|epilogue|book|part)\b/i.test(trimmed)) {
        return `<div class="chapter-title">${escapeHtml(trimmed)}</div>`;
      }
      return `<p>${escapeHtml(trimmed).replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  printWindow.document.write(`<!DOCTYPE html>
<html lang="${isRtl ? 'ur' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} - PDF Export</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm;
    }
    body {
      font-family: ${isRtl ? "'Noto Nastaliq Urdu', 'Noto Sans Arabic', serif" : "'Source Serif 4', Georgia, serif"};
      color: #111827;
      line-height: ${isRtl ? '2.4' : '1.8'};
      font-size: ${isRtl ? '16pt' : '11.5pt'};
      margin: 0;
      padding: 0;
    }
    .print-header {
      text-align: center;
      padding-bottom: 16px;
      margin-bottom: 24px;
      border-bottom: 2px solid #e5e7eb;
    }
    .doc-title {
      font-size: 20pt;
      font-weight: bold;
      margin: 0 0 8px 0;
    }
    .doc-sub {
      font-size: 10pt;
      color: #4b5563;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .chapter-title {
      font-size: 16pt;
      font-weight: bold;
      margin-top: 32px;
      margin-bottom: 16px;
      color: #1f2937;
      page-break-before: always;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 6px;
    }
    .chapter-title:first-of-type {
      page-break-before: avoid;
    }
    p {
      margin: 0 0 14pt 0;
      text-align: justify;
      text-justify: inter-word;
    }
    .toolbar {
      position: fixed;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
      z-index: 1000;
      background: white;
      padding: 8px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: system-ui, sans-serif;
    }
    .btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    }
    .btn:hover { background: #1d4ed8; }
    @media print {
      .toolbar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    <button class="btn" style="background:#64748b" onclick="window.close()">Close</button>
  </div>
  <div class="print-header">
    <h1 class="doc-title">${escapeHtml(title)}</h1>
    <div class="doc-sub">Translated into ${escapeHtml(targetLangName)} by LingoNovel AI • ${new Date().toLocaleDateString()}</div>
  </div>
  <main>
    ${paragraphsHtml}
  </main>
</body>
</html>`);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
