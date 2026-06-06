const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const deliveryRoutes = require('./routes/deliveries');
const photoRoutes = require('./routes/photos');
const syncRoutes = require('./routes/sync');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 3100;

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limit on login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later.' }
});

// Serve static client files
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Init DB then start server
initDatabase();
app.listen(PORT, () => {
  console.log(`AS Delivery running on http://localhost:${PORT}`);
});
