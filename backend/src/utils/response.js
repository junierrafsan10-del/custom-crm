function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function created(res, data) {
  return success(res, data, 201);
}

function noContent(res) {
  return res.status(204).end();
}

function fail(res, error, statusCode = 400) {
  return res.status(statusCode).json({ success: false, error });
}

function paginated(res, { data, cursor, hasMore, total }) {
  const result = { success: true, data };
  if (cursor !== undefined) result.cursor = cursor;
  if (hasMore !== undefined) result.hasMore = hasMore;
  if (total !== undefined) result.total = total;
  return res.status(200).json(result);
}

module.exports = { success, created, noContent, fail, paginated };
