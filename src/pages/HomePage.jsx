import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { getLogs, getBodyweights } from '../lib/supabase'
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

export default function HomePage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [bodyweights, setBodyweights] = useState([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return
    Promise.all([getLogs(user.id), getBodyweights(user.id)]).then(([l, b]) => {
      setLogs(l.data || [])
      setBodyweights(b.data || [])
      setLoading(false)
    })
  }, [user])

  const todayLogs = logs.filter(l => l.date === today)
  const uniqueDates = [...new Set(logs.map(l => l.date))]
  const thisWeekDates = uniqueDates.filter(d => {
    try { return isWithinInterval(parseISO(d), { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }) } catch { return false }
  })
  const totalVolume = logs.reduce((sum, l) => sum + (l.volume || 0), 0)
  const latestBW = bodyweights.length ? bodyweights[bodyweights.length - 1] : null
  const todaySets = todayLogs.length
  const todayVolume = todayLogs.reduce((sum, l) => sum + (l.volume || 0), 0)
  const todayExercises = [...new Set(todayLogs.map(l => l.exercise))]

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) return <div style={s.loading}>Loading...</div>

  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroGlow} />
        <div style={s.heroContent}>
          <p style={s.greeting}>{greeting()}</p>
          <h1 style={s.date}>{format(new Date(), 'EEEE, d MMM')}</h1>
          {latestBW && (
            <div style={s.bwBadge}>
              <span style={s.bwNum}>{latestBW.weight_kg}kg</span>
              <span style={s.bwLabel}>current weight</span>
            </div>
          )}
        </div>
      </div>

      {/* Today's session */}
      <div style={s.sectionHead}>
        <span style={s.sectionLabel}>Today's session</span>
        <Link to="/log" style={s.logBtn}>+ Log set</Link>
      </div>

      {todayLogs.length === 0 ? (
        <div style={s.emptyCard}>
          <div style={s.emptyIcon}>🏋️</div>
          <p style={s.emptyTitle}>No sets logged yet</p>
          <p style={s.emptySub}>Hit the gym and start tracking.</p>
          <Link to="/log" style={s.startBtn}>Start session</Link>
        </div>
      ) : (
        <div>
          <div style={s.statsRow}>
            <div style={s.statCard}>
              <p style={s.statNum}>{todaySets}</p>
              <p style={s.statLabel}>Sets</p>
            </div>
            <div style={s.statCard}>
              <p style={s.statNum}>{(todayVolume/1000).toFixed(1)}t</p>
              <p style={s.statLabel}>Volume</p>
            </div>
            <div style={s.statCard}>
              <p style={s.statNum}>{todayExercises.length}</p>
              <p style={s.statLabel}>Exercises</p>
            </div>
          </div>
          {todayExercises.map(ex => {
            const exSets = todayLogs.filter(l => l.exercise === ex)
            const maxWeight = Math.max(...exSets.map(l => l.weight_kg || 0))
            return (
              <div key={ex} style={s.exCard}>
                <div style={s.exHeader}>
                  <span style={s.exName}>{ex}</span>
                  <span style={s.exMax}>{maxWeight}kg</span>
                </div>
                <div style={s.setsList}>
                  {exSets.map((set, i) => (
                    <div key={set.id} style={s.setRow}>
                      <span style={s.setNum}>S{set.set_number || i+1}</span>
                      <span style={s.setData}>{set.weight_kg}kg × {set.reps}</span>
                      <span style={{
                        ...s.setTag,
                        ...(set.set_type === 'Top Set' ? s.tagAccent : set.set_type === 'Warmup' ? s.tagBlue : {})
                      }}>{set.set_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Overview stats */}
      <div style={s.sectionHead}>
        <span style={s.sectionLabel}>All time</span>
      </div>
      <div style={s.overGrid}>
        <div style={s.overCard}>
          <p style={s.overNum}>{thisWeekDates.length}</p>
          <p style={s.overLabel}>Sessions this week</p>
        </div>
        <div style={s.overCard}>
          <p style={s.overNum}>{uniqueDates.length}</p>
          <p style={s.overLabel}>Total sessions</p>
        </div>
        <div style={s.overCard}>
          <p style={s.overNum}>{(totalVolume/1000).toFixed(1)}t</p>
          <p style={s.overLabel}>Total volume</p>
        </div>
        <div style={s.overCard}>
          <p style={s.overNum}>{logs.length}</p>
          <p style={s.overLabel}>Total sets</p>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { maxWidth: '520px', margin: '0 auto' },
  loading: { color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' },
  hero: { position: 'relative', background: 'linear-gradient(135deg, #0f0f12 0%, #131318 100%)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.75rem', marginBottom: '1.25rem', overflow: 'hidden' },
  heroGlow: { position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(200,241,53,0.08) 0%, transparent 70%)', pointerEvents: 'none' },
  heroContent: { position: 'relative' },
  greeting: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' },
  date: { fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '12px' },
  bwBadge: { display: 'inline-flex', alignItems: 'baseline', gap: '6px', background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: '10px', padding: '6px 12px' },
  bwNum: { fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--accent)' },
  bwLabel: { fontSize: '11px', color: 'var(--accent)', opacity: 0.7 },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  sectionLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  logBtn: { background: 'var(--accent)', color: '#080809', fontWeight: 700, fontSize: '12px', padding: '7px 14px', borderRadius: '8px', textDecoration: 'none', fontFamily: 'var(--font-display)', letterSpacing: '0.01em' },
  emptyCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem 1.5rem', textAlign: 'center', marginBottom: '1.25rem', boxShadow: 'var(--shadow-card)' },
  emptyIcon: { fontSize: '36px', marginBottom: '12px' },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 600, marginBottom: '6px' },
  emptySub: { color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '1.25rem' },
  startBtn: { display: 'inline-block', background: 'var(--accent)', color: '#080809', fontWeight: 700, fontFamily: 'var(--font-display)', padding: '11px 24px', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: '14px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '10px' },
  statCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 10px', textAlign: 'center', boxShadow: 'var(--shadow-card)' },
  statNum: { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 },
  statLabel: { fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' },
  exCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '8px', boxShadow: 'var(--shadow-card)' },
  exHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  exName: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px' },
  exMax: { fontSize: '13px', color: 'var(--accent)', fontWeight: 600, background: 'var(--accent-dim)', padding: '3px 10px', borderRadius: '6px' },
  setsList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  setRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  setNum: { color: 'var(--text-muted)', minWidth: '26px', fontWeight: 600, fontSize: '11px' },
  setData: { flex: 1, fontWeight: 500 },
  setTag: { fontSize: '10px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '5px', fontWeight: 500 },
  tagAccent: { background: 'var(--accent-dim)', color: 'var(--accent-text)' },
  tagBlue: { background: 'var(--blue-dim)', color: 'var(--blue)' },
  overGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '8px', marginBottom: '1.25rem' },
  overCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', boxShadow: 'var(--shadow-card)' },
  overNum: { fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  overLabel: { fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' },
}
