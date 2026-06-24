import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import { getLogs } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

export default function PRPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (!user) return
    getLogs(user.id).then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [user])

  const exercises = [...new Set(logs.map(l => l.exercise))].sort()

  const getPR = (exercise) => {
    const exLogs = logs.filter(l => l.exercise === exercise)
    if (!exLogs.length) return null
    const bestWeight = Math.max(...exLogs.map(l => l.weight_kg || 0))
    const bestVol = Math.max(...exLogs.map(l => l.volume || 0))
    const prLog = exLogs.find(l => l.weight_kg === bestWeight)
    const volLog = exLogs.find(l => l.volume === bestVol)
    return {
      exercise,
      bestWeight,
      repsAtBest: prLog?.reps,
      bestVolume: bestVol,
      prDate: prLog?.date,
      muscle: prLog?.muscle_group || 'Other',
      totalSets: exLogs.length,
    }
  }

  const prs = exercises.map(getPR).filter(Boolean)
    .filter(pr => !filter || pr.muscle === filter)
    .sort((a, b) => b.bestWeight - a.bestWeight)

  const muscles = [...new Set(prs.map(p => p.muscle))].sort()

  if (loading) return <div style={s.loading}>Loading...</div>

  return (
    <div style={s.page}>
      <h1 style={s.title}>Personal records</h1>
      <p style={s.sub}>{prs.length} exercises tracked</p>

      <div style={s.filterRow}>
        <button style={!filter ? s.filterActive : s.filterBtn} onClick={() => setFilter('')}>All</button>
        {muscles.map(m => (
          <button key={m} style={filter === m ? s.filterActive : s.filterBtn} onClick={() => setFilter(m)}>{m}</button>
        ))}
      </div>

      {prs.length === 0 ? (
        <div style={s.empty}><p>No PRs yet — start logging!</p></div>
      ) : (
        <div style={s.grid}>
          {prs.map(pr => (
            <div key={pr.exercise} style={s.card}>
              <div style={s.cardHeader}>
                <div>
                  <p style={s.exName}>{pr.exercise}</p>
                  <span style={s.muscleTag}>{pr.muscle}</span>
                </div>
                <div style={s.prBadge}>
                  <span style={s.prNum}>{pr.bestWeight}</span>
                  <span style={s.prUnit}>kg</span>
                </div>
              </div>
              <div style={s.cardStats}>
                <div style={s.stat}>
                  <p style={s.statVal}>{pr.repsAtBest}</p>
                  <p style={s.statLbl}>reps at PR</p>
                </div>
                <div style={s.stat}>
                  <p style={s.statVal}>{pr.bestVolume?.toLocaleString()}</p>
                  <p style={s.statLbl}>best vol set</p>
                </div>
                <div style={s.stat}>
                  <p style={s.statVal}>{pr.totalSets}</p>
                  <p style={s.statLbl}>total sets</p>
                </div>
              </div>
              {pr.prDate && (
                <p style={s.prDate}>PR set {format(parseISO(pr.prDate), 'd MMM yyyy')}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth: '600px', margin: '0 auto' },
  loading: { color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' },
  title: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '4px' },
  sub: { color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '1rem' },
  filterRow: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.25rem' },
  filterBtn: { padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  filterActive: { padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--accent-glow)', background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 },
  empty: { textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' },
  grid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' },
  exName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', marginBottom: '6px' },
  muscleTag: { fontSize: '11px', color: 'var(--purple)', background: 'var(--purple-dim)', padding: '2px 8px', borderRadius: '4px' },
  prBadge: { background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center' },
  prNum: { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: 'var(--accent)', display: 'block', lineHeight: 1 },
  prUnit: { fontSize: '11px', color: 'var(--accent)', opacity: 0.7 },
  cardStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' },
  stat: { background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '8px', textAlign: 'center' },
  statVal: { fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' },
  statLbl: { fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' },
  prDate: { fontSize: '11px', color: 'var(--text-muted)' },
}
