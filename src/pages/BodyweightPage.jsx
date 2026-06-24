import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import { getBodyweights, addBodyweight } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

export default function BodyweightPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!user) return
    getBodyweights(user.id).then(({ data }) => { setEntries(data || []); setLoading(false) })
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!weight) return
    setSaving(true)
    const { data, error } = await addBodyweight({ user_id: user.id, date, weight_kg: parseFloat(weight), notes })
    if (!error && data) {
      setEntries(prev => [...prev, data[0]].sort((a, b) => a.date.localeCompare(b.date)))
      setWeight('')
      setNotes('')
      setMsg('Logged!')
      setTimeout(() => setMsg(''), 2000)
    }
    setSaving(false)
  }

  const filtered = entries.filter(e => {
    if (fromDate && e.date < fromDate) return false
    if (toDate && e.date > toDate) return false
    return true
  })

  const chartData = filtered.map(e => ({
    ...e,
    label: format(parseISO(e.date), 'd MMM')
  }))

  const minWeight = chartData.length ? Math.floor(Math.min(...chartData.map(d => d.weight_kg)) - 2) : 0
  const maxWeight = chartData.length ? Math.ceil(Math.max(...chartData.map(d => d.weight_kg)) + 2) : 100
  const latest = entries[entries.length - 1]
  const first = filtered[0]
  const last = filtered[filtered.length - 1]
  const change = first && last ? (last.weight_kg - first.weight_kg).toFixed(1) : null

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const entry = filtered.find(e => format(parseISO(e.date), 'd MMM') === label)
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
        <p style={{ color: '#c8f135', fontWeight: 600 }}>{payload[0]?.value} kg</p>
        {entry?.notes && <p style={{ color: 'var(--text-muted)', marginTop: '4px', maxWidth: '160px' }}>{entry.notes}</p>}
      </div>
    )
  }

  if (loading) return <div style={s.loading}>Loading...</div>

  return (
    <div style={s.page}>
      <h1 style={s.title}>Bodyweight</h1>

      {latest && (
        <div style={s.currentCard}>
          <div>
            <p style={s.currentLabel}>Current weight</p>
            <p style={s.currentWeight}>{latest.weight_kg} <span style={s.unit}>kg</span></p>
            <p style={s.currentDate}>{format(parseISO(latest.date), 'd MMM yyyy')}</p>
          </div>
          {change !== null && (
            <div style={s.changePill}>
              <span style={{ ...s.changeNum, color: parseFloat(change) <= 0 ? '#c8f135' : '#ff4d4d' }}>
                {parseFloat(change) > 0 ? '+' : ''}{change} kg
              </span>
              <span style={s.changeLabel}>in range</span>
            </div>
          )}
        </div>
      )}

      {/* Log new entry */}
      <form onSubmit={handleSave} style={s.form}>
        <div style={s.row2}>
          <div style={s.field}>
            <label style={s.label}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.input} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={s.input} placeholder="0.0" step="0.1" min="0" required />
          </div>
        </div>
        <div style={s.field}>
          <label style={s.label}>Notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} style={s.input} placeholder="e.g. after morning fast..." />
        </div>
        {msg && <p style={s.msg}>{msg}</p>}
        <button type="submit" style={s.logBtn} disabled={saving}>{saving ? 'Saving...' : 'Log weight'}</button>
      </form>

      {/* Date range filter */}
      <div style={s.rangeRow}>
        <div style={s.field}>
          <label style={s.label}>From</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={s.inputSm} />
        </div>
        <div style={s.field}>
          <label style={s.label}>To</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={s.inputSm} />
        </div>
        {(fromDate || toDate) && (
          <button style={s.clearBtn} onClick={() => { setFromDate(''); setToDate('') }}>Clear</button>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 1 ? (
        <div style={s.chartCard}>
          <h2 style={s.chartTitle}>Bodyweight over time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <XAxis dataKey="label" tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[minWeight, maxWeight]} tick={{ fill: '#8a8a96', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="weight_kg" name="Weight" stroke="#c8f135" strokeWidth={2.5} dot={{ fill: '#c8f135', r: 4 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : chartData.length === 1 ? (
        <div style={s.singleEntry}>Only 1 entry in range — add more to see the chart.</div>
      ) : null}

      {/* Entry list */}
      {filtered.length > 0 && (
        <div style={s.listCard}>
          <h2 style={s.listTitle}>Log</h2>
          {[...filtered].reverse().map(entry => (
            <div key={entry.id} style={s.entryRow}>
              <div>
                <span style={s.entryDate}>{format(parseISO(entry.date), 'd MMM yyyy')}</span>
                {entry.notes && <span style={s.entryNote}> — {entry.notes}</span>}
              </div>
              <span style={s.entryWeight}>{entry.weight_kg} kg</span>
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
  title: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '1rem' },
  currentCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  currentLabel: { fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' },
  currentWeight: { fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 },
  unit: { fontSize: '18px', fontWeight: 500 },
  currentDate: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
  changePill: { textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px 16px' },
  changeNum: { fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, display: 'block' },
  changeLabel: { fontSize: '11px', color: 'var(--text-muted)' },
  form: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase' },
  input: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 12px', color: 'var(--text-primary)', fontSize: '15px', width: '100%' },
  msg: { color: 'var(--accent)', fontSize: '13px', background: 'var(--accent-dim)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' },
  logBtn: { background: 'var(--accent)', color: '#0a0a0b', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '15px', border: 'none', borderRadius: 'var(--radius-md)', padding: '14px', cursor: 'pointer' },
  rangeRow: { display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '1rem' },
  inputSm: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 10px', color: 'var(--text-primary)', fontSize: '13px', width: '100%' },
  clearBtn: { background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', padding: '9px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', marginBottom: '0' },
  chartCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '1rem' },
  chartTitle: { fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '1rem' },
  singleEntry: { fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem', textAlign: 'center' },
  listCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px', marginBottom: '1rem' },
  listTitle: { fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '10px' },
  entryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border)', fontSize: '13px' },
  entryDate: { color: 'var(--text-primary)', fontWeight: 500 },
  entryNote: { color: 'var(--text-muted)', fontSize: '12px' },
  entryWeight: { fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)', fontSize: '15px' },
}
