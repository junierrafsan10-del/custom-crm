function auditLog(req, _res, next) {
  const start = Date.now();
  const originalJson = _res.json.bind(_res);
  _res.json = function (body) {
    const duration = Date.now() - start;
    const userId = req.user?.id || 'anonymous';
    const sensitivePaths = ['/api/users/login', '/api/auth/'];
    const isSensitive = sensitivePaths.some(p => req.path.startsWith(p));
    if (!isSensitive) {
      console.log(
        `[${req.id}] ${req.method} ${req.path} ${_res.statusCode} ${duration}ms user=${userId}`
      );
    }
    return originalJson(body);
  };
  next();
}

function authEvent(action, userId, details = '') {
  console.log(`[AUDIT] action=${action} user=${userId} details=${details} ts=${new Date().toISOString()}`);
}

module.exports = { auditLog, authEvent };
