import Overlay from './Overlay'

export default function ControlDeck({ isRunning, onStart, onStop, subtitle, onDownload, hasTranscripts, disabled }) {
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

      <button
        onClick={onDownload}
        disabled={!hasTranscripts}
        className="btn-sculpt btn-ghost w-full max-w-md px-4 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {'\uD83D\uDCC4'} Download transcript (PDF)
      </button>
    </div>
  )
}
