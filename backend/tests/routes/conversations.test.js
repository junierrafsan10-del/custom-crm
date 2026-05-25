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
app.use(require('../../routes/conversations'));

const Conversation = require('../../models/Conversation');
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

describe('GET /api/messages', () => {
  it('returns conversations with flattened messages', async () => {
    const user = await seedUser({ username: 'msgviewer', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    await Conversation.create({
      ticketId: 1001,
      participantId: 'fb_user1',
      participantName: 'User 1',
      platform: 'facebook',
      status: 'New',
      messages: [{ senderId: 'fb_user1', text: 'Hello', timestamp: Date.now() }]
    });

    const res = await request(app)
      .get('/api/messages')
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(200);
    expect(res.body.conversations.length).toBe(1);
    expect(res.body.messages.length).toBe(1);
  });
});

describe('POST /api/messages/send', () => {
  it('sends a message and creates conversation if needed', async () => {
    const user = await seedUser({ username: 'sender', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/messages/send')
      .set('Cookie', getAuthCookies(token))
      .send({ recipientId: 'fb_newuser', text: 'Hello there!', platform: 'facebook' });

    expect(res.status).toBe(201);
    expect(res.body.data.message.text).toBe('Hello there!');

    const conv = await Conversation.findOne({ participantId: 'fb_newuser' });
    expect(conv).toBeDefined();
    expect(conv.messages.length).toBe(1);
  });

  it('rejects missing recipient', async () => {
    const user = await seedUser({ username: 'norecipient', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/messages/send')
      .set('Cookie', getAuthCookies(token))
      .send({ text: 'Hello' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/conversations/:id', () => {
  it('updates allowed conversation fields only', async () => {
    const user = await seedUser({ username: 'convupdater', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);
    const conv = await Conversation.create({
      ticketId: 2001,
      participantId: 'fb_update',
      status: 'New'
    });

    const res = await request(app)
      .put(`/api/conversations/${conv._id}`)
      .set('Cookie', getAuthCookies(token))
      .send({ status: 'Picked', agent: 'Test Agent' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Picked');
    expect(res.body.data.agent).toBe('Test Agent');
  });

  it('rejects non-allowed fields', async () => {
    const user = await seedUser({ username: 'convblocker', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);
    const conv = await Conversation.create({
      ticketId: 3001,
      participantId: 'fb_block',
      status: 'New'
    });

    const res = await request(app)
      .put(`/api/conversations/${conv._id}`)
      .set('Cookie', getAuthCookies(token))
      .send({ maliciousField: 'hack', __v: 999 });

    expect(res.status).toBe(200);
    const reloaded = await Conversation.findById(conv._id);
    expect(reloaded.maliciousField).toBeUndefined();
    expect(reloaded.__v).not.toBe(999);
  });
});

describe('DELETE /api/conversations/:id', () => {
  it('deletes a conversation', async () => {
    const user = await seedUser({ username: 'convdeleter', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);
    const conv = await Conversation.create({
      ticketId: 4001,
      participantId: 'fb_delete',
      status: 'Closed'
    });

    const res = await request(app)
      .delete(`/api/conversations/${conv._id}`)
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(200);

    const deleted = await Conversation.findById(conv._id);
    expect(deleted).toBeNull();
  });
});
