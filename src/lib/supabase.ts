import { createBrowserClient } from '@supabase/ssr'

// Hardcoded production values for reliable deployment
const SUPABASE_URL = 'https://ythsmnqclosoxiccchhh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aHNtbnFjbG9zb3hpY2NjaGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjYzMTksImV4cCI6MjA2NTc0MjMxOX0.O9hAHQa3qZ3WMixz2VyQVBB8sxLDT-MMRjlTVg_jaCk'

// Use environment variables if available, otherwise use hardcoded values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY

console.log('🔍 Supabase client initializing with URL:', supabaseUrl)

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing')
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Singleton client instance
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient()
    console.log('✅ Supabase client created successfully')
  }
  return supabaseClient
}

// Default export - the main client instance
export const supabase = getSupabaseClient() 