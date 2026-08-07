// Protects routes that require a logged-in workspace session
const requireAuth = (req, res, next) => {
  if (req.session && req.session.workspaceId) {
    return next();
  }
  return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
};

// Protects page routes - redirects to login instead of JSON error
const requireAuthPage = (req, res, next) => {
  if (req.session && req.session.workspaceId) {
    return next();
  }
  return res.redirect('/');
};

module.exports = { requireAuth, requireAuthPage };
