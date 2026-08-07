const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const File = require('../models/File');
const Workspace = require('../models/Workspace');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// POST /api/files/upload
// Handles single or multiple file uploads (multer populates req.files)
const uploadFiles = async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const workspaceId = req.session.workspaceId;
    const savedFiles = [];
    let totalSizeAdded = 0;

    for (const file of files) {
      const shareId = nanoid(10);

      const newFile = await File.create({
        workspaceId,
        originalName: file.originalname,
        savedName: file.filename,
        size: file.size,
        mimeType: file.mimetype || 'application/octet-stream',
        shareId
      });

      totalSizeAdded += file.size;
      savedFiles.push(newFile);
    }

    await Workspace.findByIdAndUpdate(workspaceId, {
      $inc: { storageUsed: totalSizeAdded }
    });

    return res.status(201).json({
      success: true,
      message: `${savedFiles.length} file(s) uploaded successfully.`,
      files: savedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, message: 'File upload failed.' });
  }
};

// GET /api/files
// Lists all files belonging to the logged-in workspace, supports ?search=
const listFiles = async (req, res) => {
  try {
    const workspaceId = req.session.workspaceId;
    const search = (req.query.search || '').trim();

    const query = { workspaceId };
    if (search) {
      query.originalName = { $regex: search, $options: 'i' };
    }

    const files = await File.find(query).sort({ uploadedAt: -1 });

    return res.status(200).json({ success: true, files });
  } catch (error) {
    console.error('List files error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch files.' });
  }
};

// GET /api/files/download/:id  (owner download, requires auth)
const downloadOwnFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, workspaceId: req.session.workspaceId });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const filePath = path.join(UPLOAD_DIR, file.savedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File missing from storage.' });
    }

    file.downloads += 1;
    await file.save();

    return res.download(filePath, file.originalName);
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ success: false, message: 'Download failed.' });
  }
};

// DELETE /api/files/:id
const deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, workspaceId: req.session.workspaceId });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const filePath = path.join(UPLOAD_DIR, file.savedName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Workspace.findByIdAndUpdate(file.workspaceId, {
      $inc: { storageUsed: -file.size }
    });

    await File.deleteOne({ _id: file._id });

    return res.status(200).json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ success: false, message: 'Delete failed.' });
  }
};

// GET /api/files/share/:shareId  (public, no auth required)
const getSharedFileInfo = async (req, res) => {
  try {
    const file = await File.findOne({ shareId: req.params.shareId });

    if (!file) {
      return res.status(404).json({ success: false, message: 'Shared file not found.' });
    }

    return res.status(200).json({
      success: true,
      file: {
        originalName: file.originalName,
        size: file.size,
        uploadedAt: file.uploadedAt,
        mimeType: file.mimeType,
        shareId: file.shareId,
        downloads: file.downloads
      }
    });
  } catch (error) {
    console.error('Get shared file error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/files/share/:shareId/download  (public, no auth required)
const downloadSharedFile = async (req, res) => {
  try {
    const file = await File.findOne({ shareId: req.params.shareId });

    if (!file) {
      return res.status(404).json({ success: false, message: 'Shared file not found.' });
    }

    const filePath = path.join(UPLOAD_DIR, file.savedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File missing from storage.' });
    }

    file.downloads += 1;
    await file.save();

    return res.download(filePath, file.originalName);
  } catch (error) {
    console.error('Shared download error:', error);
    return res.status(500).json({ success: false, message: 'Download failed.' });
  }
};

module.exports = {
  uploadFiles,
  listFiles,
  downloadOwnFile,
  deleteFile,
  getSharedFileInfo,
  downloadSharedFile
};
