import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create the client without schema specification
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Define base types
export type Tables<T extends 'public' | 'dev' = 'public'> = Database[T]['Tables']
export type Todo = Tables['todos']['Row']
export type Section = Tables['sections']['Row']

// Ensure these types have the required fields
export interface BaseSection {
  id: number
  title: string
  order: number
  user_id: string
}

export interface BaseTodo {
  id: number
  text: string
  completed: boolean
  completed_at: string | null
  created_at: string
  section_id: number
  user_id: string
}

// Verify that our database types match our base types
export type VerifyTodo = Omit<Todo, keyof BaseTodo>
export type VerifySection = Omit<Section, keyof BaseSection>

// Type for a section with its todos
export interface TodoSection extends BaseSection {
  todos: BaseTodo[]
}

// Type-safe table getters with user filtering
export const getTodosTable = (userId?: string) => {
  const baseTable = supabase.from('todos');
  return userId 
    ? baseTable.select('*').eq('user_id', userId) as any
    : baseTable;
}

export const getSectionsTable = (userId?: string) => {
  const table = supabase.from('sections');
  return (userId ? table.select('*').eq('user_id', userId) : table) as any;
}

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { user: data.user, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { user: data.user, error }
}

export default supabase
