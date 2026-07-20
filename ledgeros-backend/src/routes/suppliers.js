const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// POST /suppliers - add a supplier
router.post('/', requireAuth, async (req, res) => {
  const { shopId, name, phone } = req.body;
  if (!shopId || !name) return res.status(400).json({ error: 'shopId and name are required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('suppliers')
    .insert({ shop_id: shopId, name, phone })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// GET /suppliers?shopId=...
router.get('/', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('suppliers')
    .select('*')
    .eq('shop_id', shopId)
    .order('name');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /suppliers/:id/balance - record a charge (purchase on credit) or payment
router.post('/:id/balance', requireAuth, async (req, res) => {
  const { shopId, type, amount, channel, date } = req.body;
  if (!shopId || !type || !amount) {
    return res.status(400).json({ error: 'shopId, type and amount are required' });
  }

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('supplier_balance_entries')
    .insert({ shop_id: shopId, supplier_id: req.params.id, type, amount, channel, date })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// GET /suppliers/:id/balance - full ledger + running balance for one supplier
router.get('/:id/balance', requireAuth, async (req, res) => {
  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('supplier_balance_entries')
    .select('*')
    .eq('supplier_id', req.params.id)
    .order('date', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });

  const balance = data.reduce(
    (sum, e) => sum + (e.type === 'CHARGE' ? Number(e.amount) : -Number(e.amount)),
    0
  );

  res.json({ entries: data, balanceOwed: balance });
});

module.exports = router;
