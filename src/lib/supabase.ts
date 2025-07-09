import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Client-only supabase client (for browser/components)
export const supabase = createClient()

// Re-export server clients for convenience
export { createServerSupabaseClient, createServiceSupabaseClient, supabaseServer } from './supabase-server' 