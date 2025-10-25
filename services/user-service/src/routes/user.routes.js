const express = require('express');
const UserController = require('../controllers/user.controller');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles('admin'), UserController.listUsers);
router.get('/:id', authenticateToken, UserController.getUser);
router.put('/:id', authenticateToken, UserController.updateUser);

module.exports = router;
