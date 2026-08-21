import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vihgthblqvqlktlscecx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpaGd0aGJscXZxbGt0bHNjZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NzE3MjcsImV4cCI6MjEwMjM0NzcyN30.wE6T38uBFm2T1TLNu_nv4qSvvfciKQ0oOV7FB8J31WQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Device fingerprint (3-layer: canvas + localStorage + IndexedDB) ──────────
function canvasFingerprint() {
  try {
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')
    ctx.textBaseline = 'alphabetic'
    ctx.font = "14px 'Arial'"
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('TransApp\uD83C\uDF10', 2, 15)
    ctx.fillStyle = 'rgba(102,204,0,0.7)'
    ctx.fillText('TransApp\uD83C\uDF10', 4, 17)
    return c.toDataURL()
  } catch { return 'no-canvas' }
}

function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

async function idbGet(key) {
  return new Promise((res) => {
    try {
      const req = indexedDB.open('transapp_fp', 1)
      req.onupgradeneeded = (e) => e.target.result.createObjectStore('kv')
      req.onsuccess = (e) => {
        const tx = e.target.result.transaction('kv', 'readonly')
        const r = tx.objectStore('kv').get(key)
        r.onsuccess = () => res(r.result ?? null)
        r.onerror = () => res(null)
      }
      req.onerror = () => res(null)
    } catch { res(null) }
  })
}

async function idbSet(key, val) {
  return new Promise((res) => {
    try {
      const req = indexedDB.open('transapp_fp', 1)
      req.onupgradeneeded = (e) => e.target.result.createObjectStore('kv')
      req.onsuccess = (e) => {
        const tx = e.target.result.transaction('kv', 'readwrite')
        tx.objectStore('kv').put(val, key)
        tx.oncomplete = () => res()
        tx.onerror = () => res()
      }
      req.onerror = () => res()
    } catch { res() }
  })
}

export async function getDeviceFingerprint() {
  const cached = await idbGet('fp')
  if (cached) return cached
  const lsId = localStorage.getItem('_ta_did') || crypto.randomUUID()
  localStorage.setItem('_ta_did', lsId)
  const canvasHash = simpleHash(canvasFingerprint())
  const ua = simpleHash(navigator.userAgent + navigator.language)
  const fp = `${canvasHash}-${ua}-${lsId.slice(0, 8)}`
  await idbSet('fp', fp)
  return fp
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export async function registerSession(userId, deviceFp) {
  await supabase.from('sessions').upsert(
    { user_id: userId, device_id: deviceFp, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
}

export async function checkSessionConflict(userId, deviceFp) {
  try {
    const { data } = await supabase
      .from('sessions')
      .select('device_id')
      .eq('user_id', userId)
      .maybeSingle()  // maybeSingle: no error if row doesn't exist
    return data && data.device_id !== deviceFp
  } catch { return false }
}

export async function clearSession(userId) {
  await supabase.from('sessions').delete().eq('user_id', userId)
}

// ─── Trial helpers ────────────────────────────────────────────────────────────

export async function hasUsedTrial(deviceFp) {
  if (!deviceFp) return false
  try {
    const { data, error } = await supabase
      .from('used_trials')
      .select('device_id')
      .eq('device_id', deviceFp)
      .maybeSingle()  // maybeSingle: returns null if not found, no error
    if (error) return false  // RLS block = treat as not used (safe default)
    return !!data
  } catch { return false }
}

export async function markTrialUsed(deviceFp) {
  if (!deviceFp) return
  try {
    await supabase.from('used_trials').insert({ device_id: deviceFp })
  } catch { /* non-critical - don't block signup */ }
}

// ─── Realtime: kick old device when new device logs in ───────────────────────

// ─── Profile helpers ─────────────────────────────────────────────────────────

export async function fetchProfile(userId) {
  try {
    const { data } = await supabase
      .from('Profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    return data || null
  } catch { return null }
}

export async function createProfileIfMissing(userId, metadata) {
  const { data: existing } = await supabase
    .from('Profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()
  if (existing) return // already exists

  await supabase.from('Profiles').insert({
    id: userId,
    email: metadata.email || '',
    name: metadata.name || '',
    surname: metadata.surname || '',
    phone: metadata.phone || '',
    source_lang: metadata.source_lang || 'en',
    source_lang2: metadata.source_lang2 || '',
    target_lang: metadata.target_lang || 'ta',
    target_lang2: metadata.target_lang2 || '',
    role: 'trial',
    plan: 'trial_7',
    subscription: 'active',
  })
}

export function isProfileActive(profile) {
  if (!profile) return false
  if (profile.subscription !== 'active') return false
  if (!profile.expires_at) return true // lifetime / friend
  return new Date(profile.expires_at) > new Date()
}

export function profileDaysLeft(profile) {
  if (!profile || !profile.expires_at) return 9999
  // Use UTC dates only to avoid timezone drift
  const now = new Date()
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const expiry = new Date(profile.expires_at)
  const expiryUTC = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate())
  // Difference in full days (floor). Monthly=30days: start day counts, so day1=30, last=1
  return Math.max(0, Math.floor((expiryUTC - todayUTC) / 86400000))
}

export function subscribeToSessionKick(userId, deviceFp, onKick) {
  return supabase
    .channel(`session_${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `user_id=eq.${userId}` },
      (payload) => { if (payload.new.device_id !== deviceFp) onKick() }
    )
    .subscribe()
}
