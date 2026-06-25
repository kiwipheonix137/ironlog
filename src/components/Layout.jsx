import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/supabase'
import { useAuth } from './AuthProvider'

const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/log', label: 'Log', icon: LogIcon },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/prs', label: 'PRs', icon: PRIcon },
  { to: '/progress', label: 'Progress', icon: ProgressIcon },
  { to: '/muscles', label: 'Muscles', icon: MuscleIcon },
  { to: '/bodyweight', label: 'Weight', icon: WeightIcon },
  { to: '/plans', label: 'Plans', icon: PlansIcon },
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
      <header style={s.header}>
        <span style={s.logo}>Ascéon</span>
        <button style={s.signOut} onClick={handleSignOut}>Sign out</button>
      </header>

      <main style={s.main}>
        <Outlet />
      </main>

      <nav style={s.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
          >
            {({ isActive }) => (
              <>
                <item.icon active={isActive} />
                <span style={{ ...s.navLabel, ...(isActive ? s.navLabelActive : {}) }}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function HomeIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#c8f135' : 'none'} stroke={active ? '#c8f135' : '#7a7a88'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
}
function LogIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#c8f135' : '#7a7a88'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
}
function HistoryIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#c8f135' : '#7a7a88'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="12,8 12,12 14,14"/><path d="M3.05 11a9 9 0 1 0 .5-4.5"/><polyline points="3,3 3,7 7,7"/></svg>
}
function PRIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#c8f135' : '#7a7a88'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
}
function ProgressIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#c8f135' : '#7a7a88'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
}
function MuscleIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#c8f135' : '#7a7a88'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5a5 5 0 0 1 7.07 0L17 10l-1.5 1.5-3-3a3 3 0 0 0-4.24 4.24l3 3L9.75 17 6.5 13.76a5 5 0 0 1 0-7.07z"/><path d="M17.5 17.5a5 5 0 0 1-7.07 0L7 14l1.5-1.5 3 3a3 3 0 0 0 4.24-4.24l-3-3L14.25 7l3.25 3.25a5 5 0 0 1 0 7.07z"/></svg>
}
function WeightIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#c8f135' : '#7a7a88'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/><path d="M4.93 4.93l2.12 2.12m9.9 9.9 2.12 2.12M4.93 19.07l2.12-2.12m9.9-9.9 2.12-2.12"/></svg>
}
function PlansIcon({ active }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#c8f135' : '#7a7a88'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
}

const s = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem', height: '52px', borderBottom: '1px solid var(--border)', background: 'rgba(8,8,9,0.8)', backdropFilter: 'blur(20px)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50 },
  logo: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #f2f2f4 0%, #c8f135 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  signOut: { fontSize: '12px', color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' },
  main: { flex: 1, overflowY: 'auto', padding: '1.25rem 1rem', paddingBottom: '80px' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', background: 'rgba(8,8,9,0.95)', borderTop: '1px solid var(--border)', height: '64px', zIndex: 100, backdropFilter: 'blur(20px)' },
  navItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none', color: 'var(--text-muted)', transition: 'all 0.15s', minWidth: 0 },
  navActive: { color: 'var(--accent)' },
  navLabel: { fontSize: '9px', fontWeight: 500, letterSpacing: '0.03em', color: 'var(--text-muted)', whiteSpace: 'nowrap' },
  navLabelActive: { color: 'var(--accent)' },
}
