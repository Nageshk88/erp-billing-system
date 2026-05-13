require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connect } = require('./src/config/database');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL,
].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);
app.use(errorHandler);

app.get('/health', (req, res) => res.json({ status: 'ok', db: 'mongodb', version: '1.0.0' }));

(async () => {
  try {
    await connect();
    console.log('✅ MongoDB Atlas connected');
    app.listen(PORT, () => console.log(`🚀 ERP Backend running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Startup error:', err.message);
    process.exit(1);
  }
})();
