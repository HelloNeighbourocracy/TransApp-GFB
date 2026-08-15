import { useEffect, useRef, useState } from 'react'
import {
  supabase, getDeviceFingerprint,
  hasUsedTrial, markTrialUsed,
  registerSession, checkSessionConflict, clearSession,
  subscribeToSessionKick
} from './supabase'
import { LANGUAGES } from '../utils/languages'

// ─── Screen constants ─────────────────────────────────────────────────────────
const S = {
  LOADING:       'loading',
  HOME:          'home',         // Trial / Pro two-box landing
  SIGNUP:        'signup',
  LOGIN:         'login',
  PLAN_SELECT:   'plan_select',  // After login: Trial 7d  vs  Pro Version
  PRO_CONTACT:   'pro_contact',  // Pro contact + pricing
  CHANGE_PW:     'change_pw',
  APP:           'app',          // Authenticated + plan chosen → render children
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0]
const daysLeft = (expiry) =>
  Math.max(0, Math.floor((new Date(expiry) - new Date()) / 86400000) + 1)

// ─── Embossed card wrapper ────────────────────────────────────────────────────
function Card({ children, className = '' }) {
  return (
    <div
      className={`auth-card ${className}`}
      style={{
        background: 'linear-gradient(145deg, #f0f0f0, #cacaca)',
        boxShadow: `
          20px 20px 40px rgba(0,0,0,0.2),
          -14px -14px 28px rgba(255,255,255,0.9),
          inset 2px 2px 5px rgba(255,255,255,0.7),
          inset -3px -3px 7px rgba(0,0,0,0.08)`,
        borderRadius: '50%',
        width: 360,
        height: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

// Neumorphic input
function NInput({ type = 'text', placeholder, value, onChange, style = {} }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: '85%',
        padding: '10px 14px',
        margin: '5px 0',
        borderRadius: 30,
        border: 'none',
        outline: 'none',
        background: 'linear-gradient(145deg, #d6d6d6, #f5f5f5)',
        boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.12), inset -3px -3px 6px rgba(255,255,255,0.8)',
        fontSize: 13,
        color: '#333',
        ...style,
      }}
    />
  )
}

// Neumorphic select
function NSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width: '85%',
        padding: '9px 14px',
        margin: '5px 0',
        borderRadius: 30,
        border: 'none',
        outline: 'none',
        background: 'linear-gradient(145deg, #d6d6d6, #f5f5f5)',
        boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.12), inset -3px -3px 6px rgba(255,255,255,0.8)',
        fontSize: 13,
        color: '#333',
        cursor: 'pointer',
        appearance: 'none',
      }}
    >
      {children}
    </select>
  )
}

// Embossed button with 3D cinematic hover
function NButton({ children, onClick, color = '#555', glow = 'rgba(0,0,0,0.3)', disabled = false, style = {} }) {
  const [hov, setHov] = useState(false)
  const [press, setPress] = useState(false)
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false) }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      disabled={disabled}
      style={{
        width: '85%',
        padding: '11px 0',
        margin: '6px 0',
        borderRadius: 30,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: '#fff',
        background: color,
        boxShadow: press
          ? `inset 4px 4px 8px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.2)`
          : hov
            ? `6px 6px 18px rgba(0,0,0,0.3), -4px -4px 12px rgba(255,255,255,0.5), 0 0 28px ${glow}, 0 0 8px ${glow}`
            : `8px 8px 20px rgba(0,0,0,0.2), -5px -5px 14px rgba(255,255,255,0.6)`,
        transform: press ? 'scale(0.97) translateY(2px)' : hov ? 'scale(1.03) translateY(-2px)' : 'scale(1)',
        transition: 'all 200ms cubic-bezier(0.34,1.56,0.64,1)',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// Contact platform button (WhatsApp / Telegram / Email)
function PlatformBtn({ icon, label, color, glow, href, draftMsg }) {
  const [hov, setHov] = useState(false)
  const fullHref = draftMsg ? `${href}${encodeURIComponent(draftMsg)}` : href
  return (
    <a
      href={fullHref}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '85%',
        padding: '13px 20px',
        margin: '8px 0',
        borderRadius: 30,
        textDecoration: 'none',
        color: '#fff',
        fontWeight: 700,
        fontSize: 15,
        background: color,
        boxShadow: hov
          ? `6px 6px 18px rgba(0,0,0,0.3), -4px -4px 12px rgba(255,255,255,0.5), 0 0 32px ${glow}`
          : `8px 8px 20px rgba(0,0,0,0.2), -5px -5px 14px rgba(255,255,255,0.6)`,
        transform: hov ? 'scale(1.04) translateY(-2px)' : 'scale(1)',
        transition: 'all 220ms cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      {label}
    </a>
  )
}

// ─── Main AuthGate ─────────────────────────────────────────────────────────────
export default function AuthGate({ children }) {
  const [screen, setScreen] = useState(S.LOADING)
  const [user, setUser] = useState(null)
  const [userPlan, setUserPlan] = useState(null) // 'trial' | 'pro'
  const [trialLangs, setTrialLangs] = useState({ source: 'en', target: 'ta' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [deviceFp, setDeviceFp] = useState('')
  const kickChannelRef = useRef(null)

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')
  const [signupSrc, setSignupSrc] = useState('en')
  const [signupTgt, setSignupTgt] = useState('ta')
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')

  // ── Boot: check existing session ──
  useEffect(() => {
    ;(async () => {
      const fp = await getDeviceFingerprint()
      setDeviceFp(fp)

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await handleLoggedInUser(session.user, fp)
      } else {
        setScreen(S.HOME)
      }
    })()
  }, [])

  async function handleLoggedInUser(u, fp) {
    // Validate single-device
    const conflict = await checkSessionConflict(u.id, fp)
    if (conflict) {
      // This device was displaced → force logout
      await supabase.auth.signOut()
      setScreen(S.HOME)
      setErr('You were logged out because your account was used on another device.')
      return
    }
    await registerSession(u.id, fp)
    setUser(u)

    // Subscribe to real-time kick (other device takes over)
    if (kickChannelRef.current) kickChannelRef.current.unsubscribe()
    kickChannelRef.current = subscribeToSessionKick(u.id, fp, async () => {
      await supabase.auth.signOut()
      setUser(null)
      setScreen(S.HOME)
      setErr('Your session was taken over by another device. Please log in again.')
    })

    setScreen(S.PLAN_SELECT)
  }

  // ── Signup ──
  async function handleSignup() {
    setErr(''); setLoading(true)
    try {
      // Device trial check
      const used = await hasUsedTrial(deviceFp)
      if (used) {
        setErr('Trial already used on this device. Please contact us for Pro access.')
        return
      }

      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 7)

      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: {
            name, surname, phone,
            source_lang: signupSrc,
            target_lang: signupTgt,
            expiry_date: expiry.toISOString().split('T')[0],
            plan: 'trial',
          }
        }
      })
      if (error) { setErr(error.message); return }

      await markTrialUsed(deviceFp)
      // Auto login after signup
      await handleLogin(true)
    } finally {
      setLoading(false)
    }
  }

  // ── Login ──
  async function handleLogin(afterSignup = false) {
    if (!afterSignup) { setErr(''); setLoading(true) }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setErr(error.message); return }

      const u = data.user
      // Single-device enforcement: if another device is logged in, displace it
      const conflict = await checkSessionConflict(u.id, deviceFp)
      if (conflict) {
        // Displace old device by updating session row → Realtime will kick old device
        await registerSession(u.id, deviceFp)
      } else {
        await registerSession(u.id, deviceFp)
      }

      setUser(u)
      if (kickChannelRef.current) kickChannelRef.current.unsubscribe()
      kickChannelRef.current = subscribeToSessionKick(u.id, deviceFp, async () => {
        await supabase.auth.signOut()
        setUser(null)
        setScreen(S.HOME)
        setErr('Your session was taken over by another device. Please log in again.')
      })
      setScreen(S.PLAN_SELECT)
    } finally {
      if (!afterSignup) setLoading(false)
    }
  }

  // ── Logout ──
  async function handleLogout() {
    if (user) await clearSession(user.id)
    if (kickChannelRef.current) kickChannelRef.current.unsubscribe()
    await supabase.auth.signOut()
    setUser(null); setUserPlan(null)
    setEmail(''); setPassword('')
    setScreen(S.HOME)
  }

  // ── Choose plan (after login) ──
  function choosePlan(plan) {
    const meta = user?.user_metadata || {}
    if (plan === 'trial') {
      const exp = meta.expiry_date
      const todayStr = today()
      if (!exp || exp < todayStr) {
        setErr('Your trial has expired. Please contact us to upgrade to Pro.')
        return
      }
      setTrialLangs({ source: meta.source_lang || 'en', target: meta.target_lang || 'ta' })
      setUserPlan('trial')
      setScreen(S.APP)
    } else {
      setScreen(S.PRO_CONTACT)
    }
  }

  // ── Change password ──
  async function handleChangePw() {
    setErr(''); setLoading(true)
    try {
      if (newPw !== newPw2) { setErr('Passwords do not match.'); return }
      if (newPw.length < 6) { setErr('Password must be at least 6 characters.'); return }
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) { setErr(error.message); return }
      setNewPw(''); setNewPw2('')
      setScreen(S.PLAN_SELECT)
    } finally {
      setLoading(false)
    }
  }

  // ── If authenticated and plan chosen → render the main app ──
  if (screen === S.APP && user && userPlan) {
    const meta = user.user_metadata || {}
    const isPro = meta.plan === 'pro' || userPlan === 'pro'
    const exp = meta.expiry_date
    const dl = exp ? daysLeft(exp) : 0

    return children({
      user, isPro, trialLangs,
      onLogout: handleLogout,
      daysLeft: dl,
      expiry: exp,
      onChangePw: () => setScreen(S.CHANGE_PW),
    })
  }

  // ─── Screens ───────────────────────────────────────────────────────────────
  const PRO_MSG = `Hi! I'm interested in purchasing the Pro Version of TransApp.\n\nName: \nPlan: ₹200/month  OR  ₹2000/year\nEmail (registered): ${email || '(your email)'}\n\nPlease let me know the next steps. Thank you!`

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e8e8e8, #d0d0d0)',
      fontFamily: "'Space Grotesk', 'Inter', sans-serif",
      padding: 20,
    }}>
      {/* ── LOADING ── */}
      {screen === S.LOADING && (
        <p style={{ color: '#555', fontSize: 16 }}>Loading…</p>
      )}

      {/* ── HOME: Trial vs Pro ── */}
      {screen === S.HOME && (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28, fontWeight: 800,
            background: 'linear-gradient(135deg, #6d28d9, #0891b2)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}>Live Translator</h1>
          <p style={{ color: '#666', marginBottom: 36, fontSize: 14 }}>
            Any language. Real time. Nobody gets left behind.
          </p>

          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Trial card */}
            <Card>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🆓</div>
              <h2 style={{ color: '#333', fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Trial</h2>
              <p style={{ color: '#4CAF50', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>7 Days Free</p>
              <p style={{ color: '#666', fontSize: 12, margin: '0 0 16px', lineHeight: 1.5 }}>
                Your chosen languages only.<br />No transcript download.
              </p>
              <NButton color="linear-gradient(135deg,#34d399,#059669)" glow="rgba(5,150,105,0.6)"
                onClick={() => { setErr(''); setScreen(S.SIGNUP) }}>
                Start Free Trial
              </NButton>
              <NButton color="linear-gradient(135deg,#64748b,#334155)" glow="rgba(100,116,139,0.5)"
                onClick={() => { setErr(''); setScreen(S.LOGIN) }}>
                Already have account? Login
              </NButton>
              {err && <p style={{ color: 'red', fontSize: 11, marginTop: 8, padding: '0 10px' }}>{err}</p>}
            </Card>

            {/* Pro card */}
            <Card>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
              <h2 style={{ color: '#333', fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Pro Version</h2>
              <div style={{ margin: '4px 0 12px' }}>
                <p style={{ color: '#FF9800', fontWeight: 800, fontSize: 18, margin: '2px 0' }}>₹200 / month</p>
                <p style={{ color: '#888', fontSize: 11, margin: 0 }}>≈ $2 / month</p>
                <p style={{ color: '#FF9800', fontWeight: 800, fontSize: 18, margin: '8px 0 2px' }}>₹2000 / year</p>
                <p style={{ color: '#888', fontSize: 11, margin: 0 }}>≈ $20 / year</p>
                <div style={{
                  background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                  color: '#fff', fontWeight: 800, fontSize: 12,
                  borderRadius: 20, padding: '4px 14px', marginTop: 8, display: 'inline-block'
                }}>🎁 2 Months FREE on yearly plan</div>
              </div>
              <NButton color="linear-gradient(135deg,#f59e0b,#d97706)" glow="rgba(245,158,11,0.6)"
                onClick={() => setScreen(S.PRO_CONTACT)}>
                Contact Developer ⚡
              </NButton>
            </Card>
          </div>
        </div>
      )}

      {/* ── SIGNUP ── */}
      {screen === S.SIGNUP && (
        <Card>
          <h2 style={{ color: '#333', fontSize: 18, fontWeight: 800, margin: '0 0 12px' }}>Create Account</h2>
          <NInput placeholder="First Name *" value={name} onChange={e => setName(e.target.value)} />
          <NInput placeholder="Last Name *" value={surname} onChange={e => setSurname(e.target.value)} />
          <NInput type="email" placeholder="Email *" value={email} onChange={e => setEmail(e.target.value)} />
          <NInput type="password" placeholder="Password *" value={password} onChange={e => setPassword(e.target.value)} />
          <NInput placeholder="Phone Number *" value={phone} onChange={e => setPhone(e.target.value)} />
          <div style={{ width: '85%', textAlign: 'left', fontSize: 11, color: '#666', margin: '6px 0 2px', paddingLeft: 4 }}>
            🗣️ Speaker Language (Default)
          </div>
          <NSelect value={signupSrc} onChange={e => setSignupSrc(e.target.value)}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </NSelect>
          <div style={{ width: '85%', textAlign: 'left', fontSize: 11, color: '#666', margin: '6px 0 2px', paddingLeft: 4 }}>
            🌍 Subtitle Language (Default)
          </div>
          <NSelect value={signupTgt} onChange={e => setSignupTgt(e.target.value)}>
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </NSelect>
          {err && <p style={{ color: 'red', fontSize: 11, margin: '6px 0', padding: '0 10px' }}>{err}</p>}
          <NButton color="linear-gradient(135deg,#34d399,#059669)" glow="rgba(5,150,105,0.6)"
            onClick={handleSignup} disabled={loading}>
            {loading ? 'Creating…' : 'Sign Up for Trial'}
          </NButton>
          <NButton color="linear-gradient(135deg,#64748b,#334155)" glow="rgba(100,116,139,0.5)"
            onClick={() => { setErr(''); setScreen(S.HOME) }}>
            ← Back
          </NButton>
        </Card>
      )}

      {/* ── LOGIN ── */}
      {screen === S.LOGIN && (
        <Card>
          <h2 style={{ color: '#333', fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>Login</h2>
          <NInput type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <NInput type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          {err && <p style={{ color: 'red', fontSize: 11, margin: '6px 0', padding: '0 10px' }}>{err}</p>}
          <NButton color="linear-gradient(135deg,#6d28d9,#4f46e5)" glow="rgba(109,40,217,0.6)"
            onClick={() => handleLogin()} disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </NButton>
          <NButton color="linear-gradient(135deg,#64748b,#334155)" glow="rgba(100,116,139,0.5)"
            onClick={() => { setErr(''); setScreen(S.HOME) }}>
            ← Back
          </NButton>
        </Card>
      )}

      {/* ── PLAN SELECT (post-login) ── */}
      {screen === S.PLAN_SELECT && user && (() => {
        const meta = user.user_metadata || {}
        const exp = meta.expiry_date
        const dl = exp ? daysLeft(exp) : 0
        const expired = !exp || exp < today()
        const isPro = meta.plan === 'pro'
        return (
          <Card>
            <div style={{ fontSize: 32, marginBottom: 6 }}>✅</div>
            <h2 style={{ color: '#333', fontSize: 17, fontWeight: 800, margin: '0 0 4px' }}>
              Welcome, {meta.name || 'User'}!
            </h2>
            <p style={{ color: '#666', fontSize: 12, margin: '0 0 14px' }}>{user.email}</p>

            {isPro ? (
              <>
                <div style={{
                  background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                  color: '#fff', borderRadius: 20, padding: '6px 18px',
                  fontWeight: 800, fontSize: 13, marginBottom: 12
                }}>⚡ Pro — {dl > 0 ? `${dl} days left` : 'Expired'}</div>
                <NButton color="linear-gradient(135deg,#6d28d9,#4f46e5)" glow="rgba(109,40,217,0.6)"
                  onClick={() => { setUserPlan('pro'); setScreen(S.APP) }}>
                  Open App ▶
                </NButton>
              </>
            ) : (
              <>
                {expired
                  ? <p style={{ color: 'red', fontSize: 12, margin: '0 0 10px' }}>⚠️ Trial expired</p>
                  : <p style={{ color: '#059669', fontWeight: 700, fontSize: 13, margin: '0 0 10px' }}>
                      🕐 Trial: {dl} day{dl !== 1 ? 's' : ''} left
                    </p>
                }
                <NButton color="linear-gradient(135deg,#34d399,#059669)" glow="rgba(5,150,105,0.6)"
                  onClick={() => choosePlan('trial')} disabled={expired}>
                  Use Trial (7 Days)
                </NButton>
                <NButton color="linear-gradient(135deg,#f59e0b,#d97706)" glow="rgba(245,158,11,0.6)"
                  onClick={() => setScreen(S.PRO_CONTACT)}>
                  ⚡ Upgrade to Pro
                </NButton>
              </>
            )}
            {err && <p style={{ color: 'red', fontSize: 11, margin: '6px 0' }}>{err}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button onClick={() => setScreen(S.CHANGE_PW)}
                style={{ fontSize: 11, color: '#6d28d9', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Change password
              </button>
              <span style={{ color: '#aaa', fontSize: 11 }}>|</span>
              <button onClick={handleLogout}
                style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Logout
              </button>
            </div>
          </Card>
        )
      })()}

      {/* ── PRO CONTACT ── */}
      {screen === S.PRO_CONTACT && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(145deg,#f0f0f0,#cacaca)',
            boxShadow: '20px 20px 40px rgba(0,0,0,0.2),-14px -14px 28px rgba(255,255,255,0.9)',
            borderRadius: 32, padding: '36px 32px', width: 340, margin: '0 auto',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
            <h2 style={{ color: '#333', fontWeight: 800, margin: '0 0 4px' }}>Pro Version</h2>

            {/* Pricing */}
            <div style={{
              background: 'linear-gradient(135deg,#fff8e1,#fff3cd)',
              borderRadius: 16, padding: '14px 20px', margin: '12px 0 18px',
              border: '1px solid #f59e0b',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#555', fontWeight: 600, fontSize: 13 }}>📅 Monthly</span>
                <span>
                  <span style={{ color: '#d97706', fontWeight: 800, fontSize: 20 }}>₹200</span>
                  <span style={{ color: '#888', fontSize: 11 }}> / $2</span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#555', fontWeight: 600, fontSize: 13 }}>📆 Yearly</span>
                <span>
                  <span style={{ color: '#d97706', fontWeight: 800, fontSize: 20 }}>₹2000</span>
                  <span style={{ color: '#888', fontSize: 11 }}> / $20</span>
                </span>
              </div>
              <div style={{
                background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                color: '#fff', fontWeight: 800, fontSize: 12,
                borderRadius: 20, padding: '4px 14px', marginTop: 10, display: 'inline-block'
              }}>🎁 2 Months FREE on yearly plan</div>
            </div>

            {/* Pro features list */}
            <div style={{ textAlign: 'left', fontSize: 12, color: '#555', marginBottom: 16, lineHeight: 1.8 }}>
              <div>✅ All 19 languages (any pair)</div>
              <div>✅ Transcript PDF download</div>
              <div>✅ Float subtitles (PiP window)</div>
              <div>✅ Unlimited session time</div>
              <div>✅ Priority support</div>
              <div style={{ color: '#aaa', marginTop: 4 }}>❌ Trial: locked languages only</div>
              <div style={{ color: '#aaa' }}>❌ Trial: no transcript download</div>
            </div>

            <p style={{ color: '#666', fontSize: 12, marginBottom: 14 }}>
              Contact us to purchase. We'll activate your account within minutes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <PlatformBtn
                icon="💬" label="WhatsApp"
                color="linear-gradient(135deg,#25D366,#128C7E)"
                glow="rgba(37,211,102,0.6)"
                href={`https://wa.me/919489007005?text=`}
                draftMsg={PRO_MSG}
              />
              <PlatformBtn
                icon="✈️" label="Telegram"
                color="linear-gradient(135deg,#0088cc,#006699)"
                glow="rgba(0,136,204,0.6)"
                href={`https://t.me/priprix_official?text=`}
                draftMsg={PRO_MSG}
              />
              <PlatformBtn
                icon="📧" label="Email"
                color="linear-gradient(135deg,#ea4335,#c5221f)"
                glow="rgba(234,67,53,0.6)"
                href={`mailto:priprixtrader@gmail.com?subject=Pro Version Enquiry&body=`}
                draftMsg={PRO_MSG}
              />
            </div>

            <NButton color="linear-gradient(135deg,#64748b,#334155)" glow="rgba(100,116,139,0.5)"
              onClick={() => setScreen(user ? S.PLAN_SELECT : S.HOME)}>
              ← Back
            </NButton>
          </div>
        </div>
      )}

      {/* ── CHANGE PASSWORD ── */}
      {screen === S.CHANGE_PW && (
        <Card>
          <h2 style={{ color: '#333', fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>Change Password</h2>
          <NInput type="password" placeholder="New Password" value={newPw} onChange={e => setNewPw(e.target.value)} />
          <NInput type="password" placeholder="Confirm New Password" value={newPw2} onChange={e => setNewPw2(e.target.value)} />
          {err && <p style={{ color: 'red', fontSize: 11, margin: '6px 0' }}>{err}</p>}
          <NButton color="linear-gradient(135deg,#6d28d9,#4f46e5)" glow="rgba(109,40,217,0.6)"
            onClick={handleChangePw} disabled={loading}>
            {loading ? 'Saving…' : 'Update Password'}
          </NButton>
          <NButton color="linear-gradient(135deg,#64748b,#334155)" glow="rgba(100,116,139,0.5)"
            onClick={() => { setErr(''); setScreen(S.PLAN_SELECT) }}>
            ← Back
          </NButton>
        </Card>
      )}
    </div>
  )
}
