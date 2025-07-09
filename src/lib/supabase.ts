import { createBrowserClient } from '@supabase/ssr'

// Environment variables with fallback values for debugging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ythsmnqclosoxiccchhh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aHNtbnFjbG9zb3hpY2NjaGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjYzMTksImV4cCI6MjA2NTc0MjMxOX0.O9hAHQa3qZ3WMixz2VyQVBB8sxLDT-MMRjlTVg_jaCk'

console.log('🔍 Supabase config:', {
  url: supabaseUrl ? 'loaded' : 'missing',
  key: supabaseAnonKey ? 'loaded' : 'missing',
  urlFromEnv: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  keyFromEnv: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
})

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    throw new Error('Supabase environment variables are not configured')
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Lazy initialization of supabase client
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient()
    console.log('✅ Supabase client created successfully')
  }
  return supabaseClient
}

// Client-only supabase client (for browser/components)
export const supabase = getSupabaseClient()

// Re-export server clients for convenience
export { createServerSupabaseClient, createServiceSupabaseClient, supabaseServer } from './supabase-server' 