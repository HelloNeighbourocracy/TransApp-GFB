import Overlay from './Overlay'

export default function ControlDeck({
  isRunning, onStart, onStop, subtitle,
  onDownload, hasTranscripts, disabled,
  canDownload = true   // false = trial user, show locked state
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-5 justify-center flex-wrap items-center">
        <div className="relative">
          {isRunning && <span className="pulse-ring" />}
          {!isRunning ? (
            <button
              onClick={onStart}
              disabled={disabled}
              className="btn-sculpt btn-start relative px-10 py-4 text-xl text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {'\u25B6'}  Start meeting
            </button>
          ) : (
            <button onClick={onStop} className="btn-sculpt btn-stop relative px-10 py-4 text-xl text-white">
              {'\u23F9'}  Stop
            </button>
          )}
        </div>

        <Overlay text={subtitle} />
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-1.5">
        {canDownload ? (
          <>
            <button
              onClick={onDownload}
              disabled={!hasTranscripts}
              className="btn-sculpt btn-ghost w-full px-4 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {'\uD83D\uDDA8\uFE0F'} Save transcript (PDF)
            </button>
            <p className="text-xs text-mist text-center">
              Opens the print dialog in a new tab {'\u2014'} choose "Save as PDF" as the destination.
            </p>
          </>
        ) : (
          <>
            <button
              disabled
              style={{
                width: '100%', padding: '12px 16px',
                borderRadius: 999, fontSize: '1rem',
                background: 'linear-gradient(180deg, #232f4c 0%, #161f36 100%)',
                color: '#94a3b8', border: '1px solid rgba(245,158,11,0.25)',
                cursor: 'not-allowed', opacity: 0.7,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              🔒 Save transcript (PDF) — Pro only
            </button>
            <p className="text-xs text-center" style={{ color: '#f59e0b' }}>
              Upgrade to Pro to download full session transcripts.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
