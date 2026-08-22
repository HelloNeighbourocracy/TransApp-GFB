import { LANGUAGES, AUTO_DETECT_CODE } from '../utils/languages'

export default function LanguageDeck({ sourceLang, targetLang, setSourceLang, setTargetLang, disabled }) {
  const swap = () => {
    // Don't swap if source is Auto Detect — auto can only be on source side
    if (sourceLang === AUTO_DETECT_CODE) return
    const s = sourceLang
    setSourceLang(targetLang)
    setTargetLang(s)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-3 items-end mb-8">
      <LangSelect
        label="Speaker is talking in"
        icon="🗣️"
        value={sourceLang}
        onChange={setSourceLang}
        disabled={disabled}
        isSource={true}
      />

      <button
        type="button"
        onClick={swap}
        disabled={disabled}
        aria-label="Swap languages"
        title="Swap languages"
        className="swap-btn w-14 h-14 rounded-full mx-auto mb-1 flex items-center justify-center text-2xl text-fog disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ⇄
      </button>

      <LangSelect
        label="Show subtitles in"
        icon="🌍"
        value={targetLang}
        onChange={setTargetLang}
        disabled={disabled}
        align="right"
      />
    </div>
  )
}

function LangSelect({ label, icon, value, onChange, disabled, align, isSource = false }) {
  // Find selected language to show its flag next to the dropdown
  const selected = LANGUAGES.find((l) => l.code === value)

  return (
    <div className={align === 'right' ? 'md:text-right' : ''}>
      <label className="block mb-2 text-sm uppercase tracking-wider text-mist font-medium">
        {icon} {label}
      </label>
      <div className="dial-select rounded-2xl flex items-center">
        {/* Flag badge */}
        <span
          className="pl-4 text-2xl select-none pointer-events-none"
          aria-hidden="true"
        >
          {value === AUTO_DETECT_CODE ? '🌐' : selected?.flag}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 bg-transparent text-fog pl-2 pr-4 py-4 rounded-2xl text-lg font-display font-medium outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSource && (
            <option key={AUTO_DETECT_CODE} value={AUTO_DETECT_CODE} className="bg-panel text-fog">
              🌐  Auto Detect / Hybrid
            </option>
          )}
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="bg-panel text-fog">
              {l.flag}  {l.name} — {l.nativeName}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
