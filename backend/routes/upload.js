const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, DEFAULT_VALUES } = require('../src/constants');

const ALLOWED_MIME_TYPES_SET = new Set(ALLOWED_MIME_TYPES);
const ALLOWED_EXTENSIONS_SET = new Set(ALLOWED_EXTENSIONS);
const MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_BYTES, 10) || DEFAULT_VALUES.UPLOAD_MAX_BYTES;

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

router.post('/api/upload', requireAuth, (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ success: false, error: 'File name and data are required' });
    }
    if (typeof name !== 'string' || typeof data !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid file data' });
    }

    const matches = data.match(/^data:(.+?);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, error: 'Invalid base64 data format' });
    }

    const mimeType = matches[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES_SET.has(mimeType)) {
      return res.status(400).json({ success: false, error: `File type ${mimeType} is not allowed` });
    }

    const ext = path.extname(name).toLowerCase();
    if (!ALLOWED_EXTENSIONS_SET.has(ext)) {
      return res.status(400).json({ success: false, error: `File extension ${ext} is not allowed` });
    }

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_FILE_SIZE) {
      const maxMB = Math.round(MAX_FILE_SIZE / 1024 / 1024);
      return res.status(400).json({ success: false, error: `File exceeds maximum size of ${maxMB}MB` });
    }

    const safeName = crypto.randomBytes(16).toString('hex') + ext;
    const safePath = path.join(UPLOAD_DIR, safeName);

    if (!safePath.startsWith(UPLOAD_DIR)) {
      return res.status(400).json({ success: false, error: 'Invalid file path' });
    }

    fs.writeFileSync(safePath, buffer);

    const fileUrl = `/uploads/${safeName}`;
    res.json({ success: true, fileUrl, data: { url: fileUrl, filename: safeName } });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: 'File upload failed' });
  }
});

module.exports = router;
