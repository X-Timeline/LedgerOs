const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// POST /expenses
router.post('/', requireAuth, async (req, res) => {
  const { shopId, category, amount, channel, date } = req.body;
  if (!shopId || !category || !amount || !channel) {
    return res.status(400).json({ error: 'shopId, category, amount and channel are required' });
  }

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('expenses')
    .insert({ shop_id: shopId, category, amount, channel, date })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// GET /expenses?shopId=...
router.get('/', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('expenses')
    .select('*')
    .eq('shop_id', shopId)
    .order('date', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
