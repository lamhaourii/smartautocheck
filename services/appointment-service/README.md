# Appointment Service v2.0 - Enhanced

Enhanced appointment management service with automated reminders and conflict detection.

## 🆕 What's New in v2.0

- ✅ **Appointment Reminders** - Automated email & SMS reminders 24h before
- ✅ **Conflict Detection** - Prevents double-booking of inspectors
- ✅ **Business Hours Validation** - Enforces scheduling rules
- ✅ **Available Slots API** - Returns available time slots for booking
- ✅ **Advance Notice Validation** - Min 2 hours, max 90 days
- ✅ **Comprehensive Validation** - Multiple checks before booking

## Features

### Appointment Reminders
- **Cron Job**: Runs hourly
- **Timing**: Sends reminders 24 hours before appointment
- **Channels**: Email + SMS (if phone provided)
- **Auto-marking**: Marks reminder as sent to avoid duplicates
- **Integration**: Uses `@smartautocheck/notifications` library

### Conflict Detection
Prevents scheduling conflicts with multiple checks:

1. **Inspector Availability**: Checks if inspector is free (2-hour blocks)
2. **Business Hours**: 
   - Monday-Friday: 8 AM - 6 PM
   - Saturday: 9 AM - 3 PM
   - Sunday: Closed
3. **Advance Notice**: 2 hours minimum, 90 days maximum
4. **Past Dates**: Cannot schedule in the past
5. **Time Slot Conflicts**: 30-minute granularity with 2-hour appointments

### Available Slots API
Returns list of available time slots for a given date:
- 30-minute intervals
- Respects business hours
- Excludes booked slots (2-hour buffer)
- Optional inspector filter

## API Endpoints

### Core Appointments
```
POST   /api/appointments              - Create appointment (with validation)
GET    /api/appointments/:id          - Get appointment details
PUT    /api/appointments/:id          - Update appointment
DELETE /api/appointments/:id/cancel   - Cancel appointment
GET    /api/appointments               - List user appointments
```

### Availability
```
GET    /api/appointments/slots/:date  - Get available slots for date
POST   /api/appointments/validate     - Validate appointment before booking
```

## Usage Examples

### Book Appointment with Validation
```javascript
// Step 1: Check available slots
const response = await fetch('/api/appointments/slots/2024-01-20');
const { availableSlots } = await response.json();

// Step 2: Validate before booking
const validationResponse = await fetch('/api/appointments/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scheduled_date: '2024-01-20T14:00:00Z',
    inspector_id: 'inspector-uuid',
    service_type: 'standard'
  })
});

const { valid, errors } = await validationResponse.json();

// Step 3: Book if valid
if (valid) {
  await fetch('/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      scheduled_date: '2024-01-20T14:00:00Z',
      vehicle_id: 'vehicle-uuid',
      service_type: 'standard'
    })
  });
}
```

### Get Available Slots
```javascript
const response = await fetch('/api/appointments/slots/2024-01-20?inspector_id=uuid');
const { slots } = await response.json();

// slots = [
//   { time: '2024-01-20T08:00:00Z', display: '08:00 AM' },
//   { time: '2024-01-20T08:30:00Z', display: '08:30 AM' },
//   ...
// ]
```

## Cron Job Schedule

### Appointment Reminders
- **Schedule**: Every hour (`0 * * * *`)
- **Action**: Finds appointments 24 hours away
- **Sends**: Email + SMS reminder
- **Updates**: Marks `reminder_sent = TRUE`

## Business Rules

### Scheduling Rules
- **Advance Booking**: 2 hours minimum, 90 days maximum
- **Appointment Duration**: 2 hours per appointment
- **Business Hours**:
  - Mon-Fri: 8 AM - 6 PM
  - Saturday: 9 AM - 3 PM
  - Sunday: Closed

### Conflict Prevention
- Inspectors cannot have overlapping appointments
- Each appointment blocks a 2-hour window
- 30-minute slot granularity

## Environment Variables

```env
FRONTEND_URL=http://localhost:3010
```

## Database Schema Updates Needed

Add to `appointments` table:
```sql
ALTER TABLE appointments 
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;
```

## Testing

```bash
npm test
npm run test:watch
```

## License

MIT
