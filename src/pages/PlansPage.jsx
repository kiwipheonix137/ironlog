import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import { supabase } from '../lib/supabase'

const MUSCLE_GROUPS = {
  'Bench Press': 'Chest', 'Incline Bench Press': 'Chest', 'Dip': 'Chest',
  'Squat': 'Legs', 'Leg Press': 'Legs', 'Leg Curl': 'Legs', 'Leg Extension': 'Legs', 'Romanian Deadlift': 'Legs',
  'Deadlift': 'Back', 'Barbell Row': 'Back', 'Lat Pulldown': 'Back', 'Cable Row': 'Back', 'Pull Up': 'Back',
  'Overhead Press': 'Shoulders', 'Lateral Raise': 'Shoulders',
  'Bicep Curl': 'Biceps', 'Hammer Curl': 'Biceps',
  'Tricep Pushdown': 'Triceps', 'Skull Crusher': 'Triceps',
}

const DEFAULT_EXERCISES = Object.keys(MUSCLE_GROUPS)
const SET_TYPES = ['Warmup', 'Top Set', 'Back Off Set', 'Myo Reps', 'Failure Set', 'Drop Set']

export default function PlansPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // list | create | edit
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [planName, setPlanName] = useState('')
  const [planExercises, setPlanExercises] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!user) return
    fetchPlans()
  }, [user])

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setPlans(data || [])
    setLoading(false)
  }

  const addExerciseToplan = () => {
    setPlanExercises(prev => [...prev, { exercise: '', sets: 3, reps: 8, weight_kg: 0, set_type: 'Top Set', notes: '' }])
  }

  const updateExercise = (index, field, value) => {
    setPlanExercises(prev => prev.map((ex, i) => i === index ? { ...ex, [field]: value } : ex))
  }

  const removeExercise = (index) => {
    setPlanExercises(prev => prev.filter((_, i) => i !== index))
  }

  const savePlan = async () => {
    if (!planName.trim() || planExercises.length === 0) return
    setSaving(true)
    const planData = {
      user_id: user.id,
      name: planName,
      exercises: planExercises,
    }
    if (selectedPlan) {
      await supabase.from('workout_plans').update(planData).eq('id', selectedPlan.id)
    } else {
      await supabase.from('workout_plans').insert([planData])
    }
    setMsg('Plan saved!')
    setTimeout(() => setMsg(''), 2000)
    setSaving(false)
    setPlanName('')
    setPlanExercises([])
    setSelectedPlan(null)
    setView('list')
    fetchPlans()
  }

  const deletePlan = async (id) => {
    await supabase.from('workout_plans').delete().eq('id', id)
    setPlans(prev => prev.filter(p => p.id !== id))
  }

  const editPlan = (plan) => {
    setSelectedPlan(plan)
    setPlanName(plan.name)
    setPlanExercises(plan.exercises || [])
    setView('create')
  }

  const startNew = () => {
    setSelectedPlan(null)
    setPlanName('')
    setPlanExercises([])
    setView('create')
  }

  if (loading) return <div style={s.loading}>Loading...</div>

  if (view === 'create') return (
    <div style={s.page}>
      <div style={s.topRow}>
        <button style={s.backBtn} onClick={() => setView('list')}>← Back</button>
        <h1 style={s.title}>{selectedPlan ? 'Edit plan' : 'New plan'}</h1>
      </div>

      <div style={s.field}>
        <label style={s.label}>Plan name</label>
        <input value={planName} onChange={e => setPlanName(e.target.value)} style={s.input} placeholder="e.g. Push Day, Leg Day..." />
      </div>

      <div style={s.exerciseList}>
        {planExercises.map((ex, i) => (
          <div key={i} style={s.exCard}>
            <div style={s.exCardHeader}>
              <span style={s.exNum}>Exercise {i + 1}</span>
              <button onClick={() => removeExercise(i)} style={s.removeBtn}>✕ Remove</button>
            </div>
            <div style={s.field}>
              <label style={s.label}>Exercise</label>
              <select value={ex.exercise} onChange={e => updateExercise(i, 'exercise', e.target.value)} style={s.select}>
                <option value="">Select exercise</option>
                {DEFAULT_EXERCISES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div style={s.grid3}>
              <div style={s.field}>
                <label style={s.label}>Sets</label>
                <input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} style={s.input} min="1" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Reps</label>
                <input type="number" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} style={s.input} min="1" />
              </div>
              <div style={s.field}>
                <label style={s.label}>Weight (kg)</label>
                <input type="number" value={ex.weight_kg} onChange={e => updateExercise(i, 'weight_kg', e.target.value)} style={s.input} min="0" step="0.5" />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Set type</label>
              <select value={ex.set_type} onChange={e => updateExercise(i, 'set_type', e.target.value)} style={s.select}>
                {SET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Notes (optional)</label>
              <input value={ex.notes} onChange={e => updateExercise(i, 'notes', e.target.value)} style={s.input} placeholder="e.g. pause at bottom..." />
            </div>
          </div>
        ))}
      </div>

      <button style={s.addExBtn} onClick={addExerciseToplan}>+ Add exercise</button>

      {msg && <p style={s.msg}>{msg}</p>}

      <button style={s.saveBtn} onClick={savePlan} disabled={saving || !planName || planExercises.length === 0}>
        {saving ? 'Saving...' : 'Save plan'}
      </button>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.topRow}>
        <h1 style={s.title}>Workout plans</h1>
        <button style={s.newBtn} onClick={startNew}>+ New plan</button>
      </div>

      {plans.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyTitle}>No plans yet</p>
          <p style={s.emptySub}>Create a workout plan to use when logging.</p>
          <button style={s.newBtn} onClick={startNew}>+ Create your first plan</button>
        </div>
      ) : (
        <div style={s.planList}>
          {plans.map(plan => (
            <div key={plan.id} style={s.planCard}>
              <div style={s.planHeader}>
                <div>
                  <p style={s.planName}>{plan.name}</p>
                  <p style={s.planMeta}>{plan.exercises?.length || 0} exercises</p>
                </div>
                <div style={s.planActions}>
                  <button style={s.editBtn} onClick={() => editPlan(plan)}>Edit</button>
                  <button style={s.deleteBtn} onClick={() => deletePlan(plan.id)}>Delete</button>
                </div>
              </div>
              <div style={s.planExList}>
                {(plan.exercises || []).map((ex, i) => (
                  <div key={i} style={s.planExRow}>
                    <span style={s.planExName}>{ex.exercise}</span>
                    <span style={s.planExDetail}>{ex.sets} × {ex.reps} @ {ex.weight_kg}kg</span>
                    <span style={s.planExType}>{ex.set_type}</span>
                  </div>
                ))}
              </div>
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
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700 },
  backBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-body)', padding: 0 },
  newBtn: { background: 'var(--accent)', color: '#0a0a0b', fontWeight: 700, fontSize: '13px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' },
  label: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase' },
  input: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 12px', color: 'var(--text-primary)', fontSize: '15px', width: '100%' },
  select: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 12px', color: 'var(--text-primary)', fontSize: '15px' },
  exerciseList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' },
  exCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px' },
  exCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  exNum: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--accent)' },
  removeBtn: { background: 'none', border: 'none', color: 'var(--red)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
  addExBtn: { width: '100%', background: 'var(--bg-elevated)', border: '1px dashed var(--border-bright)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', padding: '14px', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-body)', marginBottom: '10px' },
  msg: { color: 'var(--accent)', fontSize: '13px', background: 'var(--accent-dim)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', textAlign: 'center', marginBottom: '10px' },
  saveBtn: { width: '100%', background: 'var(--accent)', color: '#0a0a0b', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '15px', border: 'none', borderRadius: 'var(--radius-md)', padding: '14px', cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '3rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '6px' },
  emptySub: { color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '1.25rem' },
  planList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  planCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px' },
  planHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  planName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', marginBottom: '4px' },
  planMeta: { fontSize: '12px', color: 'var(--text-secondary)' },
  planActions: { display: 'flex', gap: '8px' },
  editBtn: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)' },
  deleteBtn: { background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '6px', color: 'var(--red)', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-body)' },
  planExList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  planExRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '6px 0', borderTop: '1px solid var(--border)' },
  planExName: { flex: 1, fontWeight: 500 },
  planExDetail: { color: 'var(--text-secondary)' },
  planExType: { fontSize: '11px', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px' },
}
