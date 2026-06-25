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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)', fontSize: '13px', letterSpacing: '0.1em' }}>
      LOADING...
    </div>
  )

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.greeting}>{greeting()}</p>
          <h1 style={s.date}>{format(new Date(), 'EEEE, d MMM')}</h1>
        </div>
        {latestBW && (
          <div style={s.bwChip}>
            <span style={s.bwNum}>{latestBW.weight_kg}</span>
            <span style={s.bwUnit}>kg</span>
          </div>
        )}
      </div>

      {/* Today's session card */}
      {todayLogs.length === 0 ? (
        <div style={s.emptySession}>
          <div style={s.emptyLeft}>
            <p style={s.emptyLabel}>Today's session</p>
            <p style={s.emptyTitle}>No workout yet</p>
            <p style={s.emptySub}>Start logging your sets</p>
          </div>
          <Link to="/log" style={s.startBtn}>Start</Link>
        </div>
      ) : (
        <div style={s.sessionCard}>
          <div style={s.sessionTop}>
            <p style={s.sessionLabel}>Today's session</p>
            <Link to="/log" style={s.addSetBtn}>+ Add set</Link>
          </div>
          <div style={s.sessionStats}>
            <div style={s.sStat}>
              <span style={s.sStatNum}>{todaySets}</span>
              <span style={s.sStatLabel}>sets</span>
            </div>
            <div style={s.sStatDiv} />
            <div style={s.sStat}>
              <span style={s.sStatNum}>{(todayVolume/1000).toFixed(1)}t</span>
              <span style={s.sStatLabel}>volume</span>
            </div>
            <div style={s.sStatDiv} />
            <div style={s.sStat}>
              <span style={s.sStatNum}>{todayExercises.length}</span>
              <span style={s.sStatLabel}>exercises</span>
            </div>
          </div>
          {todayExercises.map(ex => {
            const exSets = todayLogs.filter(l => l.exercise === ex)
            const maxWeight = Math.max(...exSets.map(l => l.weight_kg || 0))
            return (
              <div key={ex} style={s.exBlock}>
                <div style={s.exRow}>
                  <span style={s.exName}>{ex}</span>
                  <span style={s.exPR}>{maxWeight}kg</span>
                </div>
                {exSets.map((set, i) => (
                  <div key={set.id} style={s.setLine}>
                    <span style={s.setN}>S{set.set_number || i+1}</span>
                    <span style={s.setW}>{set.weight_kg}kg</span>
                    <span style={s.setX}>×</span>
                    <span style={s.setR}>{set.reps} reps</span>
                    <span style={{...s.setType, ...(set.set_type==='Top Set'?s.typeAccent:set.set_type==='Warmup'?s.typeBlue:{})}}>{set.set_type}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Week strip */}
      <div style={s.weekStrip}>
        {['M','T','W','T','F','S','S'].map((d, i) => {
          const dayOffset = i - (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
          const dayDate = new Date()
          dayDate.setDate(dayDate.getDate() + dayOffset)
          const dayStr = format(dayDate, 'yyyy-MM-dd')
          const hasLog = logs.some(l => l.date === dayStr)
          const isToday = dayStr === today
          return (
            <div key={i} style={{...s.weekDay, ...(isToday ? s.weekDayToday : {})}}>
              <span style={s.weekDayLabel}>{d}</span>
              <div style={{...s.weekDot, ...(hasLog ? s.weekDotActive : {}), ...(isToday ? s.weekDotToday : {})}} />
            </div>
          )
        })}
      </div>

      {/* Stats grid */}
      <div style={s.statsGrid}>
        <div style={s.statBig}>
          <p style={s.statBigNum}>{thisWeekDates.length}</p>
          <p style={s.statBigLabel}>Sessions this week</p>
        </div>
        <div style={s.statBig}>
          <p style={s.statBigNum}>{uniqueDates.length}</p>
          <p style={s.statBigLabel}>Total sessions</p>
        </div>
        <div style={{...s.statBig, ...s.statWide}}>
          <p style={s.statBigNum}>{(totalVolume/1000).toFixed(1)}<span style={s.statUnit}>t</span></p>
          <p style={s.statBigLabel}>Total volume lifted</p>
        </div>
        <div style={s.statBig}>
          <p style={s.statBigNum}>{logs.length}</p>
          <p style={s.statBigLabel}>Total sets</p>
        </div>
      </div>

    </div>
  )
}

const s = {
  page: { maxWidth: '480px', margin: '0 auto', paddingBottom: '1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' },
  greeting: { fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '2px' },
  date: { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' },
  bwChip: { background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center', display: 'flex', alignItems: 'baseline', gap: '4px' },
  bwNum: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: 'var(--accent)' },
  bwUnit: { fontSize: '12px', color: 'var(--accent)', opacity: 0.8 },

  emptySession: { background: '#111118', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
  emptyLeft: {},
  emptyLabel: { fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '4px' },
  emptySub: { fontSize: '13px', color: 'var(--text-secondary)' },
  startBtn: { background: 'var(--accent)', color: '#05050a', fontWeight: 800, fontFamily: 'var(--font-display)', padding: '12px 22px', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: '14px', boxShadow: '0 0 20px rgba(168,255,80,0.25)', whiteSpace: 'nowrap' },

  sessionCard: { background: '#111118', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
  sessionTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sessionLabel: { fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' },
  addSetBtn: { background: 'var(--accent)', color: '#05050a', fontWeight: 700, fontSize: '12px', padding: '6px 14px', borderRadius: '8px', textDecoration: 'none', fontFamily: 'var(--font-display)' },
  sessionStats: { display: 'flex', alignItems: 'center', gap: '0', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '14px 0' },
  sStat: { flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2px' },
  sStatNum: { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 },
  sStatLabel: { fontSize: '11px', color: 'var(--text-secondary)' },
  sStatDiv: { width: '1px', background: 'var(--border)', alignSelf: 'stretch' },
  exBlock: { borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' },
  exRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  exName: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px' },
  exPR: { fontSize: '13px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 10px', borderRadius: '6px' },
  setLine: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginBottom: '5px' },
  setN: { color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, minWidth: '22px' },
  setW: { fontWeight: 600, color: 'var(--text-primary)' },
  setX: { color: 'var(--text-muted)' },
  setR: { flex: 1, color: 'var(--text-secondary)' },
  setType: { fontSize: '10px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '5px', fontWeight: 500 },
  typeAccent: { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-accent)' },
  typeBlue: { background: 'var(--blue-dim)', color: 'var(--blue)' },

  weekStrip: { display: 'flex', background: '#111118', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px', marginBottom: '1rem', justifyContent: 'space-between' },
  weekDay: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  weekDayToday: {},
  weekDayLabel: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 },
  weekDot: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)' },
  weekDotActive: { background: 'var(--accent)', border: 'none', boxShadow: '0 0 8px rgba(168,255,80,0.4)' },
  weekDotToday: { border: '1px solid var(--accent)' },

  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  statBig: { background: '#111118', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' },
  statWide: { gridColumn: 'span 2' },
  statBigNum: { fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '4px' },
  statUnit: { fontSize: '20px', fontWeight: 500 },
  statBigLabel: { fontSize: '12px', color: 'var(--text-secondary)' },
}
