import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/supabase'
import { useAuth } from './AuthProvider'

const navItems = [
  { to: '/', label: 'Home', icon: '⚡' },
  { to: '/log', label: 'Log', icon: '➕' },
  { to: '/history', label: 'History', icon: '📅' },
  { to: '/prs', label: 'PRs', icon: '🏆' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/muscles', label: 'Muscles', icon: '💪' },
  { to: '/bodyweight', label: 'Weight', icon: '⚖️' }
  { to: '/plans', label: 'Plans', icon: '📋' },
]

export default function Layout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div style={s.root}>
      {/* Top bar */}
      <header style={s.header}>
        <span style={s.logo}>Ascéon<span style={{ color: 'var(--accent)' }}></span></span>
        <div style={s.headerRight}>
          <span style={s.email}>{user?.email}</span>
          <button style={s.signOut} onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      {/* Main content */}
      <main style={s.main}>
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav style={s.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
          >
            <span style={s.navIcon}>{item.icon}</span>
            <span style={s.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', height: '52px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 },
  logo: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', letterSpacing: '-0.01em', color: 'var(--text-primary)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  email: { fontSize: '12px', color: 'var(--text-muted)', display: 'none' },
  signOut: { fontSize: '12px', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  main: { flex: 1, overflowY: 'auto', padding: '1.25rem', paddingBottom: '80px' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', height: '64px', zIndex: 100 },
  navItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', textDecoration: 'none', color: 'var(--text-muted)', transition: 'color 0.15s' },
  navActive: { color: 'var(--accent)' },
  navIcon: { fontSize: '18px', lineHeight: 1 },
  navLabel: { fontSize: '10px', fontWeight: 500, letterSpacing: '0.04em' },
}
