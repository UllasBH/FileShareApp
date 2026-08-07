const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  originalName: {
    type: String,
    required: true
  },
  savedName: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  downloads: {
    type: Number,
    default: 0
  },
  shareId: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('File', fileSchema);
