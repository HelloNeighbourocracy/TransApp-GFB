// 13 languages. `code` is used for translation (MyMemory langpair);
// `speechLang` is the BCP-47 tag the browser's Speech Recognition needs.
export const LANGUAGES = [
  { code: 'en', name: 'English', speechLang: 'en-US', flag: '🇬🇧' },
  { code: 'fr', name: 'French', speechLang: 'fr-FR', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', speechLang: 'es-ES', flag: '🇪🇸' },
  { code: 'sw', name: 'Swahili', speechLang: 'sw-KE', flag: '🇰🇪' },
  { code: 'ar', name: 'Arabic', speechLang: 'ar-SA', flag: '🇸🇦' },
  { code: 'ta', name: 'Tamil', speechLang: 'ta-IN', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', speechLang: 'ml-IN', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', speechLang: 'te-IN', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', speechLang: 'kn-IN', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', speechLang: 'bn-IN', flag: '🇧🇩' },
  { code: 'hi', name: 'Hindi', speechLang: 'hi-IN', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', speechLang: 'mr-IN', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', speechLang: 'pt-PT', flag: '🇵🇹' }
]

export function langName(code) {
  return LANGUAGES.find((l) => l.code === code)?.name || code
}

export function speechLangFor(code) {
  return LANGUAGES.find((l) => l.code === code)?.speechLang || 'en-US'
}
