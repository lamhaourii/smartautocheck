const cron = require('cron');
const db = require('../config/database');
const { sendAppointmentReminder, sendAppointmentReminderSMS } = require('@smartautocheck/notifications');

/**
 * Cron job to send appointment reminders
 * Runs every hour and checks for appointments in the next 24 hours
 */
const appointmentReminderJob = new cron.CronJob(
  '0 * * * *', // Every hour
  async () => {
    console.log('Running appointment reminder check...');

    try {
      // Find appointments scheduled for 24 hours from now (±1 hour window)
      const query = `
        SELECT 
          a.id as appointment_id,
          a.scheduled_date,
          a.service_type,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          v.make,
          v.model,
          v.year,
          v.license_plate
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN vehicles v ON a.vehicle_id = v.id
        WHERE a.status IN ('confirmed', 'pending')
        AND a.scheduled_date BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
        AND (a.reminder_sent IS NULL OR a.reminder_sent = FALSE)
      `;

      const result = await db.query(query);
      const appointments = result.rows;

      console.log(`Found ${appointments.length} appointments needing reminders`);

      for (const appointment of appointments) {
        try {
          const appointmentDate = new Date(appointment.scheduled_date);
          const formattedDate = appointmentDate.toLocaleDateString();
          const formattedTime = appointmentDate.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          const vehicleInfo = appointment.make ? 
            `${appointment.year} ${appointment.make} ${appointment.model} (${appointment.license_plate})` : 
            'Your vehicle';

          // Send email reminder
          await sendAppointmentReminder(appointment.email, {
            customerName: `${appointment.first_name} ${appointment.last_name}`,
            appointmentDate: formattedDate,
            appointmentTime: formattedTime,
            vehicleInfo,
            appointmentUrl: `${process.env.FRONTEND_URL}/appointments/${appointment.appointment_id}`
          });

          // Send SMS reminder if phone number exists
          if (appointment.phone) {
            await sendAppointmentReminderSMS(appointment.phone, {
              appointmentTime: `${formattedDate} at ${formattedTime}`
            });
          }

          // Mark reminder as sent
          await db.query(
            'UPDATE appointments SET reminder_sent = TRUE WHERE id = $1',
            [appointment.appointment_id]
          );

          console.log(`Reminder sent for appointment ${appointment.appointment_id}`);
        } catch (error) {
          console.error(`Failed to send reminder for appointment ${appointment.appointment_id}:`, error);
        }
      }

      console.log('Appointment reminder check completed');
    } catch (error) {
      console.error('Appointment reminder job failed:', error);
    }
  },
  null,
  false,
  'America/New_York'
);

const startCronJobs = () => {
  appointmentReminderJob.start();
  console.log('Appointment reminder cron job started');
};

const stopCronJobs = () => {
  appointmentReminderJob.stop();
  console.log('Appointment reminder cron job stopped');
};

module.exports = {
  startCronJobs,
  stopCronJobs,
  appointmentReminderJob
};
