const express = require('express');
const AppointmentController = require('../controllers/appointment.controller');

const router = express.Router();

router.post('/', AppointmentController.createAppointment);
router.get('/available', AppointmentController.checkAvailability);
router.get('/:id', AppointmentController.getAppointment);
router.put('/:id', AppointmentController.updateAppointment);
router.delete('/:id', AppointmentController.cancelAppointment);
router.get('/', AppointmentController.listAppointments);

module.exports = router;
