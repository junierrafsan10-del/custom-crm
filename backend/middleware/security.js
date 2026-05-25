function sanitizeValue(val) {
  if (typeof val === 'string') {
    return val
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }
  if (val && typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map(sanitizeValue);
    }
    const clean = {};
    for (const [k, v] of Object.entries(val)) {
      clean[k] = sanitizeValue(v);
    }
    return clean;
  }
  return val;
}

function xssSanitize(req, _res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

const MONGO_OPERATORS = /^\$|\.\$|\$where|\$regex|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$or|\$and|\$not|\$exists|\$expr|\$eq/i;

function noSqlSanitize(obj) {
  if (Array.isArray(obj)) {
    return obj.map(noSqlSanitize);
  }
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (MONGO_OPERATORS.test(k)) continue;
      clean[k] = noSqlSanitize(v);
    }
    return clean;
  }
  return obj;
}

function mongoIdSanitize(req, _res, next) {
  if (req.body) req.body = noSqlSanitize(req.body);
  if (req.query) req.query = noSqlSanitize(req.query);
  if (req.params) req.params = noSqlSanitize(req.params);
  next();
}

module.exports = { xssSanitize, mongoIdSanitize };
