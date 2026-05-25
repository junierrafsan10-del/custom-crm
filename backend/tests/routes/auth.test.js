const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(require('../../middleware/security').xssSanitize);
app.use(require('../../routes/auth'));

const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { seedUser, seedAdmin, getToken, getAuthCookies } = require('../helpers/seed');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-ok';
  process.env.NODE_ENV = 'test';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('POST /api/users/login', () => {
  beforeEach(async () => {
    await seedUser({
      username: 'testuser',
      password: bcrypt.hashSync('password123', 10),
      role: 'Agent',
      loginAttempts: 0,
      lockoutUntil: null
    });
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('testuser');
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('crm_token');
  });

  it('rejects missing credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ username: '', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects invalid username', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ username: 'nonexistent', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ username: 'testuser', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('locks account after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/users/login')
        .send({ username: 'testuser', password: 'wrongpassword' });
    }

    const res = await request(app)
      .post('/api/users/login')
      .send({ username: 'testuser', password: 'wrongpassword' });

    expect(res.status).toBe(429);
    expect(res.body.error).toContain('locked');
  });
});

describe('POST /api/auth/logout', () => {
  it('clears cookie and increments tokenVersion', async () => {
    const user = await seedUser({
      username: 'logouttest',
      password: bcrypt.hashSync('password123', 10),
      tokenVersion: 0
    });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await User.findById(user._id);
    expect(updated.tokenVersion).toBe(1);
  });
});

describe('POST /api/auth/change-password', () => {
  it('changes password successfully', async () => {
    const user = await seedUser({
      username: 'changepw',
      password: bcrypt.hashSync('oldpassword123', 10),
      role: 'Agent'
    });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', getAuthCookies(token))
      .send({ currentPassword: 'oldpassword123', newPassword: 'newpassword123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await User.findById(user._id);
    const match = bcrypt.compareSync('newpassword123', updated.password);
    expect(match).toBe(true);
    expect(updated.tokenVersion).toBeGreaterThan(0);
  });

  it('rejects weak new password', async () => {
    const user = await seedUser({
      username: 'weakpw',
      password: bcrypt.hashSync('password123', 10)
    });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', getAuthCookies(token))
      .send({ currentPassword: 'password123', newPassword: 'short' });

    expect(res.status).toBe(400);
  });

  it('rejects wrong current password', async () => {
    const user = await seedUser({
      username: 'wrongpw',
      password: bcrypt.hashSync('password123', 10)
    });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', getAuthCookies(token))
      .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/status', () => {
  it('returns server status', async () => {
    const res = await request(app).get('/api/auth/status');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Server is running');
  });
});

describe('POST /api/auth/meta-callback', () => {
  it('rejects missing authorization code', async () => {
    const user = await seedUser({ username: 'meta', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/auth/meta-callback')
      .set('Cookie', getAuthCookies(token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Authorization code is required');
  });

  it('rejects non-string code', async () => {
    const user = await seedUser({ username: 'meta2', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/auth/meta-callback')
      .set('Cookie', getAuthCookies(token))
      .send({ code: 12345 });

    expect(res.status).toBe(400);
  });
});
