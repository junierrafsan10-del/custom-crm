const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(require('../../middleware/security').xssSanitize);
app.use(require('../../routes/upload'));

const { seedUser, getToken, getAuthCookies } = require('../helpers/seed');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-ok';
  process.env.NODE_ENV = 'test';
  process.env.UPLOAD_MAX_BYTES = '5242880';
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
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    }
  }
});

function base64Image() {
  const buf = Buffer.alloc(100, 0xFF);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

describe('POST /api/upload', () => {
  it('uploads a valid image file', async () => {
    const user = await seedUser({ username: 'uploader', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', getAuthCookies(token))
      .send({ name: 'test-image.png', data: base64Image() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fileUrl).toMatch(/^\/uploads\//);
    expect(res.body.data.filename).toMatch(/\.png$/);
  });

  it('rejects disallowed file type', async () => {
    const user = await seedUser({ username: 'baduploader', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);
    const buf = Buffer.alloc(100, 0xFF);

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', getAuthCookies(token))
      .send({ name: 'malware.exe', data: `data:application/x-msdownload;base64,${buf.toString('base64')}` });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('not allowed');
  });

  it('rejects missing file data', async () => {
    const user = await seedUser({ username: 'noupload', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', getAuthCookies(token))
      .send({ name: 'test.png' });

    expect(res.status).toBe(400);
  });

  it('rejects non-string data', async () => {
    const user = await seedUser({ username: 'invalidupload', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', getAuthCookies(token))
      .send({ name: 'test.png', data: 12345 });

    expect(res.status).toBe(400);
  });

  it('rejects path traversal attempts', async () => {
    const user = await seedUser({ username: 'pathtraversal', password: bcrypt.hashSync('password123', 10) });
    const token = getToken(user);

    const res = await request(app)
      .post('/api/upload')
      .set('Cookie', getAuthCookies(token))
      .send({ name: '../../etc/passwd.png', data: base64Image() });

    expect(res.status).toBe(200);
    expect(res.body.data.filename).not.toContain('..');
    expect(res.body.data.filename).not.toContain('etc');
  });
});
