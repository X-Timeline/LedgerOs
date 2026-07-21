import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[LedgerOS] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project details (Dashboard -> Project Settings -> API)."
  );
}

// The anon key is safe to ship in frontend code — it's the public key Supabase
// expects browsers to use. Actual access control is enforced by Row Level
// Security policies and SECURITY DEFINER RPCs in Postgres, not by this key
// being secret. Never put the service_role key here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
