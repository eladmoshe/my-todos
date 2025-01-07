import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tkcfadcfwizapyymwdnu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY2ZhZGNmd2l6YXB5eW13ZG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyNjY5MDIsImV4cCI6MjA1MTg0MjkwMn0.nvYIQfAtLFpzDme7aaUKrzoxPV_QanBvRwskLlNfexg'
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
