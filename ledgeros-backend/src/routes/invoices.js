const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getUserClient } = require('../config/supabaseClient');

const router = express.Router();

// Adds a computed "effectiveStatus": pending | overdue | paid
// (overdue isn't a stored value — it's PENDING + past its due date)
function withEffectiveStatus(invoice) {
  const isPastDue = new Date(invoice.due_date) < new Date(new Date().toDateString());
  const effectiveStatus =
    invoice.status === 'PAID' ? 'paid' : isPastDue ? 'overdue' : 'pending';
  return { ...invoice, effectiveStatus };
}

// POST /invoices - create a new invoice
router.post('/', requireAuth, async (req, res) => {
  const { shopId, customerId, customerName, amount, dueDate } = req.body;
  if (!shopId || !customerName || !amount || !dueDate) {
    return res.status(400).json({ error: 'shopId, customerName, amount and dueDate are required' });
  }

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('invoices')
    .insert({
      shop_id: shopId,
      customer_id: customerId || null,
      customer_name: customerName,
      amount,
      due_date: dueDate,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(withEffectiveStatus(data));
});

// GET /invoices?shopId=...
router.get('/', requireAuth, async (req, res) => {
  const { shopId } = req.query;
  if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });

  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('invoices')
    .select('*')
    .eq('shop_id', shopId)
    .order('due_date', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json((data || []).map(withEffectiveStatus));
});

// PATCH /invoices/:id/pay - mark an invoice as paid
router.patch('/:id/pay', requireAuth, async (req, res) => {
  const db = getUserClient(req.userToken);
  const { data, error } = await db
    .from('invoices')
    .update({ status: 'PAID', paid_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(withEffectiveStatus(data));
});

module.exports = router;
