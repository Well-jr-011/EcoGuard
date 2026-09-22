import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgvdsukildytjrehpjul.supabase.co';

const supabaseAnonKey =
  'sb_publishable_U_EPZpUuoQ38rRozL61J_w_XazrXubS';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);