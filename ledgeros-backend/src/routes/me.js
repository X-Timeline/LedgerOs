const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// GET /me - returns the logged-in user's profile and their roles
router.get('/', requireAuth, async (req, res) => {
  const db = getUserClient(req.userToken);

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (profileError) {
    return res.status(400).json({ error: profileError.message });
  }

  const { data: roles, error: rolesError } = await db
    .from('user_roles')
    .select('*')
    .eq('user_id', req.user.id);

  if (rolesError) {
    return res.status(400).json({ error: rolesError.message });
  }

  res.json({ profile, roles });
});

module.exports = router;
