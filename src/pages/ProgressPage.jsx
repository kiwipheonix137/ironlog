import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import { getLogs } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { format, parseISO } from 'date-fns'

const MUSCLE_COLORS = {
  Chest: '#c8f135', Legs: '#4d9fff', Back: '#a855f7',
  Shoulders: '#ff8c42', Biceps: '#ff4d4d', Triceps: '#1dd1a1', Other: '#8a8a96'
}

const SET_TYPES = ['All', 'Warmup', 'Top Set', 'Back Off Set', 'Myo Reps', 'Failure Set', 'Drop Set']

export default function ProgressPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [exercise, setExercise] = useState('')
  const [setType, setSetType] = useState('All')

  useEffect(() => {
    if (!user) return
    getLogs(user.id).then(({ data }) => {
      setLogs(data || [])
      setLoading(false)
    })
  }, [user])

  const exercises = [...new Set(logs.map(l => l.exercise))].sort()

  // Weight/volume progression
  const filteredLogs = logs
    .filter(l => (!exercise || l.exercise === exercise) && (setType === 'All' || l.set_type === setType))

  const byDate = {}
  filteredLogs.forEach(l => {
    if (!byDate[l.date]) byDate[l.date] = { date: l.date, maxWeight: 0, maxVolume: 0, totalVolume: 0 }
    byDate[l.date].maxWeight = Math.max(byDate[l.date].maxWeight, l.weight_kg || 0)
    byDate[l.date].maxVolume = Math.max(byDate[l.date].maxVolume, l.volume || 0)
    byDate[l.date].totalVolume += (l.volume || 0)
  })

  const chartData = Object.values(byDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ ...d, label: format(parseISO(d.date), 'd MMM') }))

  // Muscle group breakdown
  const muscleData = logs.reduce((acc, l) => {
    const m = l.muscle_group || 'Other'
    if (!acc[m]) acc[m] = { muscle: m, sets: 0, volume: 0 }
    acc[m].sets++
    acc[m].volume += (l.volume || 0)
    return acc
  }, {})
  const muscleChartData = Object.values(muscleData).sort((a, b) => b.sets - a.sets)

  const minWeight = chartData.length ? Math.floor(Math.min(...chartData.map(d => d.maxWeight)) * 0.95) : 0
  const minVolume = chartData.length ? Math.floor(Math.min(...chartData.map(d => d.maxVolume)) * 0.9) : 0

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
        {payload.map(p => <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value?.toLocaleString()}</p>)}
      </div>
    )
  }

  if (loading) return <div style={s.loading}>Loading...</div>

  return (
    <div style={s.page}>
      <h1 style={s.title}>Progress</h1>

      {/* Filters */}
      <div style={s.filters}>
        <select value={exercise} onChange={e => setExercise(e.target.value)} style={s.select}>
          <option value="">All exercises</option>
          {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
        </select>
        <select value={setType} onChange={e => setSetType(e.target.value)} style={s.select}>
          {SET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {chartData.length > 0 ? (
        <>
          {/* Max Weight chart */}
          <div style={s.chartCard}>
            <h2 style={s.chartTitle}>Max weight per session</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[minWeight, 'auto']} tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="maxWeight" name="Max weight (kg)" stroke="#c8f135" strokeWidth={2} dot={{ fill: '#c8f135', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Max Volume chart */}
          <div style={s.chartCard}>
            <h2 style={s.chartTitle}>Max set volume per session</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[minVolume, 'auto']} tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="maxVolume" name="Max volume (kg)" stroke="#4d9fff" strokeWidth={2} dot={{ fill: '#4d9fff', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Total session volume */}
          <div style={s.chartCard}>
            <h2 style={s.chartTitle}>Total session volume</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="totalVolume" name="Total volume (kg)" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div style={s.empty}><p>No data for selected filters — log some workouts!</p></div>
      )}

      {/* Muscle group breakdown */}
      {muscleChartData.length > 0 && (
        <div style={s.chartCard}>
          <h2 style={s.chartTitle}>Sets by muscle group (all time)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={muscleChartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <XAxis dataKey="muscle" tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sets" name="Sets" radius={[4, 4, 0, 0]}>
                {muscleChartData.map((entry) => (
                  <Cell key={entry.muscle} fill={MUSCLE_COLORS[entry.muscle] || '#8a8a96'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={s.legend}>
            {muscleChartData.map(m => (
              <div key={m.muscle} style={s.legendItem}>
                <span style={{ ...s.legendDot, background: MUSCLE_COLORS[m.muscle] || '#8a8a96' }} />
                <span style={s.legendLabel}>{m.muscle}</span>
                <span style={s.legendVal}>{m.sets} sets</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth: '600px', margin: '0 auto' },
  loading: { color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' },
  title: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '1rem' },
  filters: { display: 'flex', gap: '8px', marginBottom: '1.25rem' },
  select: { flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px' },
  chartCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '12px' },
  chartTitle: { fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1rem' },
  empty: { textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' },
  legendDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  legendLabel: { color: 'var(--text-secondary)' },
  legendVal: { color: 'var(--text-muted)', fontSize: '11px' },
}
