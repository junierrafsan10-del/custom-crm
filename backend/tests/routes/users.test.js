const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(require('../../middleware/security').xssSanitize);
app.use(require('../../routes/users'));

const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { seedUser, seedAdmin, seedAgent, getToken, getAuthCookies } = require('../helpers/seed');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-ok';
  process.env.NODE_ENV = 'test';
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

describe('GET /api/users', () => {
  it('returns paginated users without passwords', async () => {
    const admin = await seedAdmin();
    await seedAgent();
    const token = getToken(admin);

    const res = await request(app)
      .get('/api/users')
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    expect(res.body.users[0]).not.toHaveProperty('password');
    expect(res.body.users[0]).not.toHaveProperty('loginAttempts');
    expect(res.body.users[0]).not.toHaveProperty('tokenVersion');
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/users/create', () => {
  it('creates a user (admin only)', async () => {
    const admin = await seedAdmin();
    const token = getToken(admin);

    const res = await request(app)
      .post('/api/users/create')
      .set('Cookie', getAuthCookies(token))
      .send({ username: 'newagent', password: 'agentpass123', name: 'New Agent', role: 'Agent' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('newagent');
    expect(res.body.data).not.toHaveProperty('password');

    const dbUser = await User.findOne({ username: 'newagent' });
    expect(dbUser).toBeDefined();
  });

  it('rejects duplicate username', async () => {
    await seedUser({ username: 'dupuser', password: bcrypt.hashSync('password123', 10) });
    const admin = await seedAdmin();
    const token = getToken(admin);

    const res = await request(app)
      .post('/api/users/create')
      .set('Cookie', getAuthCookies(token))
      .send({ username: 'dupuser', password: 'anotherpass123' });

    expect(res.status).toBe(409);
  });

  it('rejects weak password', async () => {
    const admin = await seedAdmin();
    const token = getToken(admin);

    const res = await request(app)
      .post('/api/users/create')
      .set('Cookie', getAuthCookies(token))
      .send({ username: 'weakpwuser', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('rejects non-admin users', async () => {
    const agent = await seedAgent();
    const token = getToken(agent);

    const res = await request(app)
      .post('/api/users/create')
      .set('Cookie', getAuthCookies(token))
      .send({ username: 'shouldfail', password: 'password123' });

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/users/:id', () => {
  it('updates a user', async () => {
    const admin = await seedAdmin();
    const target = await seedUser({ username: 'targetuser', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(admin);

    const res = await request(app)
      .put(`/api/users/${target._id}`)
      .set('Cookie', getAuthCookies(token))
      .send({ name: 'Updated Name', email: 'updated@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
  });

  it('rejects invalid MongoDB ID', async () => {
    const admin = await seedAdmin();
    const token = getToken(admin);

    const res = await request(app)
      .put('/api/users/invalid-id')
      .set('Cookie', getAuthCookies(token))
      .send({ name: 'New Name' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/:id', () => {
  it('deletes a non-admin user', async () => {
    const admin = await seedAdmin();
    const target = await seedAgent();
    const token = getToken(admin);

    const res = await request(app)
      .delete(`/api/users/${target._id}`)
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deleted = await User.findById(target._id);
    expect(deleted).toBeNull();
  });

  it('prevents deleting the last admin', async () => {
    const admin = await seedAdmin();
    const token = getToken(admin);

    const res = await request(app)
      .delete(`/api/users/${admin._id}`)
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(400);
  });

  it('prevents self-deletion', async () => {
    const admin = await seedAdmin();
    const token = getToken(admin);

    const res = await request(app)
      .delete(`/api/users/${admin._id}`)
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(400);
  });
});
