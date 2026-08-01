import { useEffect, useRef, useState } from 'react'
import { createRecognizer, isSpeechRecognitionSupported } from './utils/speechRecognition'
import { translate } from './utils/translator'
import { downloadTranscript } from './utils/pdfExport'
import { LANGUAGES, speechLangFor } from './utils/languages'
import LanguageDeck from './components/LanguageDeck'
import SubtitlePanel from './components/SubtitlePanel'
import ControlDeck from './components/ControlDeck'
import TranscriptLog from './components/TranscriptLog'

const SUPPORTED = isSpeechRecognitionSupported()

export default function App() {
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('ta')
  const [isRunning, setIsRunning] = useState(false)
  const [subtitle, setSubtitle] = useState(
    SUPPORTED
      ? 'Pick your languages, then press Start meeting.'
      : 'This browser does not support live speech recognition. Please use Chrome or Edge.'
  )
  const [status, setStatus] = useState('')
  const [transcripts, setTranscripts] = useState([])

  const recognizerRef = useRef(null)
  const shouldRunRef = useRef(false)
  const sourceLangRef = useRef(sourceLang)
  const targetLangRef = useRef(targetLang)
  const lastFinalRef = useRef({ text: '', time: 0 })

  useEffect(() => { sourceLangRef.current = sourceLang }, [sourceLang])
  useEffect(() => { targetLangRef.current = targetLang }, [targetLang])

  useEffect(() => {
    return () => {
      shouldRunRef.current = false
      recognizerRef.current?.stop()
    }
  }, [])

  const handleFinal = async (text) => {
    if (!text) return

    const now = Date.now()
    const { text: prevText, time: prevTime } = lastFinalRef.current
    const normalizedPrev = prevText.trim().toLowerCase()
    const normalizedNew = text.trim().toLowerCase()

    // The browser's speech engine sometimes fires the exact same final
    // result twice in a row -- ignore the repeat outright.
    if (normalizedNew === normalizedPrev) return

    // And it often re-fires a growing version of the SAME utterance as it
    // gets more audio ("hello" -> "hello good" -> "hello good evening"),
    // rather than one clean final per sentence. If the new text is just an
    // extension of the previous one and arrived within a couple seconds,
    // treat it as a revision of the same line instead of a new sentence --
    // this is what was causing the repeated/broken entries.
    const isRevision =
      prevText && now - prevTime < 4000 && normalizedNew.startsWith(normalizedPrev)

    lastFinalRef.current = { text, time: now }

    setStatus('Translating...')
    const translated = await translate(text, sourceLangRef.current, targetLangRef.current)
    setSubtitle(translated)
    setStatus('Listening...')

    const entry = { time: new Date().toLocaleTimeString(), src: text, text: translated }
    setTranscripts((prev) => {
      if (isRevision && prev.length > 0) {
        return [...prev.slice(0, -1), entry] // replace the previous (partial) line
      }
      return [...prev, entry]
    })
  }

  const handleInterim = (text) => {
    // Show the speaker's live words immediately while translation catches up.
    setStatus('Listening...')
    setSubtitle(text)
  }

  const start = () => {
    if (!SUPPORTED) return

    lastFinalRef.current = { text: '', time: 0 }

    const recognizer = createRecognizer({
      lang: speechLangFor(sourceLang),
      onInterim: handleInterim,
      onFinal: handleFinal,
      onError: (event) => {
        console.error('Speech recognition error:', event)
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSubtitle('Microphone access was denied. Allow mic access and try again.')
          stop()
        } else if (event.error === 'network') {
          setStatus('Network issue - retrying...')
        }
      }
    })

    if (!recognizer) return

    // Chrome stops the recognizer after periods of silence or ~60s;
    // restart it automatically while the user hasn't pressed Stop.
    recognizer.onend = () => {
      if (shouldRunRef.current) {
        try {
          recognizer.start()
        } catch {
          // already running / transient -- ignore
        }
      }
    }

    recognizerRef.current = recognizer
    shouldRunRef.current = true
    recognizer.start()
    setIsRunning(true)
    setStatus('Listening...')
    setSubtitle('Listening...')
  }

  const stop = () => {
    shouldRunRef.current = false
    recognizerRef.current?.stop()
    recognizerRef.current = null
    setIsRunning(false)
    setStatus('')
    setSubtitle('Stopped. Press Start meeting to resume.')
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10 md:py-16 font-body">
      {/* Hero */}
      <header className="text-center max-w-2xl mb-10">
        <div className="inline-flex items-center gap-2 chip text-cyan/90 border border-cyan/25 rounded-full px-3 py-1 mb-5">
          <span className="status-dot live" />
          REAL-TIME - FREE - BROWSER-NATIVE
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-fog mb-3 tracking-tight">
          Live Translator <span className="text-violet">for Zoom</span>
        </h1>
        <p className="text-mist text-lg">
          Any language. Real time. Nobody in class gets left behind.
        </p>
      </header>

      {!SUPPORTED && (
        <div className="w-full max-w-3xl mb-6 rounded-2xl border border-amber/30 bg-amber/10 text-amber px-5 py-4 text-sm">
          Live speech recognition needs Chrome or Edge (desktop or Android). Open this page in one of those browsers to use the app.
        </div>
      )}

      {/* Console */}
      <main className="console-panel w-full max-w-3xl p-6 md:p-10">
        <LanguageDeck
          sourceLang={sourceLang}
          targetLang={targetLang}
          setSourceLang={setSourceLang}
          setTargetLang={setTargetLang}
          disabled={isRunning}
        />

        <SubtitlePanel subtitle={subtitle} isLive={isRunning} status={status} />

        <ControlDeck
          isRunning={isRunning}
          isLoading={false}
          onStart={start}
          onStop={stop}
          subtitle={subtitle}
          onDownload={() => downloadTranscript(transcripts, sourceLang, targetLang)}
          hasTranscripts={transcripts.length > 0}
          disabled={!SUPPORTED}
        />

        <TranscriptLog transcripts={transcripts} />
      </main>

      <footer className="max-w-2xl text-center mt-8">
        <p className="text-sm text-mist">
          Needs an internet connection for live speech recognition and translation -- no installs, no login, no cost.
          Supports {LANGUAGES.length} languages: {LANGUAGES.map((l) => l.name).join(', ')}.
        </p>
      </footer>
    </div>
  )
}
