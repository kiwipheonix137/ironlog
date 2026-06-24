import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import { getLogs, getSessionNotes } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

export default function HistoryPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [notes, setNotes] = useState({})
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([getLogs(user.id), getSessionNotes(user.id)]).then(([l, n]) => {
      setLogs(l.data || [])
      const noteMap = {}
      ;(n.data || []).forEach(note => { noteMap[note.date] = note.note })
      setNotes(noteMap)
      setLoading(false)
    })
  }, [user])

  const uniqueDates = [...new Set(logs.map(l => l.date))].sort((a, b) => b.localeCompare(a))

  const sessionLogs = selectedDate ? logs.filter(l => l.date === selectedDate) : []
  const sessionExercises = [...new Set(sessionLogs.map(l => l.exercise))]
  const sessionVolume = sessionLogs.reduce((sum, l) => sum + (l.volume || 0), 0)

  if (loading) return <div style={s.loading}>Loading...</div>

  return (
    <div style={s.page}>
      <h1 style={s.title}>Session history</h1>

      <div style={s.datePicker}>
        <label style={s.label}>Select session</label>
        <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={s.select}>
          <option value="">Choose a date...</option>
          {uniqueDates.map(d => (
            <option key={d} value={d}>
              {format(parseISO(d), 'EEEE, d MMM yyyy')} — {logs.filter(l => l.date === d).length} sets
            </option>
          ))}
        </select>
      </div>

      {selectedDate && sessionLogs.length > 0 && (
        <div>
          <div style={s.sessionHeader}>
            <h2 style={s.sessionDate}>{format(parseISO(selectedDate), 'EEEE, d MMMM yyyy')}</h2>
            <div style={s.sessionStats}>
              <span style={s.statChip}>{sessionLogs.length} sets</span>
              <span style={s.statChip}>{sessionExercises.length} exercises</span>
              <span style={s.statChip}>{sessionVolume.toLocaleString()} kg volume</span>
            </div>
          </div>

          {notes[selectedDate] && (
            <div style={s.noteBox}>
              <p style={s.noteLabel}>Session note</p>
              <p style={s.noteText}>{notes[selectedDate]}</p>
            </div>
          )}

          {sessionExercises.map(ex => {
            const sets = sessionLogs.filter(l => l.exercise === ex)
            const maxWeight = Math.max(...sets.map(l => l.weight_kg || 0))
            const totalVol = sets.reduce((sum, l) => sum + (l.volume || 0), 0)
            return (
              <div key={ex} style={s.exCard}>
                <div style={s.exHeader}>
                  <div>
                    <span style={s.exName}>{ex}</span>
                    {sets[0]?.muscle_group && <span style={s.muscleTag}>{sets[0].muscle_group}</span>}
                  </div>
                  <div style={s.exMeta}>
                    <span style={s.metaItem}>Top: {maxWeight}kg</span>
                    <span style={s.metaItem}>{totalVol.toLocaleString()} kg vol</span>
                  </div>
                </div>
                <div style={s.setsTable}>
                  <div style={s.tableHead}>
                    <span>Set</span><span>Type</span><span>Weight</span><span>Reps</span><span>Volume</span>
                  </div>
                  {sets.map((set, i) => (
                    <div key={set.id} style={{ ...s.tableRow, ...(i % 2 === 0 ? s.tableRowAlt : {}) }}>
                      <span style={s.setNum}>{set.set_number || i + 1}</span>
                      <span style={{ ...s.setTypePill, ...(set.set_type === 'Top Set' ? s.topSet : set.set_type === 'Warmup' ? s.warmupPill : {}) }}>{set.set_type}</span>
                      <span style={s.bold}>{set.weight_kg}kg</span>
                      <span>{set.reps}</span>
                      <span style={s.vol}>{set.volume?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {sets.some(s => s.notes) && (
                  <div style={s.setNotes}>
                    {sets.filter(s => s.notes).map(set => (
                      <p key={set.id} style={s.setNote}>S{set.set_number}: {set.notes}</p>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!selectedDate && (
        <div style={s.emptyState}>
          <p style={s.emptyTitle}>{uniqueDates.length} sessions logged</p>
          <p style={s.emptySub}>Select a date above to replay a session.</p>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth: '600px', margin: '0 auto' },
  loading: { color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' },
  title: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '1rem' },
  label: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' },
  datePicker: { marginBottom: '1.25rem' },
  select: { width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '14px' },
  sessionHeader: { marginBottom: '1rem' },
  sessionDate: { fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '8px' },
  sessionStats: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  statChip: { fontSize: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', color: 'var(--text-secondary)' },
  noteBox: { background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '1rem' },
  noteLabel: { fontSize: '11px', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' },
  noteText: { fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 },
  exCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '10px' },
  exHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  exName: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px', marginRight: '8px' },
  muscleTag: { fontSize: '11px', color: 'var(--purple)', background: 'var(--purple-dim)', padding: '2px 8px', borderRadius: '4px' },
  exMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' },
  metaItem: { fontSize: '12px', color: 'var(--text-secondary)' },
  setsTable: { display: 'flex', flexDirection: 'column', gap: '1px' },
  tableHead: { display: 'grid', gridTemplateColumns: '32px 1fr 70px 50px 70px', fontSize: '11px', color: 'var(--text-muted)', padding: '4px 0', letterSpacing: '0.05em', textTransform: 'uppercase' },
  tableRow: { display: 'grid', gridTemplateColumns: '32px 1fr 70px 50px 70px', fontSize: '13px', padding: '7px 6px', borderRadius: '6px', alignItems: 'center' },
  tableRowAlt: { background: 'var(--bg-elevated)' },
  setNum: { color: 'var(--text-muted)', fontWeight: 600 },
  setTypePill: { fontSize: '11px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' },
  topSet: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  warmupPill: { background: 'var(--blue-dim)', color: 'var(--blue)' },
  bold: { fontWeight: 600 },
  vol: { color: 'var(--text-secondary)', fontSize: '12px' },
  setNotes: { marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '8px' },
  setNote: { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' },
  emptyState: { textAlign: 'center', padding: '3rem 1rem' },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '6px' },
  emptySub: { color: 'var(--text-secondary)', fontSize: '14px' },
}
