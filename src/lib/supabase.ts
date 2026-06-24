import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

const supabaseUrl = getSupabaseUrl() ?? 'https://placeholder.supabase.co'
const supabaseKey = getSupabaseAnonKey() ?? 'placeholder'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
