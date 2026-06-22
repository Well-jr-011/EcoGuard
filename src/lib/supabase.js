import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  'https://fgvdsukildytjrehpjul.supabase.co'

const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZndmRzdWtpbGR5dGpyZWhwanVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjA3MjgsImV4cCI6MjA5NTk5NjcyOH0.VCeu_M6Eln_C1ERW2u9LTCuSHqPrK_FRmS1cJBfECtc'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)