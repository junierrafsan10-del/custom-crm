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
app.use(require('../../routes/notifications'));

const Notification = require('../../models/Notification');
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

describe('GET /api/notifications', () => {
  it('returns notifications', async () => {
    const user = await seedUser({ username: 'notifviewer', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    await Notification.create({ title: 'Notif 1' });
    await Notification.create({ title: 'Notif 2' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });
});

describe('POST /api/notifications/mark-read', () => {
  it('marks specific notifications as read', async () => {
    const user = await seedUser({ username: 'markreader', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);
    const n1 = await Notification.create({ title: 'N1', unread: true });
    const n2 = await Notification.create({ title: 'N2', unread: true });

    const res = await request(app)
      .post('/api/notifications/mark-read')
      .set('Cookie', getAuthCookies(token))
      .send({ ids: [n1._id.toString()] });

    expect(res.status).toBe(200);

    const updated1 = await Notification.findById(n1._id);
    const updated2 = await Notification.findById(n2._id);
    expect(updated1.unread).toBe(false);
    expect(updated2.unread).toBe(true);
  });

  it('marks all as read when no ids provided', async () => {
    const user = await seedUser({ username: 'markall', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);
    await Notification.create({ title: 'A', unread: true });
    await Notification.create({ title: 'B', unread: true });

    const res = await request(app)
      .post('/api/notifications/mark-read')
      .set('Cookie', getAuthCookies(token))
      .send({});

    expect(res.status).toBe(200);

    const all = await Notification.find({ unread: false });
    expect(all.length).toBe(2);
  });
});
