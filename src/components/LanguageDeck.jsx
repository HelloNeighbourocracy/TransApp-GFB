import { LANGUAGES } from '../utils/languages'

export default function LanguageDeck({ sourceLang, targetLang, setSourceLang, setTargetLang, disabled }) {
  const swap = () => {
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

function LangSelect({ label, icon, value, onChange, disabled, align }) {
  return (
    <div className={align === 'right' ? 'md:text-right' : ''}>
      <label className="block mb-2 text-sm uppercase tracking-wider text-mist font-medium">
        {icon} {label}
      </label>
      <div className="dial-select rounded-2xl">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full bg-transparent text-fog p-4 rounded-2xl text-lg font-display font-medium outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="bg-panel text-fog">
              {l.flag} {l.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
