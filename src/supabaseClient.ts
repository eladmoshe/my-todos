import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Use 'dev' schema in development, 'public' schema in production
const schema = process.env.NODE_ENV === 'development' ? 'dev' : 'public'

export const getTodosTable = () => supabase.from(`${schema}.todos`)
export const getSectionsTable = () => supabase.from(`${schema}.sections`)

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { user: data.user, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data.user, error }
}

export default supabase
