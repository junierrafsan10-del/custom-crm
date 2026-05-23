const express = require('express');
const path = require('path');
const fs = require('fs');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/api/upload', requireAuth, (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ success: false, error: 'File name and data are required' });
    }
    const matches = data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, error: 'Invalid base64 data' });
    }
    const ext = path.extname(name) || '.bin';
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    const filepath = path.join(__dirname, '..', 'uploads', filename);
    fs.writeFileSync(filepath, matches[2], 'base64');
    const fileUrl = `/uploads/${filename}`;
    res.json({ success: true, fileUrl, data: { url: fileUrl, filename } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
