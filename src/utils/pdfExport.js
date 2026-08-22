import { nativeLangName } from './languages'

// Why not jsPDF? jsPDF only ships the base14 PDF fonts (Helvetica, Times,
// Courier), which cover Latin text only -- there is no built-in support
// for Tamil, Malayalam, Telugu, Kannada, Bengali, Devanagari (Hindi/
// Marathi), Arabic, or CJK (Chinese, Japanese, Korean) glyphs. Feeding
// it Unicode text for those scripts produces garbled output, not an error.
//
// Fix: open a print-ready HTML page loaded with proper Unicode webfonts
// (Google's Noto Sans family, covering all 19 supported scripts) and
// use the browser's own "Print -> Save as PDF".

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600' +
  '&family=Noto+Sans+Tamil:wght@400;600' +
  '&family=Noto+Sans+Malayalam:wght@400;600' +
  '&family=Noto+Sans+Telugu:wght@400;600' +
  '&family=Noto+Sans+Kannada:wght@400;600' +
  '&family=Noto+Sans+Bengali:wght@400;600' +
  '&family=Noto+Sans+Devanagari:wght@400;600' +
  '&family=Noto+Sans+Arabic:wght@400;600' +
  '&family=Noto+Sans+SC:wght@400;600' +      // Simplified Chinese
  '&family=Noto+Sans+JP:wght@400;600' +      // Japanese
  '&family=Noto+Sans+KR:wght@400;600' +      // Korean
  '&display=swap'

const FONT_STACK =
  "'Noto Sans', 'Noto Sans SC', 'Noto Sans JP', 'Noto Sans KR', " +
  "'Noto Sans Tamil', 'Noto Sans Malayalam', 'Noto Sans Telugu', " +
  "'Noto Sans Kannada', 'Noto Sans Bengali', 'Noto Sans Devanagari', " +
  "'Noto Sans Arabic', sans-serif"

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
    .map((t) => `
      <div class="entry">
        <div class="meta">${escapeHtml(t.time)}</div>
        <div class="line original">${escapeHtml(t.src || '\u2014')}</div>
        <div class="line translated">${escapeHtml(t.text)}</div>
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
  .subhead { font-size: 13px; color: #666; margin-bottom: 24px; }
  .entry { margin-bottom: 18px; page-break-inside: avoid; }
  .meta { font-size: 10px; color: #999; margin-bottom: 3px; }
  .line { font-size: 15px; line-height: 1.6; }
  .original { color: #777; font-style: italic; }
  .translated { color: #111; font-weight: 600; font-size: 18px; margin-top: 3px; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <h1>Meeting Transcript</h1>
  <div class="subhead">${escapeHtml(nativeLangName(sourceLang))} &#8594; ${escapeHtml(nativeLangName(targetLang))} &nbsp;|&nbsp; ${escapeHtml(new Date().toLocaleString())}</div>
  ${rows}
</body>
</html>`)
  printWindow.document.close()

  const triggerPrint = () => {
    printWindow.focus()
    printWindow.print()
  }

  // Wait for Noto Sans webfonts (including CJK) to load before printing.
  const fontsReady = printWindow.document.fonts && printWindow.document.fonts.ready
  if (fontsReady) {
    Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 3000))]).then(triggerPrint)
  } else {
    setTimeout(triggerPrint, 800)
  }
}
