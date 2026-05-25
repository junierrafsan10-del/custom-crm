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
app.use(require('../../routes/tasks'));

const Task = require('../../models/Task');
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

describe('GET /api/tasks', () => {
  it('returns paginated tasks', async () => {
    const user = await seedUser({ username: 'taskviewer', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);
    await Task.create({ title: 'Task 1' });
    await Task.create({ title: 'Task 2' });

    const res = await request(app)
      .get('/api/tasks')
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });
});

describe('POST /api/tasks', () => {
  it('creates a task', async () => {
    const user = await seedUser({ username: 'taskcreator', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', getAuthCookies(token))
      .send({ title: 'New Task', priority: 'High', status: 'Open' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('New Task');
    expect(res.body.data.priority).toBe('High');
  });

  it('rejects missing title', async () => {
    const user = await seedUser({ username: 'notitle', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', getAuthCookies(token))
      .send({ priority: 'High' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/tasks/:id', () => {
  it('updates a task with whitelisted fields only', async () => {
    const user = await seedUser({ username: 'taskupdater', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);
    const task = await Task.create({ title: 'Original Task', status: 'Open' });

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Cookie', getAuthCookies(token))
      .send({ status: 'Closed', maliciousField: 'hack' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Closed');

    const reloaded = await Task.findById(task._id);
    expect(reloaded.maliciousField).toBeUndefined();
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task', async () => {
    const user = await seedUser({ username: 'taskdeleter', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);
    const task = await Task.create({ title: 'To Delete' });

    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Cookie', getAuthCookies(token));

    expect(res.status).toBe(200);

    const deleted = await Task.findById(task._id);
    expect(deleted).toBeNull();
  });
});
