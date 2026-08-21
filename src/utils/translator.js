// Fast, free, no-signup translation via the MyMemory API.
//
// Why not the local NLLB-200 model from before? It's ~600M parameters —
// running it in-browser on CPU (no GPU) took several seconds per
// sentence, which stacked with Whisper's latency to make the whole
// app feel unusable for a live meeting. MyMemory returns a translation
// in well under a second over the network, which is what "real-time"
// actually requires here.
//
// Free tier limits: 5,000 characters/day per visitor IP with no email,
// 50,000/day if you set MYMEMORY_EMAIL below (MyMemory's way of
// discouraging abuse, not a real signup). For a single classroom
// session this is normally plenty; if you outgrow it, add your email
// or swap this file for a paid translation API — the rest of the app
// doesn't need to change.
const MYMEMORY_EMAIL = '' // optional: 'you@example.com' to raise the daily limit

const cache = new Map()

export async function translate(text, sourceLang, targetLang) {
  if (!text) return text
  if (sourceLang === targetLang) return text

  const cacheKey = `${sourceLang}|${targetLang}|${text}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`
    })
    if (MYMEMORY_EMAIL) params.set('de', MYMEMORY_EMAIL)

    const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`)
    if (!response.ok) throw new Error(`MyMemory HTTP ${response.status}`)

    const data = await response.json()
    const translated = data?.responseData?.translatedText

    if (!translated || (data?.responseStatus && Number(data.responseStatus) >= 400)) {
      throw new Error(data?.responseDetails || 'No translation returned')
    }

    cache.set(cacheKey, translated)
    return translated
  } catch (err) {
    console.error(`Translation ${sourceLang}->${targetLang} failed:`, err)
    return text // show the original line rather than nothing
  }
}
