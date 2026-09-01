const express = require('express');
const router = express.Router();
const multer = require('multer');

const {
  uploadFiles,
  listFiles,
  downloadOwnFile,
  deleteFile,
  getSharedFileInfo,
  downloadSharedFile
} = require('../controllers/fileController');
const { requireAuth } = require('../middleware/authMiddleware');

// Files are held in memory just long enough to stream straight to Cloudflare R2 -
// nothing touches local disk, so storage isn't limited by the server's disk size.
const upload = multer({
  storage: multer.memoryStorage(),
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