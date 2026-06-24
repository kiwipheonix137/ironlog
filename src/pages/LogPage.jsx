import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import { getLogs, addLog, deleteLog, getExercises, addExercise, upsertSessionNote } from '../lib/supabase'
import { format } from 'date-fns'

const MUSCLE_GROUPS = {
  'Bench Press': 'Chest', 'Incline Bench Press': 'Chest', 'Dip': 'Chest',
  'Squat': 'Legs', 'Leg Press': 'Legs', 'Leg Curl': 'Legs', 'Leg Extension': 'Legs', 'Romanian Deadlift': 'Legs',
  'Deadlift': 'Back', 'Barbell Row': 'Back', 'Lat Pulldown': 'Back', 'Cable Row': 'Back', 'Pull Up': 'Back',
  'Overhead Press': 'Shoulders', 'Lateral Raise': 'Shoulders',
  'Bicep Curl': 'Biceps', 'Hammer Curl': 'Biceps',
  'Tricep Pushdown': 'Triceps', 'Skull Crusher': 'Triceps',
}

const DEFAULT_EXERCISES = Object.keys(MUSCLE_GROUPS)
const SET_TYPES = ['Warmup', 'Top Set', 'Back Off Set', 'Myo Reps', 'Failure Set', 'Drop Set', 'Feeder Set', 'Technique Set']

export default function LogPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [exercise, setExercise] = useState('')
  const [setType, setSetType] = useState('Top Set')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [notes, setNotes] = useState('')
  const [sessionNote, setSessionNote] = useState('')
  const [newExercise, setNewExercise] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!user) return
    getLogs(user.id).then(({ data }) => setLogs(data || []))
    getExercises(user.id).then(({ data }) => {
      if (data?.length) setExercises([...new Set([...DEFAULT_EXERCISES, ...data.map(e => e.name)])])
    })
  }, [user])

  const todayLogs = logs.filter(l => l.date === date)
  const setNumber = todayLogs.filter(l => l.exercise === exercise).length + 1

  const handleLog = async (e) => {
    e.preventDefault()
    if (!exercise || !weight || !reps) return
    setSaving(true)
    const volume = parseFloat(weight) * parseInt(reps)
    const muscle_group = MUSCLE_GROUPS[exercise] || 'Other'
    const { data, error } = await addLog({
      user_id: user.id, date, exercise, set_number: setNumber,
      set_type: setType, weight_kg: parseFloat(weight),
      reps: parseInt(reps), volume, muscle_group, notes
    })
    if (!error && data) {
      setLogs(prev => [data[0], ...prev])
      setNotes('')
      setMsg('Set logged!')
      setTimeout(() => setMsg(''), 2000)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    await deleteLog(id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const handleAddExercise = async () => {
    if (!newExercise.trim()) return
    const name = newExercise.trim()
    setExercises(prev => [...new Set([...prev, name])])
    await addExercise({ user_id: user.id, name })
    setNewExercise('')
    setExercise(name)
  }

  const handleSaveSessionNote = async () => {
    if (!sessionNote.trim()) return
    await upsertSessionNote({ user_id: user.id, date, note: sessionNote })
    setMsg('Session note saved!')
    setTimeout(() => setMsg(''), 2000)
  }

  const exGroups = todayLogs.reduce((acc, l) => {
    if (!acc[l.exercise]) acc[l.exercise] = []
    acc[l.exercise].push(l)
    return acc
  }, {})

  return (
    <div style={s.page}>
      <h1 style={s.title}>Log workout</h1>

      <div style={s.dateRow}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={s.dateInput} />
      </div>

      {/* Log form */}
      <form onSubmit={handleLog} style={s.form}>
        <div style={s.field}>
          <label style={s.label}>Exercise</label>
          <select value={exercise} onChange={e => setExercise(e.target.value)} style={s.select} required>
            <option value="">Select exercise</option>
            {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
          </select>
        </div>

        <div style={s.addExRow}>
          <input value={newExercise} onChange={e => setNewExercise(e.target.value)} placeholder="Add new exercise..." style={s.addExInput} />
          <button type="button" onClick={handleAddExercise} style={s.addExBtn}>Add</button>
        </div>

        <div style={s.field}>
          <label style={s.label}>Set type</label>
          <div style={s.typeGrid}>
            {SET_TYPES.map(t => (
              <button key={t} type="button" onClick={() => setSetType(t)}
                style={{ ...s.typeBtn, ...(setType === t ? s.typeBtnActive : {}) }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={s.row2}>
          <div style={s.field}>
            <label style={s.label}>Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} style={s.input} placeholder="0" step="0.5" min="0" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Reps</label>
            <input type="number" value={reps} onChange={e => setReps(e.target.value)} style={s.input} placeholder="0" min="1" required />
          </div>
        </div>

        {weight && reps && (
          <div style={s.volumePreview}>
            Volume: <strong style={{ color: 'var(--accent)' }}>{(parseFloat(weight || 0) * parseInt(reps || 0)).toLocaleString()} kg</strong>
            &nbsp;·&nbsp; Set {setNumber} of {exercise || '...'}
          </div>
        )}

        <div style={s.field}>
          <label style={s.label}>Set notes (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} style={s.input} placeholder="e.g. felt strong, paused reps..." />
        </div>

        {msg && <p style={s.msg}>{msg}</p>}
        <button type="submit" style={s.logBtn} disabled={saving}>
          {saving ? 'Saving...' : `Log set ${setNumber}`}
        </button>
      </form>

      {/* Session note */}
      <div style={s.sessionNoteBox}>
        <label style={s.label}>Session overview note</label>
        <textarea value={sessionNote} onChange={e => setSessionNote(e.target.value)} style={s.textarea} placeholder="How did today's session feel overall?" rows={3} />
        <button type="button" onClick={handleSaveSessionNote} style={s.saveNoteBtn}>Save note</button>
      </div>

      {/* Today's sets */}
      {Object.keys(exGroups).length > 0 && (
        <div style={s.todaySection}>
          <h2 style={s.sectionTitle}>Today's sets</h2>
          {Object.entries(exGroups).map(([ex, sets]) => (
            <div key={ex} style={s.exCard}>
              <div style={s.exHeader}>
                <span style={s.exName}>{ex}</span>
                <span style={s.muscleTag}>{MUSCLE_GROUPS[ex] || 'Other'}</span>
              </div>
              {sets.map(set => (
                <div key={set.id} style={s.setRow}>
                  <span style={s.setNum}>S{set.set_number}</span>
                  <span style={s.setInfo}>{set.weight_kg}kg × {set.reps}</span>
                  <span style={s.setVol}>{set.volume?.toLocaleString()} kg</span>
                  <span style={{ ...s.setTypePill, ...(set.set_type === 'Top Set' ? s.topSet : set.set_type === 'Warmup' ? s.warmupPill : {}) }}>{set.set_type}</span>
                  <button onClick={() => handleDelete(set.id)} style={s.delBtn}>✕</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth: '600px', margin: '0 auto' },
  title: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '1rem' },
  dateRow: { marginBottom: '1rem' },
  dateInput: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '14px', width: '100%' },
  form: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase' },
  select: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 12px', color: 'var(--text-primary)', fontSize: '15px' },
  addExRow: { display: 'flex', gap: '8px' },
  addExInput: { flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '14px' },
  addExBtn: { background: 'var(--bg-hover)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '10px 16px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 500 },
  typeGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  typeBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  typeBtnActive: { background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)', color: 'var(--accent)' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  input: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 12px', color: 'var(--text-primary)', fontSize: '15px', width: '100%' },
  volumePreview: { fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' },
  msg: { color: 'var(--accent)', fontSize: '13px', background: 'var(--accent-dim)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' },
  logBtn: { background: 'var(--accent)', color: '#0a0a0b', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '15px', border: 'none', borderRadius: 'var(--radius-md)', padding: '14px', cursor: 'pointer' },
  sessionNoteBox: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' },
  textarea: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical', fontFamily: 'var(--font-body)' },
  saveNoteBtn: { background: 'var(--bg-hover)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '10px', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 500 },
  todaySection: { marginTop: '0.5rem' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' },
  exCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '8px' },
  exHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  exName: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px' },
  muscleTag: { fontSize: '11px', color: 'var(--purple)', background: 'var(--purple-dim)', padding: '2px 8px', borderRadius: '4px' },
  setRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderTop: '1px solid var(--border)', fontSize: '13px' },
  setNum: { color: 'var(--text-muted)', minWidth: '24px', fontWeight: 600 },
  setInfo: { flex: 1, fontWeight: 500 },
  setVol: { color: 'var(--text-secondary)', fontSize: '12px' },
  setTypePill: { fontSize: '11px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' },
  topSet: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  warmupPill: { background: 'var(--blue-dim)', color: 'var(--blue)' },
  delBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: '4px' },
}
