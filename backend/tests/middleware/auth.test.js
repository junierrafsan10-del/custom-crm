const httpMocks = require('node-mocks-http');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const requireAuth = require('../../middleware/auth');
const User = require('../../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-ok';
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

function createReqRes(token) {
  const req = { cookies: token ? { crm_token: token } : {} };
  const res = { status: jest.fn(() => res), json: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
}

describe('requireAuth middleware', () => {
  it('passes with valid token', async () => {
    const user = await User.create({
      username: 'test',
      password: 'hash',
      role: 'Agent',
      tokenVersion: 0
    });
    const token = jwt.sign(
      { id: user._id.toString(), role: 'Agent', tv: 0 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const { req, res, next } = createReqRes(token);
    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(user._id.toString());
  });

  it('rejects missing token', async () => {
    const { req, res, next } = createReqRes(null);
    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects expired token', async () => {
    const user = await User.create({
      username: 'expired',
      password: 'hash',
      role: 'Agent',
      tokenVersion: 0
    });
    const token = jwt.sign(
      { id: user._id.toString(), role: 'Agent', tv: 0 },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );

    const { req, res, next } = createReqRes(token);
    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Session expired, please log in again' })
    );
  });

  it('rejects token with wrong version (logout)', async () => {
    const user = await User.create({
      username: 'loggedout',
      password: 'hash',
      role: 'Agent',
      tokenVersion: 5
    });
    const token = jwt.sign(
      { id: user._id.toString(), role: 'Agent', tv: 0 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const { req, res, next } = createReqRes(token);
    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Session expired, please log in again' })
    );
  });
});
