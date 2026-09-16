// ============================================================
// Supabase Configuration
// Replace the values below with your own Supabase project
// credentials found in: Project Settings → API
// ============================================================

const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

// Initialize Supabase client
const SUPABASE = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
