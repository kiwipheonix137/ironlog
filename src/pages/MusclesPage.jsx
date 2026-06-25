import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import { getLogs } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { subDays, subMonths, subYears, parseISO, isAfter } from 'date-fns'

const MUSCLE_COLORS = {
  Chest: '#c8f135', Legs: '#4d9fff', Back: '#a855f7',
  Shoulders: '#ff8c42', Biceps: '#ff4d4d', Triceps: '#1dd1a1', Other: '#8a8a96'
}

const TIME_FILTERS = [
  { label: '1W', days: 7 },
  { label: '2W', days: 14 },
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', years: 1 },
  { label: 'All', all: true },
]

export default function MusclesPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('1M')
  const [metric, setMetric] = useState('sets')

  useEffect(() => {
    if (!user) return
    getLogs(user.id).then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [user])

  const getStartDate = () => {
    const f = TIME_FILTERS.find(t => t.label === filter)
    if (f.all) return null
    if (f.days) return subDays(new Date(), f.days)
    if (f.months) return subMonths(new Date(), f.months)
    if (f.years) return subYears(new Date(), f.years)
  }

  const startDate = getStartDate()
  const filtered = logs.filter(l => {
    if (!startDate) return true
    try { return isAfter(parseISO(l.date), startDate) } catch { return false }
  })

  const muscleData = filtered.reduce((acc, l) => {
    const m = l.muscle_group || 'Other'
    if (!acc[m]) acc[m] = { muscle: m, sets: 0, volume: 0, sessions: new Set() }
    acc[m].sets++
    acc[m].volume += (l.volume || 0)
    acc[m].sessions.add(l.date)
    return acc
  }, {})

  const chartData = Object.values(muscleData)
    .map(d => ({ ...d, sessions: d.sessions.size }))
    .sort((a, b) => b[metric] - a[metric])

  const totalSets = filtered.length
  const uniqueDates = [...new Set(filtered.map(l => l.date))].length

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px' }}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>{d.muscle}</p>
        <p style={{ color: 'var(--text-secondary)' }}>Sets: {d.sets}</p>
        <p style={{ color: 'var(--text-secondary)' }}>Volume: {d.volume?.toLocaleString()} kg</p>
        <p style={{ color: 'var(--text-secondary)' }}>Sessions: {d.sessions}</p>
      </div>
    )
  }

  if (loading) return <div style={s.loading}>Loading...</div>

  return (
    <div style={s.page}>
      <h1 style={s.title}>Muscle tracker</h1>

      <div style={s.timeRow}>
        {TIME_FILTERS.map(f => (
          <button key={f.label} style={filter === f.label ? s.timeActive : s.timeBtn}
            onClick={() => setFilter(f.label)}>{f.label}</button>
        ))}
      </div>

      <div style={s.metricRow}>
        <button style={metric === 'sets' ? s.metricActive : s.metricBtn} onClick={() => setMetric('sets')}>Sets</button>
        <button style={metric === 'volume' ? s.metricActive : s.metricBtn} onClick={() => setMetric('volume')}>Volume</button>
        <button style={metric === 'sessions' ? s.metricActive : s.metricBtn} onClick={() => setMetric('sessions')}>Sessions</button>
      </div>

      <div style={s.summaryRow}>
        <div style={s.summaryCard}>
          <p style={s.summaryNum}>{totalSets}</p>
          <p style={s.summaryLabel}>Total sets</p>
        </div>
        <div style={s.summaryCard}>
          <p style={s.summaryNum}>{uniqueDates}</p>
          <p style={s.summaryLabel}>Sessions</p>
        </div>
        <div style={s.summaryCard}>
          <p style={s.summaryNum}>{chartData.length}</p>
          <p style={s.summaryLabel}>Muscles hit</p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div style={s.chartCard}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="muscle" tick={{ fill: '#8a8a96', fontSize: 12 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
                {chartData.map(entry => (
                  <Cell key={entry.muscle} fill={MUSCLE_COLORS[entry.muscle] || '#8a8a96'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={s.empty}>No data for this period — log some workouts!</div>
      )}

      <div style={s.breakdown}>
        {chartData.map(d => (
          <div key={d.muscle} style={s.muscleRow}>
            <div style={s.muscleLeft}>
              <span style={{ ...s.dot, background: MUSCLE_COLORS[d.muscle] || '#8a8a96' }} />
              <span style={s.muscleName}>{d.muscle}</span>
            </div>
            <div style={s.muscleRight}>
              <span style={s.muscleVal}>{d.sets} sets</span>
              <span style={s.muscleSep}>·</span>
              <span style={s.muscleVol}>{(d.volume/1000).toFixed(1)}t</span>
              <span style={s.muscleSep}>·</span>
              <span style={s.muscleSess}>{d.sessions} sessions</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  page: { maxWidth: '600px', margin: '0 auto' },
  loading: { color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' },
  title: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '1rem' },
  timeRow: { display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' },
  timeBtn: { padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  timeActive: { padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--accent-glow)', background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 },
  metricRow: { display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: '1rem', gap: '4px' },
  metricBtn: { flex: 1, padding: '8px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' },
  metricActive: { flex: 1, padding: '8px', border: 'none', background: 'var(--bg-hover)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 500 },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '1rem' },
  summaryCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px', textAlign: 'center' },
  summaryNum: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--accent)' },
  summaryLabel: { fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' },
  chartCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '1rem' },
  empty: { textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '1rem' },
  breakdown: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '1px' },
  muscleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' },
  muscleLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  muscleName: { fontWeight: 500, fontSize: '14px' },
  muscleRight: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' },
  muscleVal: { color: 'var(--accent)', fontWeight: 600 },
  muscleSep: { color: 'var(--text-muted)' },
  muscleVol: {},
  muscleSess: {},
}
