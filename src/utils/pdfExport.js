import { langName } from './languages'

// Why not jsPDF? jsPDF only ships the base14 PDF fonts (Helvetica, Times,
// Courier), which cover Latin text only -- there is no built-in support
// for Tamil, Malayalam, Telugu, Kannada, Bengali, Devanagari (Hindi/
// Marathi) or Arabic glyphs. Feeding it Unicode text for those scripts
// produces garbled output (wrong glyphs), not an error -- which is what
// showed up in the exported file.
//
// Fix: open a print-ready HTML page loaded with proper Unicode webfonts
// (Google's Noto Sans family, which covers all 13 supported scripts) and
// use the browser's own "Print -> Save as PDF" -- the browser's real text
// shaping engine renders every script correctly, which a bundled PDF
// library cannot do without embedding a separate font per script.

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600' +
  '&family=Noto+Sans+Tamil:wght@400;600' +
  '&family=Noto+Sans+Malayalam:wght@400;600' +
  '&family=Noto+Sans+Telugu:wght@400;600' +
  '&family=Noto+Sans+Kannada:wght@400;600' +
  '&family=Noto+Sans+Bengali:wght@400;600' +
  '&family=Noto+Sans+Devanagari:wght@400;600' +
  '&family=Noto+Sans+Arabic:wght@400;600' +
  '&display=swap'

const FONT_STACK =
  "'Noto Sans', 'Noto Sans Tamil', 'Noto Sans Malayalam', 'Noto Sans Telugu', " +
  "'Noto Sans Kannada', 'Noto Sans Bengali', 'Noto Sans Devanagari', 'Noto Sans Arabic', sans-serif"

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function downloadTranscript(transcripts, sourceLang, targetLang) {
  if (!transcripts.length) return

  const printWindow = window.open('', '_blank', 'width=800,height=1000')
  if (!printWindow) {
    alert('Please allow pop-ups for this site, then try downloading the transcript again.')
    return
  }

  const rows = transcripts
    .map((t, i) => `
      <div class="entry">
        <div class="meta">${i + 1}. ${escapeHtml(t.time)}</div>
        <div class="line original">[${escapeHtml(langName(sourceLang))}] ${escapeHtml(t.src || '(no speech detected)')}</div>
        <div class="line translated">[${escapeHtml(langName(targetLang))}] ${escapeHtml(t.text)}</div>
      </div>`)
    .join('')

  printWindow.document.open()
  printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Meeting Transcript</title>
<link rel="stylesheet" href="${FONT_HREF}" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: ${FONT_STACK};
    padding: 32px;
    color: #111;
    max-width: 720px;
    margin: 0 auto;
  }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .subhead { font-size: 12px; color: #666; margin-bottom: 24px; }
  .entry { margin-bottom: 16px; page-break-inside: avoid; }
  .meta { font-size: 10px; color: #888; margin-bottom: 2px; }
  .line { font-size: 14px; line-height: 1.6; }
  .original { color: #444; }
  .translated { color: #111; font-weight: 600; margin-top: 2px; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <h1>Meeting Transcript</h1>
  <div class="subhead">${escapeHtml(langName(sourceLang))} to ${escapeHtml(langName(targetLang))} | Generated ${escapeHtml(new Date().toLocaleString())}</div>
  ${rows}
</body>
</html>`)
  printWindow.document.close()

  const triggerPrint = () => {
    printWindow.focus()
    printWindow.print()
  }

  // Wait for the Noto Sans webfonts to actually finish loading before
  // printing -- otherwise the first print can render Tamil/Malayalam/etc.
  // as blank boxes because the fallback system font kicks in too early.
  const fontsReady = printWindow.document.fonts && printWindow.document.fonts.ready
  if (fontsReady) {
    Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 2500))]).then(triggerPrint)
  } else {
    setTimeout(triggerPrint, 800)
  }
}
