require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const config = require('./utils/env');
const logger = require('./src/utils/logger');
const requestId = require('./utils/requestId');
const { xssSanitize, mongoIdSanitize } = require('./middleware/security');
const { auditLog } = require('./middleware/audit');
const { errorHandler, notFoundHandler } = require('./utils/errors');

const app = express();

app.set('trust proxy', 1);

app.use(compression());

app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
}));

app.use(express.json({ limit: config.BODY_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

app.use(requestId);
app.use(auditLog);
app.use(xssSanitize);
app.use(mongoIdSanitize);

const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir, {
  dotfiles: 'deny',
  index: false,
  maxAge: '1d'
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' }
});
app.use('/api/', globalLimiter);

app.use('/api/', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const xrw = req.headers['x-requested-with'];
    if (xrw && xrw !== 'XMLHttpRequest') {
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }
  }
  next();
});

app.use(require('./routes/auth'));
app.use(require('./routes/users'));
app.use(require('./routes/leads'));
app.use(require('./routes/conversations'));
app.use(require('./routes/customers'));
app.use(require('./routes/notifications'));
app.use(require('./routes/upload'));
app.use(require('./routes/tunnel'));
app.use(require('./routes/tasks'));

const startTime = Date.now();

app.get('/api/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    success: true,
    data: {
      status: dbState === 1 ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      mongodb: dbStatus[dbState] || 'unknown',
      memory: process.memoryUsage(),
      pid: process.pid
    }
  });
});

app.get('/api/ready', (_req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.json({ success: true, data: { status: 'ready' } });
  } else {
    res.status(503).json({ success: false, error: 'Database not connected' });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

let server;

async function start() {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10
    });
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('Failed to connect to MongoDB', { error: err.message });
    process.exit(1);
  }

  server = app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  });
}

function gracefulShutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start().catch(err => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});

module.exports = app;
