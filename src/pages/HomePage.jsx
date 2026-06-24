import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { getLogs, getBodyweights } from '../lib/supabase'
import { format, isToday, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

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
      <div style={s.greetRow}>
        <div>
          <p style={s.greet}>{greeting()}</p>
          <h1 style={s.title}>{format(new Date(), 'EEEE, d MMM')}</h1>
        </div>
        {latestBW && (
          <div style={s.bwPill}>
            <span style={s.bwNum}>{latestBW.weight_kg}</span>
            <span style={s.bwUnit}>kg</span>
          </div>
        )}
      </div>

      {/* Today's workout */}
      <section style={s.section}>
        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>Today's session</h2>
          <Link to="/log" style={s.logBtn}>+ Log set</Link>
        </div>

        {todayLogs.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyTitle}>No sets logged yet today</p>
            <p style={s.emptySub}>Hit the gym and log your first set.</p>
            <Link to="/log" style={s.bigLogBtn}>Start logging</Link>
          </div>
        ) : (
          <div>
            <div style={s.statsRow}>
              <div style={s.statCard}>
                <p style={s.statNum}>{todaySets}</p>
                <p style={s.statLabel}>Sets</p>
              </div>
              <div style={s.statCard}>
                <p style={s.statNum}>{todayVolume.toLocaleString()}</p>
                <p style={s.statLabel}>Volume (kg)</p>
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
                  <div style={s.setRow}>
                    {exSets.map((set, i) => (
                      <div key={set.id} style={s.setPill}>
                        <span style={s.setNum}>S{set.set_number || i + 1}</span>
                        <span style={s.setData}>{set.weight_kg}kg × {set.reps}</span>
                        <span style={{ ...s.setType, ...(set.set_type === 'Top Set' ? s.topSet : set.set_type === 'Warmup' ? s.warmup : {}) }}>{set.set_type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Weekly + All time stats */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Overview</h2>
        <div style={s.overviewGrid}>
          <div style={s.overCard}>
            <p style={s.overNum}>{thisWeekDates.length}</p>
            <p style={s.overLabel}>Sessions this week</p>
          </div>
          <div style={s.overCard}>
            <p style={s.overNum}>{uniqueDates.length}</p>
            <p style={s.overLabel}>Total sessions</p>
          </div>
          <div style={s.overCard}>
            <p style={s.overNum}>{(totalVolume / 1000).toFixed(1)}t</p>
            <p style={s.overLabel}>Total volume</p>
          </div>
          <div style={s.overCard}>
            <p style={s.overNum}>{logs.length}</p>
            <p style={s.overLabel}>Total sets</p>
          </div>
        </div>
      </section>
    </div>
  )
}

const s = {
  page: { maxWidth: '600px', margin: '0 auto' },
  loading: { color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' },
  greetRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' },
  greet: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '2px' },
  title: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' },
  bwPill: { background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center' },
  bwNum: { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', display: 'block' },
  bwUnit: { fontSize: '11px', color: 'var(--accent)', opacity: 0.7 },
  section: { marginBottom: '1.5rem' },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  logBtn: { background: 'var(--accent)', color: '#0a0a0b', fontWeight: 700, fontSize: '13px', padding: '7px 14px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontFamily: 'var(--font-display)' },
  empty: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginBottom: '6px' },
  emptySub: { color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '1.25rem' },
  bigLogBtn: { display: 'inline-block', background: 'var(--accent)', color: '#0a0a0b', fontWeight: 700, fontFamily: 'var(--font-display)', padding: '12px 24px', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: '14px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1rem' },
  statCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' },
  statNum: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--accent)' },
  statLabel: { fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' },
  exCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '8px' },
  exHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  exName: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px' },
  exMax: { fontSize: '13px', color: 'var(--accent)', fontWeight: 600 },
  setRow: { display: 'flex', flexDirection: 'column', gap: '6px' },
  setPill: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  setNum: { color: 'var(--text-muted)', minWidth: '24px', fontWeight: 600 },
  setData: { color: 'var(--text-primary)', fontWeight: 500, flex: 1 },
  setType: { fontSize: '11px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' },
  topSet: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  warmup: { background: 'var(--blue-dim)', color: 'var(--blue)' },
  overviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' },
  overCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px' },
  overNum: { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' },
  overLabel: { fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' },
}
