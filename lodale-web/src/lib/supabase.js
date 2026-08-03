import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Lodale Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in your .env file.\n' +
    'Please add your credentials to lodale-web/.env to connect to your Supabase managed backend.'
  );
}

// Provide fallback placeholder string so createClient doesn't throw during initial setup
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');
};
