// Wraps the browser's built-in SpeechRecognition (Web Speech API).
// This is the same engine Chrome/Edge use for dictation — it streams
// audio to Google's speech servers and returns text in ~1 second,
// which is what makes this genuinely "live" (Whisper-tiny running
// locally in WASM cannot match this latency on a typical laptop).
//
// Trade-off: requires internet, and audio leaves the browser for
// recognition. There is no local/offline equivalent with comparable
// speed — that's a hard constraint of real-time captioning in-browser.

export function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

/**
 * @param {string} lang BCP-47 tag, e.g. 'en-US', 'ta-IN'
 * @param {(text: string) => void} onInterim live, not-yet-final partial text
 * @param {(text: string) => void} onFinal finalized sentence/phrase
 * @param {(err: any) => void} onError
 */
export function createRecognizer({ lang, onInterim, onFinal, onError }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return null

  const recognition = new SpeechRecognition()
  // If lang is empty string (Auto Detect mode), don't set recognition.lang
  // This lets the browser use its default/auto behavior for speech input
  // Translation side handles language auto-detection via MyMemory 'autodetect'
  if (lang) recognition.lang = lang
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  recognition.onresult = (event) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const transcript = result[0].transcript
      if (result.isFinal) {
        onFinal?.(transcript.trim())
      } else {
        interim += transcript
      }
    }
    if (interim.trim()) onInterim?.(interim.trim())
  }

  recognition.onerror = (event) => onError?.(event)

  return recognition
}
