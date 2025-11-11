const express = require('express');
const AppointmentController = require('../controllers/appointment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', authenticateToken, AppointmentController.createAppointment);
router.get('/available', AppointmentController.checkAvailability);
router.get('/:id', authenticateToken, AppointmentController.getAppointment);
router.put('/:id', authenticateToken, AppointmentController.updateAppointment);
router.delete('/:id', authenticateToken, AppointmentController.cancelAppointment);
router.get('/', authenticateToken, AppointmentController.listAppointments);

module.exports = router;
