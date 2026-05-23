require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const leadRoutes = require('./routes/leads');
const conversationRoutes = require('./routes/conversations');
const customerRoutes = require('./routes/customers');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const tunnelRoutes = require('./routes/tunnel');
const taskRoutes = require('./routes/tasks');

app.use(authRoutes);
app.use(userRoutes);
app.use(leadRoutes);
app.use(conversationRoutes);
app.use(customerRoutes);
app.use(notificationRoutes);
app.use(uploadRoutes);
app.use(tunnelRoutes);
app.use(taskRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

async function seedDefaultUsers() {
  const count = await User.countDocuments();
  if (count === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const agentHash = bcrypt.hashSync('agent123', 10);
    await User.create({ username: 'admin', password: adminHash, name: 'Admin', role: 'Admin' });
    await User.create({ username: 'agent', password: agentHash, name: 'Support Member A', role: 'Agent' });
    console.log('Default users seeded (admin / admin123) and (agent / agent123)');
  }
}

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    console.error('Make sure MONGODB_URI is set correctly in backend/.env');
    process.exit(1);
  }
  await seedDefaultUsers();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
