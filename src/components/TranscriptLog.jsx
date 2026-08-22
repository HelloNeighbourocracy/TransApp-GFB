export default function TranscriptLog({ transcripts }) {
  if (!transcripts.length) return null

  return (
    <div className="console-panel mt-6 p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm uppercase tracking-wider text-mist">Live transcript log</h2>
        <span className="chip text-mist">{transcripts.length} lines</span>
      </div>
      <div className="log-scroll flex flex-col-reverse gap-3 max-h-64 overflow-y-auto pr-1">
        {transcripts.slice().reverse().map((t) => (
          <div key={t.id} className="border-l-2 border-violet/40 pl-3">
            <div className="chip text-mist">{t.time}</div>
            <div className="text-sm text-mist/80">{t.src || '(no speech detected)'}</div>
            <div className="text-base text-fog font-medium">{t.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
