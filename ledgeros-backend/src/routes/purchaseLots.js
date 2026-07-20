const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// POST /purchase-lots - record a stock purchase (adds inventory + its cost)
router.post('/', requireAuth, async (req, res) => {
  const { shopId, productId, quantity, totalCost, channel, purchaseDate } = req.body;

  if (!shopId || !productId || !quantity || totalCost === undefined || !channel) {
    return res.status(400).json({
      error: 'shopId, productId, quantity, totalCost and channel are required',
    });
  }

  const db = getUserClient(req.userToken);

  const { data, error } = await db
    .from('purchase_lots')
    .insert({
      shop_id: shopId,
      product_id: productId,
      quantity,
      total_cost: totalCost,
      channel,
      purchase_date: purchaseDate || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// GET /purchase-lots?productId=... - purchase history for a product
router.get('/', requireAuth, async (req, res) => {
  const { productId } = req.query;
  if (!productId) return res.status(400).json({ error: 'productId query param is required' });

  const db = getUserClient(req.userToken);

  const { data, error } = await db
    .from('purchase_lots')
    .select('*')
    .eq('product_id', productId)
    .order('purchase_date', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
