const express = require('express');
const requireAuth = require('../middleware/auth');
const router = express.Router();

router.get('/api/tunnel-url', requireAuth, (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host');
  res.json({
    success: true,
    webhookUrl: baseUrl + '/api/webhooks/meta (Tunnel disconnected)'
  });
});

module.exports = router;
