const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[warning] Missing Supabase env vars. Copy .env.example to .env and fill in your project details.'
  );
}

// Use this client for normal requests, respects RLS rules (safe default)
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Use this client ONLY when the backend needs to bypass RLS on purpose
// (e.g. system-level jobs). Never expose this key to the frontend.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Creates a client that acts AS the logged-in user (so RLS rules apply correctly).
// Use this inside routes after requireAuth has run, with req.userToken.
function getUserClient(userToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  });
}

module.exports = { supabaseAnon, supabaseAdmin, getUserClient };
