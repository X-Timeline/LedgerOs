const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// GET /shops - list every shop the logged-in user can access (RLS-scoped,
// covers both business-wide roles like Owner and shop-scoped roles like Cashier)
router.get('/', requireAuth, async (req, res) => {
  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('shops')
    .select('id, name, business_id, shop_code, created_at')
    .order('created_at', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /shops/join - join a shop using its shared shop code. Always assigns
// the Cashier role (see migration 0007) - a shared code can't safely carry a
// higher role since anyone with the code could claim it.
// body: { shopCode }
router.post('/join', requireAuth, async (req, res) => {
  const { shopCode } = req.body;
  if (!shopCode) return res.status(400).json({ error: 'shopCode is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('join_shop_with_code', { p_shop_code: shopCode });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ shopId: data });
});

// GET /shops/:id/members - team roster for one shop (name + role)
router.get('/:id/members', requireAuth, async (req, res) => {
  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('user_roles')
    .select('id, role, user_id, profiles(name, email)')
    .eq('shop_id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
