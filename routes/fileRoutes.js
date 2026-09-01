const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const {
  uploadFiles,
  listFiles,
  downloadOwnFile,
  deleteFile,
  getSharedFileInfo,
  downloadSharedFile
} = require('../controllers/fileController');
const { requireAuth } = require('../middleware/authMiddleware');

// Files are saved directly to local disk on the server
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
    }
  }),
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