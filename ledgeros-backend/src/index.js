require('dotenv').config();
const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health');
const meRoutes = require('./routes/me');
const productsRoutes = require('./routes/products');
const purchaseLotsRoutes = require('./routes/purchaseLots');
const salesRoutes = require('./routes/sales');
const capitalRoutes = require('./routes/capital');
const transfersRoutes = require('./routes/transfers');
const expensesRoutes = require('./routes/expenses');
const customersRoutes = require('./routes/customers');
const suppliersRoutes = require('./routes/suppliers');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/me', meRoutes);
app.use('/products', productsRoutes);
app.use('/purchase-lots', purchaseLotsRoutes);
app.use('/sales', salesRoutes);
app.use('/capital', capitalRoutes);
app.use('/transfers', transfersRoutes);
app.use('/expenses', expensesRoutes);
app.use('/customers', customersRoutes);
app.use('/suppliers', suppliersRoutes);
app.use('/reports', reportsRoutes);

app.listen(PORT, () => {
  console.log(`LedgerOS backend running at http://localhost:${PORT}`);
});
