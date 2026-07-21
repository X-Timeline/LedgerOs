const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'LedgerOS backend is running' });
});

module.exports = router;
