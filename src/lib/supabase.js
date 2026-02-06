import { createClient } from '@supabase/supabase-js'

// I'll fill these in once the local server starts and gives us the keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://api.saikumar.space'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
