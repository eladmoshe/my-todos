import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sign up a new user (you should call this function when a user signs up)
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { user: data.user, error }
}

// Sign in a user (you should call this function when a user signs in)
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data.user, error }
}

export default supabase
