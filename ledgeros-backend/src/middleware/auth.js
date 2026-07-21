const { supabaseAnon } = require('../config/supabaseClient');

/**
 * Checks that the request has a valid logged-in user.
 * Expects: Authorization: Bearer <supabase-access-token>
 * On success, attaches req.user (the logged-in user) for use in routes.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing login token. Please log in.' });
  }

  const { data, error } = await supabaseAnon.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired login. Please log in again.' });
  }

  req.user = data.user;
  req.userToken = token;
  next();
}

module.exports = { requireAuth };
