const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

function defaultRange(req) {
  const start = req.query.start || '1900-01-01T00:00:00Z';
  const end = req.query.end || new Date().toISOString();
  return { start, end };
}

// GET /reports/cash-book?shopId=&start=&end=
router.get('/cash-book', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  const { start, end } = defaultRange(req);
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('get_cash_book', { p_shop_id: shopId, p_start: start, p_end: end });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /reports/trading-account?shopId=&start=&end=
router.get('/trading-account', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  const { start, end } = defaultRange(req);
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('get_trading_account', { p_shop_id: shopId, p_start: start, p_end: end });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /reports/profit-and-loss?shopId=&start=&end=
router.get('/profit-and-loss', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  const { start, end } = defaultRange(req);
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('get_profit_and_loss', { p_shop_id: shopId, p_start: start, p_end: end });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /reports/balance-sheet?shopId=&asOf=
router.get('/balance-sheet', requireAuth, async (req, res) => {
  const { shopId, asOf } = req.query;
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('get_balance_sheet', {
    p_shop_id: shopId,
    p_as_of: asOf || new Date().toISOString(),
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /reports/inventory-aging?shopId=
router.get('/inventory-aging', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('get_inventory_aging', { p_shop_id: shopId });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /reports/business/cash-book?businessId=&start=&end=
router.get('/business/cash-book', requireAuth, async (req, res) => {
  const { businessId } = req.query;
  const { start, end } = defaultRange(req);
  if (!businessId) return res.status(400).json({ error: 'businessId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('get_business_cash_book', {
    p_business_id: businessId, p_start: start, p_end: end,
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /reports/business/profit-and-loss?businessId=&start=&end=
router.get('/business/profit-and-loss', requireAuth, async (req, res) => {
  const { businessId } = req.query;
  const { start, end } = defaultRange(req);
  if (!businessId) return res.status(400).json({ error: 'businessId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('get_business_profit_and_loss', {
    p_business_id: businessId, p_start: start, p_end: end,
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /reports/business/trading-account?businessId=&start=&end=
router.get('/business/trading-account', requireAuth, async (req, res) => {
  const { businessId } = req.query;
  const { start, end } = defaultRange(req);
  if (!businessId) return res.status(400).json({ error: 'businessId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('get_business_trading_account', {
    p_business_id: businessId, p_start: start, p_end: end,
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /reports/business/balance-sheet?businessId=&asOf=
router.get('/business/balance-sheet', requireAuth, async (req, res) => {
  const { businessId, asOf } = req.query;
  if (!businessId) return res.status(400).json({ error: 'businessId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db.rpc('get_business_balance_sheet', {
    p_business_id: businessId, p_as_of: asOf || new Date().toISOString(),
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
