const requireAdmin = require('../../middleware/requireAdmin');

function createReqRes(role) {
  const req = { user: { id: 'someid', role } };
  const res = { status: jest.fn(() => res), json: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
}

describe('requireAdmin middleware', () => {
  it('passes for admin role', () => {
    const { req, res, next } = createReqRes('Admin');
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects agent role', () => {
    const { req, res, next } = createReqRes('Agent');
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects missing user', () => {
    const req = {};
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
