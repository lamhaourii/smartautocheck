const db = require('../config/database');

class ConflictDetectionService {
  /**
   * Check if inspector has conflicting appointments
   */
  async checkInspectorAvailability(inspectorId, scheduledDate, appointmentId = null) {
    const startTime = new Date(scheduledDate);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours

    let query = `
      SELECT id FROM appointments
      WHERE inspector_id = $1
      AND status NOT IN ('cancelled', 'completed')
      AND (
        (scheduled_date >= $2 AND scheduled_date < $3)
        OR (scheduled_date + INTERVAL '2 hours' > $2 AND scheduled_date < $3)
      )
    `;

    const params = [inspectorId, startTime, endTime];

    // Exclude current appointment if updating
    if (appointmentId) {
      query += ' AND id != $4';
      params.push(appointmentId);
    }

    const result = await db.query(query, params);
    return result.rows.length === 0; // Returns true if available
  }

  /**
   * Check if time slot is within business hours
   */
  isWithinBusinessHours(scheduledDate) {
    const date = new Date(scheduledDate);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Monday to Friday: 8 AM - 6 PM
    // Saturday: 9 AM - 3 PM
    // Sunday: Closed

    if (dayOfWeek === 0) {
      return { valid: false, reason: 'We are closed on Sundays' };
    }

    if (dayOfWeek === 6) {
      if (hour < 9 || hour >= 15) {
        return { valid: false, reason: 'Saturday hours are 9 AM - 3 PM' };
      }
    } else {
      if (hour < 8 || hour >= 18) {
        return { valid: false, reason: 'Weekday hours are 8 AM - 6 PM' };
      }
    }

    return { valid: true };
  }

  /**
   * Check if appointment is too soon
   */
  isAdvanceNoticeValid(scheduledDate) {
    const now = new Date();
    const appointment = new Date(scheduledDate);
    const hoursUntilAppointment = (appointment - now) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 2) {
      return { 
        valid: false, 
        reason: 'Appointments must be scheduled at least 2 hours in advance' 
      };
    }

    if (hoursUntilAppointment > 90 * 24) { // 90 days
      return { 
        valid: false, 
        reason: 'Appointments cannot be scheduled more than 90 days in advance' 
      };
    }

    return { valid: true };
  }

  /**
   * Check if date is in the past
   */
  isDateValid(scheduledDate) {
    const now = new Date();
    const appointment = new Date(scheduledDate);

    if (appointment < now) {
      return { valid: false, reason: 'Cannot schedule appointments in the past' };
    }

    return { valid: true };
  }

  /**
   * Find available time slots for a given date
   */
  async findAvailableSlots(date, inspectorId = null) {
    const startOfDay = new Date(date);
    startOfDay.setHours(8, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(18, 0, 0, 0);

    // Get all booked appointments for the date
    let query = `
      SELECT scheduled_date
      FROM appointments
      WHERE DATE(scheduled_date) = DATE($1)
      AND status NOT IN ('cancelled', 'completed')
    `;
    const params = [date];

    if (inspectorId) {
      query += ' AND inspector_id = $2';
      params.push(inspectorId);
    }

    const result = await db.query(query, params);
    const bookedSlots = result.rows.map(row => new Date(row.scheduled_date));

    // Generate all possible 30-minute slots
    const allSlots = [];
    let currentSlot = new Date(startOfDay);

    while (currentSlot < endOfDay) {
      const businessHoursCheck = this.isWithinBusinessHours(currentSlot);
      if (businessHoursCheck.valid) {
        allSlots.push(new Date(currentSlot));
      }
      currentSlot = new Date(currentSlot.getTime() + 30 * 60 * 1000); // +30 minutes
    }

    // Filter out booked slots (appointments take 2 hours)
    const availableSlots = allSlots.filter(slot => {
      return !bookedSlots.some(booked => {
        const diff = Math.abs(slot - booked) / (1000 * 60); // Difference in minutes
        return diff < 120; // Within 2 hours
      });
    });

    return availableSlots.map(slot => ({
      time: slot.toISOString(),
      display: slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  }

  /**
   * Comprehensive validation before booking
   */
  async validateAppointment(appointmentData, appointmentId = null) {
    const { scheduled_date, inspector_id } = appointmentData;
    const errors = [];

    // Check if date is valid (not in past)
    const dateCheck = this.isDateValid(scheduled_date);
    if (!dateCheck.valid) {
      errors.push(dateCheck.reason);
    }

    // Check advance notice
    const advanceCheck = this.isAdvanceNoticeValid(scheduled_date);
    if (!advanceCheck.valid) {
      errors.push(advanceCheck.reason);
    }

    // Check business hours
    const businessHoursCheck = this.isWithinBusinessHours(scheduled_date);
    if (!businessHoursCheck.valid) {
      errors.push(businessHoursCheck.reason);
    }

    // Check inspector availability
    if (inspector_id) {
      const isAvailable = await this.checkInspectorAvailability(
        inspector_id,
        scheduled_date,
        appointmentId
      );

      if (!isAvailable) {
        errors.push('Inspector is not available at this time');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new ConflictDetectionService();
