const bcrypt = require('bcrypt');
const Workspace = require('../models/Workspace');
const File = require('../models/File');

const SALT_ROUNDS = 10;

// POST /api/auth/login
// Handles BOTH creating a new workspace (if it doesn't exist) and logging in (if it does)
const loginOrRegister = async (req, res) => {
  try {
    let { workspaceName, password } = req.body;

    if (!workspaceName || !password) {
      return res.status(400).json({ success: false, message: 'Workspace name and password are required.' });
    }

    workspaceName = workspaceName.trim().toLowerCase();

    if (workspaceName.length < 3) {
      return res.status(400).json({ success: false, message: 'Workspace name must be at least 3 characters.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
    }

    let workspace = await Workspace.findOne({ workspaceName });

    if (!workspace) {
      // Workspace does not exist - create it automatically
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      workspace = await Workspace.create({
        workspaceName,
        password: hashedPassword
      });

      req.session.workspaceId = workspace._id.toString();
      req.session.workspaceName = workspace.workspaceName;

      return res.status(201).json({
        success: true,
        created: true,
        message: `New workspace "${workspace.workspaceName}" created successfully.`,
        workspaceName: workspace.workspaceName
      });
    }

    // Workspace exists - verify password
    const isMatch = await bcrypt.compare(password, workspace.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect Password.' });
    }

    req.session.workspaceId = workspace._id.toString();
    req.session.workspaceName = workspace.workspaceName;

    return res.status(200).json({
      success: true,
      created: false,
      message: 'Login successful.',
      workspaceName: workspace.workspaceName
    });
  } catch (error) {
    console.error('Login/Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Could not log out.' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  });
};

// GET /api/auth/me
const getCurrentWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.session.workspaceId).select('-password');
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    const fileCount = await File.countDocuments({ workspaceId: workspace._id });

    return res.status(200).json({
      success: true,
      workspace: {
        id: workspace._id,
        workspaceName: workspace.workspaceName,
        storageUsed: workspace.storageUsed,
        createdAt: workspace.createdAt,
        fileCount
      }
    });
  } catch (error) {
    console.error('Get current workspace error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'New password must be at least 4 characters.' });
    }

    const workspace = await Workspace.findById(req.session.workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, workspace.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    workspace.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await workspace.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  loginOrRegister,
  logout,
  getCurrentWorkspace,
  changePassword
};
