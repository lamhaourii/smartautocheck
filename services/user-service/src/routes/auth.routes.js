const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Authentication
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);

// Password reset
router.post('/forgot-password', AuthController.requestPasswordReset);
router.post('/reset-password', AuthController.resetPassword);

// Profile
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/preferences', authenticateToken, AuthController.updatePreferences);

module.exports = router;
