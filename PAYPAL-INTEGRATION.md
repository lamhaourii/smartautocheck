# PayPal Integration Guide

SmartAutoCheck now uses **PayPal** for payment processing instead of Stripe.

## Setup

### 1. PayPal Sandbox Credentials

The system is pre-configured with PayPal sandbox credentials in `.env.example`:

```env
PAYPAL_CLIENT_ID=AeFunx4cWx2zm6aqtLmd7Zm4G4zGZ2BVLsRh83jGxqOPzPss6fMS2PRilid05SAUTipnYNPo_NghJrDX
PAYPAL_CLIENT_SECRET=EI_3xWZTdKXVuCGWA_ScRqUw4JHB4sdUgqecogjoWkttB6_NIg97iaDWdfonSg4_ILRARZVyodnS2-6F
PAYPAL_MODE=sandbox
```

These credentials are **automatically loaded** in `docker-compose.yml` as fallback values, so you can test immediately without creating a `.env` file.

### 2. For Production

1. Create a PayPal business account at https://www.paypal.com
2. Go to PayPal Developer Dashboard: https://developer.paypal.com
3. Create a production app to get your live credentials
4. Update `.env` with production credentials:
   ```env
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_client_secret
   PAYPAL_MODE=live
   ```

## API Endpoints

### 1. Create PayPal Order

**POST** `/api/payments/create-order`

Creates a PayPal order and returns the order ID for frontend checkout.

**Request Body**:
```json
{
  "amount": 50.00,
  "currency": "USD"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "5O190127TN364715T"
  }
}
```

### 2. Capture Payment

**POST** `/api/payments`

Captures a PayPal payment after the user approves it.

**Request Body**:
```json
{
  "appointmentId": "uuid-here",
  "amount": 50.00,
  "currency": "USD",
  "orderId": "5O190127TN364715T"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "id": "payment-uuid",
    "appointment_id": "appointment-uuid",
    "amount": 50.00,
    "currency": "USD",
    "status": "completed",
    "payment_method": "paypal",
    "transaction_id": "5O190127TN364715T"
  }
}
```

### 3. Refund Payment

**POST** `/api/payments/:id/refund`

Refunds a completed PayPal payment.

**Response**:
```json
{
  "success": true,
  "message": "Payment refunded successfully",
  "data": {
    "id": "payment-uuid",
    "status": "refunded"
  }
}
```

## Frontend Integration

### Step 1: Load PayPal SDK

Add to your HTML or React component:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>
```

### Step 2: React/Next.js Integration Example

```jsx
import { useEffect, useState } from 'react';

export default function PaymentPage({ appointmentId, amount }) {
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.addEventListener('load', () => {
      window.paypal.Buttons({
        createOrder: async () => {
          // Call backend to create order
          const res = await fetch('/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency: 'USD' })
          });
          const data = await res.json();
          return data.data.orderId;
        },
        onApprove: async (data) => {
          // Capture the payment
          const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${yourAuthToken}`
            },
            body: JSON.stringify({
              appointmentId,
              amount,
              currency: 'USD',
              orderId: data.orderID
            })
          });
          const result = await res.json();
          
          if (result.success) {
            alert('Payment successful!');
            // Redirect to success page
          }
        },
        onError: (err) => {
          console.error('PayPal error:', err);
          alert('Payment failed. Please try again.');
        }
      }).render('#paypal-button-container');
    });
    document.body.appendChild(script);
  }, []);

  return (
    <div>
      <h2>Complete Payment - ${amount}</h2>
      <div id="paypal-button-container"></div>
    </div>
  );
}
```

### Step 3: Environment Variables

Add to `.env.local` (frontend):
```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AeFunx4cWx2zm6aqtLmd7Zm4G4zGZ2BVLsRh83jGxqOPzPss6fMS2PRilid05SAUTipnYNPo_NghJrDX
```

## Testing with Sandbox

### PayPal Sandbox Test Accounts

1. Go to https://developer.paypal.com/dashboard/accounts
2. Use the **default personal sandbox account** to test payments
3. Login with sandbox credentials when PayPal checkout opens

### Test Credit Cards (Sandbox)

PayPal provides test credit cards:
- **Visa**: 4032039865885344
- **Mastercard**: 5419746916785357
- **Amex**: 371449635398431

CVV: Any 3 digits  
Expiry: Any future date

## Payment Flow

```
1. User clicks "Pay with PayPal"
   ↓
2. Frontend calls POST /api/payments/create-order
   ↓
3. Backend creates PayPal order → Returns orderId
   ↓
4. PayPal SDK opens checkout popup with orderId
   ↓
5. User approves payment in PayPal popup
   ↓
6. Frontend receives approval (onApprove callback)
   ↓
7. Frontend calls POST /api/payments with orderId
   ↓
8. Backend captures payment → Saves to database
   ↓
9. Kafka event published → Invoice generated
   ↓
10. User receives confirmation email
```

## Kafka Events

After successful payment, these events are published:

### payment.completed
```json
{
  "eventType": "payment.completed",
  "data": {
    "paymentId": "uuid",
    "appointmentId": "uuid",
    "amount": 50.00,
    "currency": "USD",
    "transactionId": "5O190127TN364715T"
  }
}
```

### invoice.create
```json
{
  "eventType": "invoice.create",
  "data": {
    "paymentId": "uuid",
    "appointmentId": "uuid",
    "amount": 50.00
  }
}
```

## Mock Mode (No Credentials)

If PayPal credentials are not provided, the system runs in **mock mode**:
- `createOrder` returns a fake order ID: `MOCK-ORDER-{timestamp}`
- `processPayment` marks payment as completed without calling PayPal
- `refundPayment` logs refund without calling PayPal

This allows testing the full flow without API keys.

## Advantages of PayPal

✅ **No PCI Compliance Required**: PayPal handles card data  
✅ **Global Reach**: 200+ countries and 25+ currencies  
✅ **Buyer Protection**: Built-in fraud protection  
✅ **One-Click Checkout**: Users can pay with PayPal balance  
✅ **Mobile Optimized**: Native mobile app integration  
✅ **Lower Fees**: Often cheaper than Stripe in some regions

## Security Notes

- Never expose `PAYPAL_CLIENT_SECRET` in frontend code
- Use HTTPS in production
- Validate payment amounts on backend (never trust frontend)
- Store transaction IDs for audit trail
- Implement webhook verification for payment notifications

## Troubleshooting

### "Invalid client credentials"
- Check that `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are correct
- Verify you're using sandbox credentials with `PAYPAL_MODE=sandbox`

### "Order not found"
- Ensure the order was created successfully before capture
- Check that the `orderId` matches the one returned from `createOrder`

### Payment shows as pending
- Wait a few seconds and refresh - PayPal can have slight delays
- Check PayPal sandbox dashboard for transaction status

### Refund failed
- Ensure payment status is "completed" before refunding
- Check that sufficient time has passed (PayPal requires 1-2 minutes)
- Verify you have the correct transaction/capture ID

## Resources

- **PayPal Developer Docs**: https://developer.paypal.com/docs/api/overview/
- **Sandbox Dashboard**: https://developer.paypal.com/dashboard/
- **REST API Reference**: https://developer.paypal.com/docs/api/orders/v2/
- **Testing Guide**: https://developer.paypal.com/api/rest/sandbox/

---

**Your PayPal integration is ready!** 🎉  
Start testing with the sandbox credentials provided or integrate your own.
