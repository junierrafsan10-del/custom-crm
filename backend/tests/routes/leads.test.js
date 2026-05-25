const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(require('../../middleware/security').xssSanitize);
app.use(require('../../routes/leads'));

const Lead = require('../../models/Lead');
const { seedUser, seedAdmin, seedAgent, getToken, getAuthCookies, seedLeads } = require('../helpers/seed');

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

describe('GET /api/leads', () => {
  it('returns paginated leads', async () => {
    const user = await seedUser({ username: 'leadviewer', password: require('bcryptjs').hashSync('password123', 10) });
    await seedLeads(3);
    const token = getToken(user);

    const res = await request(app)
      .get('/api/leads')
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(3);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/leads', () => {
  it('creates a lead', async () => {
    const user = await seedUser({ username: 'leadcreator', password: require('bcryptjs').hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/leads')
      .set('Cookie', getAuthCookies(token))
      .send({ name: 'New Lead', phone: '+8801700000000', stage: 'Intake', value: 50000 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('New Lead');
  });

  it('rejects missing name', async () => {
    const user = await seedUser({ username: 'badlead', password: require('bcryptjs').hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/leads')
      .set('Cookie', getAuthCookies(token))
      .send({ phone: '+8801700000000' });

    expect(res.status).toBe(400);
  });

  it('rejects invalid stage', async () => {
    const user = await seedUser({ username: 'badstage', password: require('bcryptjs').hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/leads')
      .set('Cookie', getAuthCookies(token))
      .send({ name: 'Test', stage: 'InvalidStage' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/leads/:id', () => {
  it('updates a lead stage', async () => {
    const user = await seedUser({ username: 'leadupdater', password: require('bcryptjs').hashSync('password123', 10) });
    const [lead] = await seedLeads(1);
    const token = getToken(user);

    const res = await request(app)
      .put(`/api/leads/${lead._id}`)
      .set('Cookie', getAuthCookies(token))
      .send({ stage: 'Qualified' });

    expect(res.status).toBe(200);
    expect(res.body.data.stage).toBe('Qualified');
  });

  it('rejects mass assignment of non-allowed fields', async () => {
    const user = await seedUser({ username: 'massassign', password: require('bcryptjs').hashSync('password123', 10) });
    const [lead] = await seedLeads(1);
    const token = getToken(user);

    const res = await request(app)
      .put(`/api/leads/${lead._id}`)
      .set('Cookie', getAuthCookies(token))
      .send({ stage: 'Qualified', __v: 999, unknownField: 'should-not-pass' });

    expect(res.status).toBe(200);
    const reloaded = await Lead.findById(lead._id);
    expect(reloaded.__v).not.toBe(999);
  });
});

describe('DELETE /api/leads/:id', () => {
  it('deletes a lead (admin only)', async () => {
    const admin = await seedAdmin();
    const [lead] = await seedLeads(1);
    const token = getToken(admin);

    const res = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(200);

    const deleted = await Lead.findById(lead._id);
    expect(deleted).toBeNull();
  });

  it('rejects non-admin deletion', async () => {
    const agent = await seedAgent();
    const [lead] = await seedLeads(1);
    const token = getToken(agent);

    const res = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(403);
  });
});
