// 19 languages. `code` is used for translation (MyMemory langpair);
// `speechLang` is the BCP-47 tag the browser's Speech Recognition needs;
// `nativeName` is the language's own name written in its own script, so
// someone who can't read English can still recognize their language in
// the exported transcript.
export const LANGUAGES = [
  { code: 'en', name: 'English',    nativeName: 'English',    speechLang: 'en-US', flag: '🇬🇧' },
  { code: 'fr', name: 'French',     nativeName: 'Français',   speechLang: 'fr-FR', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish',    nativeName: 'Español',    speechLang: 'es-ES', flag: '🇪🇸' },
  { code: 'de', name: 'German',     nativeName: 'Deutsch',    speechLang: 'de-DE', flag: '🇩🇪' },
  { code: 'it', name: 'Italian',    nativeName: 'Italiano',   speechLang: 'it-IT', flag: '🇮🇹' },
  { code: 'nl', name: 'Dutch',      nativeName: 'Nederlands', speechLang: 'nl-NL', flag: '🇳🇱' },
  { code: 'zh', name: 'Chinese',    nativeName: '中文',        speechLang: 'zh-CN', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese',   nativeName: '日本語',      speechLang: 'ja-JP', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean',     nativeName: '한국어',      speechLang: 'ko-KR', flag: '🇰🇷' },
  { code: 'sw', name: 'Swahili',    nativeName: 'Kiswahili',  speechLang: 'sw-KE', flag: '🇰🇪' },
  { code: 'ar', name: 'Arabic',     nativeName: 'العربية',    speechLang: 'ar-SA', flag: '🇸🇦' },
  { code: 'ta', name: 'Tamil',      nativeName: 'தமிழ்',      speechLang: 'ta-IN', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam',  nativeName: 'മലയാളം',     speechLang: 'ml-IN', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu',     nativeName: 'తెలుగు',     speechLang: 'te-IN', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada',    nativeName: 'ಕನ್ನಡ',      speechLang: 'kn-IN', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali',    nativeName: 'বাংলা',      speechLang: 'bn-IN', flag: '🇧🇩' },
  { code: 'hi', name: 'Hindi',      nativeName: 'हिन्दी',     speechLang: 'hi-IN', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi',    nativeName: 'मराठी',      speechLang: 'mr-IN', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português',  speechLang: 'pt-PT', flag: '🇵🇹' },
]

export function langName(code) {
  return LANGUAGES.find((l) => l.code === code)?.name || code
}

export function nativeLangName(code) {
  return LANGUAGES.find((l) => l.code === code)?.nativeName || code
}

export function speechLangFor(code) {
  return LANGUAGES.find((l) => l.code === code)?.speechLang || 'en-US'
}
