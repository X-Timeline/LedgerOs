const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// POST /businesses - create a business + its first shop in one step
// body: { businessName, shopName }
router.post('/', requireAuth, async (req, res) => {
  const { businessName, shopName } = req.body;
  if (!businessName || !shopName) {
    return res.status(400).json({ error: 'businessName and shopName are required' });
  }

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .rpc('create_business_with_shop', { p_business_name: businessName, p_shop_name: shopName })
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data); // { business_id, shop_id, shop_code }
});

// GET /businesses - list businesses the logged-in user owns (RLS-scoped)
router.get('/', requireAuth, async (req, res) => {
  const db = getUserClient(req.userToken);
  const { data, error } = await db.from('businesses').select('*').order('created_at', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH /businesses/:id - update business fields (currently just currency;
// create_business_with_shop doesn't take one, so this is a required follow-up)
router.patch('/:id', requireAuth, async (req, res) => {
  const { currency } = req.body;
  if (!currency) return res.status(400).json({ error: 'currency is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('businesses')
    .update({ currency })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
