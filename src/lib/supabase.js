import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signUp = (email, password) =>
  supabase.auth.signUp({ email, password })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getUser = () => supabase.auth.getUser()

// Workout log helpers
export const getLogs = async (userId) => {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  return { data, error }
}

export const addLog = async (log) => {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert([log])
    .select()
  return { data, error }
}

export const deleteLog = async (id) => {
  const { error } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', id)
  return { error }
}

// Exercise helpers
export const getExercises = async (userId) => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId)
    .order('name')
  return { data, error }
}

export const addExercise = async (exercise) => {
  const { data, error } = await supabase
    .from('exercises')
    .insert([exercise])
    .select()
  return { data, error }
}

// Bodyweight helpers
export const getBodyweights = async (userId) => {
  const { data, error } = await supabase
    .from('bodyweights')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
  return { data, error }
}

export const addBodyweight = async (entry) => {
  const { data, error } = await supabase
    .from('bodyweights')
    .insert([entry])
    .select()
  return { data, error }
}

// Session notes helpers
export const getSessionNotes = async (userId) => {
  const { data, error } = await supabase
    .from('session_notes')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  return { data, error }
}

export const upsertSessionNote = async (note) => {
  const { data, error } = await supabase
    .from('session_notes')
    .upsert([note], { onConflict: 'user_id,date' })
    .select()
  return { data, error }
}
