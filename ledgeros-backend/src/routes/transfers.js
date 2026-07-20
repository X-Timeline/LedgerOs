const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// POST /transfers - move money between cash and bank
router.post('/', requireAuth, async (req, res) => {
  const { shopId, direction, amount, note, date } = req.body;
  if (!shopId || !direction || !amount) {
    return res.status(400).json({ error: 'shopId, direction and amount are required' });
  }

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('cash_bank_transfers')
    .insert({ shop_id: shopId, direction, amount, note, date })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// GET /transfers?shopId=...
router.get('/', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('cash_bank_transfers')
    .select('*')
    .eq('shop_id', shopId)
    .order('date', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
