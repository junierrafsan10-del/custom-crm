const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(require('../../middleware/security').xssSanitize);
app.use(require('../../routes/customers'));

const Customer = require('../../models/Customer');
const { seedUser, getToken, getAuthCookies } = require('../helpers/seed');

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

describe('GET /api/customers', () => {
  it('returns all customers', async () => {
    const user = await seedUser({ username: 'customerviewer', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    await Customer.create({ name: 'Customer A', phone: '+8801700000001' });
    await Customer.create({ name: 'Customer B', phone: '+8801700000002' });

    const res = await request(app)
      .get('/api/customers')
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });
});

describe('POST /api/customers/update', () => {
  it('updates a customer', async () => {
    const user = await seedUser({ username: 'customerupdater', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);
    const customer = await Customer.create({ name: 'Old Name', phone: '+8801700000001' });

    const res = await request(app)
      .post('/api/customers/update')
      .set('Cookie', getAuthCookies(token))
      .send({ id: customer._id.toString(), name: 'New Name', notes: 'Updated notes' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New Name');
    expect(res.body.data.notes).toBe('Updated notes');
  });

  it('rejects invalid customer ID', async () => {
    const user = await seedUser({ username: 'badcust', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/customers/update')
      .set('Cookie', getAuthCookies(token))
      .send({ id: 'invalid-id', name: 'New Name' });

    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/customers/update')
      .send({ id: new mongoose.Types.ObjectId().toString(), name: 'New Name' });

    expect(res.status).toBe(401);
  });
});
