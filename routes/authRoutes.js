const express = require('express');
const router = express.Router();
const {
  loginOrRegister,
  logout,
  getCurrentWorkspace,
  changePassword
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/login', loginOrRegister);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getCurrentWorkspace);
router.post('/change-password', requireAuth, changePassword);

module.exports = router;
