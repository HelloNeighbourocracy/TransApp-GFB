// 13 languages. `code` is used for translation (MyMemory langpair);
// `speechLang` is the BCP-47 tag the browser's Speech Recognition needs;
// `nativeName` is the language's own name written in its own script, so
// someone who can't read English can still recognize their language in
// the exported transcript.
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', speechLang: 'en-US', flag: '\uD83C\uDDEC\uD83C\uDDE7' },
  { code: 'fr', name: 'French', nativeName: 'Français', speechLang: 'fr-FR', flag: '\uD83C\uDDEB\uD83C\uDDF7' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', speechLang: 'es-ES', flag: '\uD83C\uDDEA\uD83C\uDDF8' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', speechLang: 'sw-KE', flag: '\uD83C\uDDF0\uD83C\uDDEA' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', speechLang: 'ar-SA', flag: '\uD83C\uDDF8\uD83C\uDDE6' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechLang: 'ta-IN', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechLang: 'ml-IN', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechLang: 'te-IN', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechLang: 'kn-IN', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechLang: 'bn-IN', flag: '\uD83C\uDDE7\uD83C\uDDE9' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechLang: 'hi-IN', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechLang: 'mr-IN', flag: '\uD83C\uDDEE\uD83C\uDDF3' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', speechLang: 'pt-PT', flag: '\uD83C\uDDF5\uD83C\uDDF9' }
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
