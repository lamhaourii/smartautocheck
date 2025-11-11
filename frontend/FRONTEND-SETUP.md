# Frontend Setup Guide

## Environment Configuration

Create a `.env.local` file in the frontend directory with the following:

```bash
# API Gateway URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# PayPal (if needed)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3010
```

## Backend API Endpoints

All API calls go through the API Gateway on port 3000:

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - Logout user

### Appointments
- `GET /appointments` - Get user appointments
- `POST /appointments` - Create new appointment
- `GET /appointments/available?date=YYYY-MM-DD` - Get available slots
- `PATCH /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Cancel appointment

### User
- `GET /users/profile` - Get user profile
- `PATCH /users/profile` - Update user profile

### Inspections
- `GET /inspections` - Get user inspections
- `GET /inspections/:id` - Get inspection details

### Certificates
- `GET /certificates` - Get user certificates
- `GET /certificates/:id/download` - Download certificate PDF

### Payments
- `POST /payments/create` - Create payment
- `POST /payments/webhook` - Payment webhook (PayPal)

## Design System

### Colors
- **Primary**: Sky blue (#0ea5e9)
- **Neutral**: Slate grays
- **Success**: Emerald (#10b981)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Font**: System UI fonts (clean, professional)
- **Headings**: Bold, tight tracking
- **Body**: Medium weight, comfortable reading

### Components
- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`
- **Cards**: `.card`, `.card-elevated`, `.card-interactive`
- **Inputs**: `.input-field`
- **Badges**: `.badge`, `.badge-primary`, `.badge-success`, etc.

## Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The frontend will be available at `http://localhost:3000` (development)

## Key Features Implemented

✅ Modern, professional design system
✅ Responsive layout (mobile-first)
✅ Proper API integration with backend
✅ Authentication with JWT tokens
✅ Real-time data fetching
✅ Error handling and loading states
✅ Form validation
✅ Protected routes
✅ Role-based access control

## Pages Created

- `/` - Landing page with live stats
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/dashboard` - User dashboard
- `/booking` - Appointment booking
- `/admin` - Admin dashboard
- `/inspector/dashboard` - Inspector dashboard

## Next Steps

1. Create `.env.local` with your configuration
2. Ensure backend services are running
3. Run `npm install` in frontend directory
4. Run `npm run dev` to start development server
5. Navigate to `http://localhost:3010`
