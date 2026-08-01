export default function SubtitlePanel({ subtitle, isLive, status }) {
  return (
    <div className={`subtitle-glass p-8 md:p-10 min-h-[220px] flex flex-col items-center justify-center mb-6 ${isLive ? 'is-live' : ''}`}>
      {status && (
        <div className="chip text-mist mb-3 uppercase">{status}</div>
      )}
      <p className="text-3xl md:text-5xl font-display font-semibold text-center leading-relaxed text-fog">
        {subtitle}
      </p>
      {isLive && (
        <div className="flex items-end gap-1 mt-6 h-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="wave-bar"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
