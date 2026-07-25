const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// POST /returns/sale - return part or all of a sale line (restocks inventory)
// body: { saleLineId, quantityReturned, reason }
router.post('/sale', requireAuth, async (req, res) => {
  const { saleLineId, quantityReturned, reason } = req.body;
  if (!saleLineId || !quantityReturned) {
    return res.status(400).json({ error: 'saleLineId and quantityReturned are required' });
  }

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('create_sale_return', {
    p_sale_line_id: saleLineId,
    p_quantity_returned: quantityReturned,
    p_reason: reason || null,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ returnId: data });
});

// GET /returns/sale?saleLineId=... - return history for one sale line
router.get('/sale', requireAuth, async (req, res) => {
  const { saleLineId } = req.query;
  if (!saleLineId) return res.status(400).json({ error: 'saleLineId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('sale_returns')
    .select('*')
    .eq('sale_line_id', saleLineId)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /returns/purchase - send stock back to a supplier (reduces stock on hand)
// body: { purchaseLotId, quantityReturned, reason }
router.post('/purchase', requireAuth, async (req, res) => {
  const { purchaseLotId, quantityReturned, reason } = req.body;
  if (!purchaseLotId || !quantityReturned) {
    return res.status(400).json({ error: 'purchaseLotId and quantityReturned are required' });
  }

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('create_purchase_return', {
    p_purchase_lot_id: purchaseLotId,
    p_quantity_returned: quantityReturned,
    p_reason: reason || null,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ returnId: data });
});

// GET /returns/purchase?purchaseLotId=... - return history for one purchase lot
router.get('/purchase', requireAuth, async (req, res) => {
  const { purchaseLotId } = req.query;
  if (!purchaseLotId) return res.status(400).json({ error: 'purchaseLotId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('purchase_returns')
    .select('*')
    .eq('purchase_lot_id', purchaseLotId)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
