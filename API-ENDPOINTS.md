# SmartAutoCheck API Endpoints

Complete API reference. **Base URL**: `http://localhost:3000`

## Authentication

### Register: `POST /api/auth/register`
```json
{ "email": "user@example.com", "password": "Pass123", "firstName": "John", "lastName": "Doe" }
```

### Login: `POST /api/auth/login`
Returns JWT token for authentication.

### Profile: `GET /api/auth/profile` (Auth required)

## Appointments

- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get details
- `GET /api/appointments/available?date=2024-12-31` - Check availability
- `PUT /api/appointments/:id` - Update
- `DELETE /api/appointments/:id` - Cancel

## Payments

- `POST /api/payments` - Process payment with Stripe
- `GET /api/payments/:id` - Get status
- `POST /api/payments/:id/refund` - Refund

## Documents (OCR)

- `POST /api/documents/scan` - Upload carte grise (multipart/form-data)
- `GET /api/documents/:id` - Get extracted data
- `POST /api/documents/validate/:id` - Validate/correct data

## Inspections

- `POST /api/inspections` - Start inspection
- `PUT /api/inspections/:id/checkpoint` - Update checkpoint
- `POST /api/inspections/:id/complete` - Complete
- `GET /api/inspections/:id` - Get status

## Certificates

- `POST /api/certificates` - Generate (auto via Kafka)
- `GET /api/certificates/:id` - Download PDF
- `GET /api/certificates/:id/verify` - Verify authenticity

## Invoices

- `POST /api/invoices` - Create (auto via Kafka)
- `GET /api/invoices/:id` - Download
- `GET /api/invoices/customer/:customerId` - List all

## Chatbot

- `POST /api/chatbot/message` - Send message
- `GET /api/chatbot/session/:id` - Conversation history

## Notifications

- `POST /api/notifications/send` - Manual send (auto via Kafka)

All responses: `{ "success": bool, "message": string, "data": object }`
