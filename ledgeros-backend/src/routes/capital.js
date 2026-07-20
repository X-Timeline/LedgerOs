const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// POST /capital - record capital injected or withdrawn
router.post('/', requireAuth, async (req, res) => {
  const { shopId, direction, amount, channel, note, date } = req.body;
  if (!shopId || !direction || !amount || !channel) {
    return res.status(400).json({ error: 'shopId, direction, amount and channel are required' });
  }

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('capital_entries')
    .insert({ shop_id: shopId, direction, amount, channel, note, date })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// GET /capital?shopId=...
router.get('/', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('capital_entries')
    .select('*')
    .eq('shop_id', shopId)
    .order('date', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
