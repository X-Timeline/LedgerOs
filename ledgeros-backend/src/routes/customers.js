const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// POST /customers - add a customer
router.post('/', requireAuth, async (req, res) => {
  const { shopId, name, phone } = req.body;
  if (!shopId || !name) return res.status(400).json({ error: 'shopId and name are required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('customers')
    .insert({ shop_id: shopId, name, phone })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// GET /customers?shopId=...
router.get('/', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .order('name');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /customers/:id/debt - record a charge or payment
router.post('/:id/debt', requireAuth, async (req, res) => {
  const { shopId, type, amount, channel, date } = req.body;
  if (!shopId || !type || !amount) {
    return res.status(400).json({ error: 'shopId, type and amount are required' });
  }

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('customer_debt_entries')
    .insert({ shop_id: shopId, customer_id: req.params.id, type, amount, channel, date })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// GET /customers/:id/debt - full ledger + running balance for one customer
router.get('/:id/debt', requireAuth, async (req, res) => {
  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('customer_debt_entries')
    .select('*')
    .eq('customer_id', req.params.id)
    .order('date', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  const balance = data.reduce(
    (sum, e) => sum + (e.type === 'CHARGE' ? Number(e.amount) : -Number(e.amount)),
    0
  );

  res.json({ entries: data, balanceOwed: balance });
});

module.exports = router;
