const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// POST /products - add a new product to a shop
// body: { shopId, name, baseUnit, costingMethod, sellUnits?: [{ name, conversionToBase }] }
router.post('/', requireAuth, async (req, res) => {
  const { shopId, name, baseUnit, costingMethod, sellUnits } = req.body;

  if (!shopId || !name || !baseUnit) {
    return res.status(400).json({ error: 'shopId, name and baseUnit are required' });
  }

  const db = getUserClient(req.userToken);

  const { data: product, error } = await db
    .from('products')
    .insert({
      shop_id: shopId,
      name,
      base_unit: baseUnit,
      costing_method: costingMethod || 'FIFO',
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (Array.isArray(sellUnits) && sellUnits.length > 0) {
    const { error: unitsError } = await db.from('product_units').insert(
      sellUnits.map((u) => ({
        product_id: product.id,
        unit_name: u.name,
        conversion_to_base: u.conversionToBase,
      }))
    );
    if (unitsError) return res.status(400).json({ error: unitsError.message });
  }

  res.status(201).json(product);
});

// POST /products/:id/units - add a sell-unit conversion to an existing product
// body: { name, conversionToBase }
router.post('/:id/units', requireAuth, async (req, res) => {
  const { name, conversionToBase } = req.body;
  if (!name || !conversionToBase) {
    return res.status(400).json({ error: 'name and conversionToBase are required' });
  }

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('product_units')
    .insert({ product_id: req.params.id, unit_name: name, conversion_to_base: conversionToBase })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// GET /products?shopId=... - list all products for a shop, with their sell
// units and purchase lots embedded so the frontend doesn't need N+1 requests
router.get('/', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);

  const { data, error } = await db
    .from('products')
    .select('*, product_units(*), purchase_lots(*)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /products/:id/stock - current stock level and value for one product
router.get('/:id/stock', requireAuth, async (req, res) => {
  const db = getUserClient(req.userToken);

  const { data, error } = await db
    .from('purchase_lots')
    .select('remaining_quantity, quantity, total_cost')
    .eq('product_id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });

  const totalRemaining = data.reduce((sum, lot) => sum + Number(lot.remaining_quantity), 0);
  const totalValue = data.reduce((sum, lot) => {
    const unitCost = lot.quantity > 0 ? lot.total_cost / lot.quantity : 0;
    return sum + unitCost * lot.remaining_quantity;
  }, 0);

  res.json({
    remainingQuantity: totalRemaining,
    remainingValue: Math.round(totalValue * 100) / 100,
  });
});

module.exports = router;
