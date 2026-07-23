const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// POST /sales - create a sale (runs the costing engine server-side)
// body: { shopId, customerId, channel, status, lines: [{productId, unitSold, quantity, unitPrice}] }
router.post('/', requireAuth, async (req, res) => {
  const { shopId, customerId, channel, status, lines } = req.body;

  if (!shopId || !channel || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: 'shopId, channel and at least one line are required' });
  }

  const db = getUserClient(req.userToken);

  const { data, error } = await db.rpc('create_sale', {
    p_shop_id: shopId,
    p_customer_id: customerId || null,
    p_channel: channel,
    p_lines: lines,
    p_status: status || 'COMPLETE',
  });

  if (error) return res.status(400).json({ error: error.message });

  const { data: sale, error: fetchError } = await db
    .from('sales')
    .select('*, sale_lines(*)')
    .eq('id', data)
    .single();

  if (fetchError) return res.status(400).json({ error: fetchError.message });
  res.status(201).json(sale);
});

// GET /sales?shopId=... - list sales for a shop
router.get('/', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('sales')
    .select('*, sale_lines(*), customers(name)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
