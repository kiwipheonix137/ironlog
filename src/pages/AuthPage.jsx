import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../lib/supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else navigate('/')
    } else {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setSuccess('Account created! Check your email to confirm, then log in.')
    }
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <span style={s.logoText}>IRON</span>
          <span style={s.logoAccent}>LOG</span>
        </div>
        <p style={s.sub}>Track every rep. Own every PR.</p>

        <div style={s.tabs}>
          <button style={mode === 'login' ? s.tabActive : s.tab} onClick={() => setMode('login')}>Log in</button>
          <button style={mode === 'signup' ? s.tabActive : s.tab} onClick={() => setMode('signup')}>Sign up</button>
        </div>

        <form onSubmit={handle} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {error && <p style={s.error}>{error}</p>}
          {success && <p style={s.successMsg}>{success}</p>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '1rem' },
  card: { width: '100%', maxWidth: '400px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem 2rem' },
  logo: { textAlign: 'center', marginBottom: '0.5rem' },
  logoText: { fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  logoAccent: { fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' },
  sub: { textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '2rem' },
  tabs: { display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: '1.5rem', gap: '4px' },
  tab: { flex: 1, padding: '8px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-body)' },
  tabActive: { flex: 1, padding: '8px', border: 'none', background: 'var(--bg-hover)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 500 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' },
  input: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none' },
  error: { color: 'var(--red)', fontSize: '13px', background: 'var(--red-dim)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' },
  successMsg: { color: 'var(--accent)', fontSize: '13px', background: 'var(--accent-dim)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' },
  btn: { background: 'var(--accent)', color: '#0a0a0b', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '15px', border: 'none', borderRadius: 'var(--radius-md)', padding: '14px', cursor: 'pointer', letterSpacing: '0.02em' },
}
