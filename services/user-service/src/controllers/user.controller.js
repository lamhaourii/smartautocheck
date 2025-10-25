const UserModel = require('../models/user.model');
const Joi = require('joi');

const updateSchema = Joi.object({
  firstName: Joi.string().min(2).optional(),
  lastName: Joi.string().min(2).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
});

class UserController {
  static async getUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          createdAt: user.created_at
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;

      // Check authorization
      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden'
        });
      }

      // Validate input
      const { error, value } = updateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details
        });
      }

      // Map camelCase to snake_case
      const updates = {};
      if (value.firstName) updates.first_name = value.firstName;
      if (value.lastName) updates.last_name = value.lastName;
      if (value.phone) updates.phone = value.phone;

      const user = await UserModel.update(id, updates);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async listUsers(req, res, next) {
    try {
      // Only admins can list users
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      const [users, total] = await Promise.all([
        UserModel.findAll(limit, offset),
        UserModel.count()
      ]);

      res.json({
        success: true,
        data: users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          createdAt: user.created_at
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
