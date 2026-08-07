const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const {
  uploadFiles,
  listFiles,
  downloadOwnFile,
  deleteFile,
  getSharedFileInfo,
  downloadSharedFile
} = require('../controllers/fileController');
const { requireAuth } = require('../middleware/authMiddleware');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration - keeps original extension, generates unique saved name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  }
});

// Accept any file type (Images, Videos, PDF, ZIP, RAR, Word, Excel, PPT, Audio, etc.)
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 MB per file
  }
});

// Authenticated routes
router.post('/upload', requireAuth, upload.array('files', 20), uploadFiles);
router.get('/', requireAuth, listFiles);
router.get('/download/:id', requireAuth, downloadOwnFile);
router.delete('/:id', requireAuth, deleteFile);

// Public share routes (no auth)
router.get('/share/:shareId', getSharedFileInfo);
router.get('/share/:shareId/download', downloadSharedFile);

module.exports = router;
