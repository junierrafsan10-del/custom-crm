const crypto = require('crypto');

function requestId(req, _res, next) {
  req.id = crypto.randomBytes(8).toString('hex');
  if (!req.startTime) {
    req.startTime = Date.now();
  }
  next();
}

module.exports = requestId;
