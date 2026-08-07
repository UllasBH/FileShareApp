const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  workspaceName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 40
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  storageUsed: {
    type: Number,
    default: 0 // in bytes
  }
});

module.exports = mongoose.model('Workspace', workspaceSchema);
