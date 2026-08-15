import { useEffect, useRef, useState } from 'react'
import { createRecognizer, isSpeechRecognitionSupported } from './utils/speechRecognition'
import { translate } from './utils/translator'
import { downloadTranscript } from './utils/pdfExport'
import { LANGUAGES, speechLangFor } from './utils/languages'
import LanguageDeck from './components/LanguageDeck'
import SubtitlePanel from './components/SubtitlePanel'
import ControlDeck from './components/ControlDeck'
import TranscriptLog from './components/TranscriptLog'
import AuthGate from './auth/AuthGate'

const SUPPORTED = isSpeechRecognitionSupported()

function MainApp({ user, isPro, trialLangs, onLogout, daysLeft, expiry, onChangePw }) {
  // Trial: locked to signup languages; Pro: free to change
  const [sourceLang, setSourceLang] = useState(trialLangs.source)
  const [targetLang, setTargetLang] = useState(trialLangs.target)
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
  const lastFinalRef = useRef({ text: '', time: 0, id: 0 })
  const utteranceIdRef = useRef(0)
  const latestRequestRef = useRef(0)

  useEffect(() => { sourceLangRef.current = sourceLang }, [sourceLang])
  useEffect(() => { targetLangRef.current = targetLang }, [targetLang])

  useEffect(() => {
    return () => {
      shouldRunRef.current = false
      recognizerRef.current?.stop()
    }
  }, [])

  // Trial: clamp language selectors to signup languages only
  const handleSetSourceLang = (code) => {
    if (!isPro) return // locked for trial
    setSourceLang(code)
  }
  const handleSetTargetLang = (code) => {
    if (!isPro) return
    setTargetLang(code)
  }

  const handleFinal = async (text) => {
    if (!text) return
    const now = Date.now()
    const { text: prevText, time: prevTime, id: prevId } = lastFinalRef.current
    const normalizedPrev = prevText.trim().toLowerCase()
    const normalizedNew = text.trim().toLowerCase()
    if (normalizedNew === normalizedPrev) return

    const isRevision =
      prevText && now - prevTime < 4000 && normalizedNew.startsWith(normalizedPrev)
    const utteranceId = isRevision ? prevId : ++utteranceIdRef.current
    lastFinalRef.current = { text, time: now, id: utteranceId }
    const myRequestId = ++latestRequestRef.current

    setStatus('Translating...')
    const translated = await translate(text, sourceLangRef.current, targetLangRef.current)

    const entry = { id: utteranceId, time: new Date().toLocaleTimeString(), src: text, text: translated }
    setTranscripts((prev) => {
      const idx = prev.findIndex((e) => e.id === utteranceId)
      if (idx !== -1) {
        const next = [...prev]; next[idx] = entry; return next
      }
      return [...prev, entry]
    })

    if (myRequestId === latestRequestRef.current) {
      setSubtitle(translated)
      setStatus('Listening...')
    }
  }

  const handleInterim = (text) => {
    setStatus('Listening...')
    setSubtitle(text)
  }

  const start = () => {
    if (!SUPPORTED) return
    lastFinalRef.current = { text: '', time: 0, id: 0 }
    utteranceIdRef.current = 0
    latestRequestRef.current = 0

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

    recognizer.onend = () => {
      if (shouldRunRef.current) {
        try { recognizer.start() } catch { }
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

  const meta = user?.user_metadata || {}

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10 md:py-16 font-body">
      {/* Header bar with user info */}
      <div style={{
        position: 'fixed', top: 0, right: 0, left: 0, zIndex: 50,
        background: 'rgba(11,15,30,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isPro
            ? <span style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontWeight: 800, fontSize: 12 }}>⚡ Pro</span>
            : <span style={{ background: 'linear-gradient(135deg,#34d399,#059669)', color: '#fff', borderRadius: 20, padding: '3px 12px', fontWeight: 800, fontSize: 12 }}>🕐 Trial · {daysLeft}d left</span>
          }
          <span style={{ color: '#94a3b8', fontSize: 12 }}>{meta.name} {meta.surname}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={onChangePw}
            style={{ fontSize: 11, color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Change password
          </button>
          <button onClick={onLogout}
            style={{ fontSize: 11, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Hero */}
      <header className="text-center max-w-2xl mb-10" style={{ marginTop: 52 }}>
        <div className="inline-flex items-center gap-2 chip text-cyan/90 border border-cyan/25 rounded-full px-3 py-1 mb-5">
          <span className="status-dot live" />
          REAL-TIME — BROWSER-NATIVE
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-fog mb-3 tracking-tight">
          Live Translator <span className="text-violet">for Zoom</span>
        </h1>
        <p className="text-mist text-lg">
          Any language. Real time. Nobody in class gets left behind.
        </p>
        {/* Trial language lock notice */}
        {!isPro && (
          <div style={{
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 12, padding: '8px 16px', marginTop: 12,
            color: '#fbbf24', fontSize: 13,
          }}>
            🔒 Trial: Languages locked to your signup selection.{' '}
            <span style={{ color: '#94a3b8' }}>Upgrade to Pro for all 19 languages + transcript download.</span>
          </div>
        )}
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
          setSourceLang={handleSetSourceLang}
          setTargetLang={handleSetTargetLang}
          disabled={isRunning || !isPro}
          trialLocked={!isPro}
        />

        <SubtitlePanel subtitle={subtitle} isLive={isRunning} status={status} />

        <ControlDeck
          isRunning={isRunning}
          onStart={start}
          onStop={stop}
          subtitle={subtitle}
          onDownload={() => downloadTranscript(transcripts, sourceLang, targetLang)}
          hasTranscripts={transcripts.length > 0}
          disabled={!SUPPORTED}
          canDownload={isPro}   // trial users see locked state
        />

        <TranscriptLog transcripts={transcripts} />
      </main>

      <footer className="max-w-2xl text-center mt-8">
        <p className="text-sm text-mist">
          Needs an internet connection for live speech recognition and translation.
          Supports {LANGUAGES.length} languages: {LANGUAGES.map((l) => l.name).join(', ')}.
        </p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthGate>
      {(authProps) => <MainApp {...authProps} />}
    </AuthGate>
  )
}
