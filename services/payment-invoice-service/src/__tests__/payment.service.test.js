const paymentService = require('../services/payment.service');
const { dbPool } = require('../config/database');
const { createOrderBreaker, captureOrderBreaker } = require('../config/paypal');
const { publishEvent } = require('../config/kafka');

// Mock dependencies
jest.mock('../config/database');
jest.mock('../config/paypal');
jest.mock('../config/kafka');

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      const mockAppointment = {
        id: 'apt-123',
        user_id: 'user-123',
        status: 'pending'
      };

      const mockPayPalOrder = {
        id: 'paypal-order-123',
        links: [{ rel: 'approve', href: 'https://paypal.com/approve' }]
      };

      dbPool.query
        .mockResolvedValueOnce({ rows: [mockAppointment] }) // Get appointment
        .mockResolvedValueOnce({ rows: [] }); // Insert payment

      createOrderBreaker.fire.mockResolvedValue(mockPayPalOrder);

      const result = await paymentService.createPayment(
        {
          appointmentId: 'apt-123',
          amount: 50.00,
          currency: 'USD'
        },
        'user-123',
        'correlation-123'
      );

      expect(result).toHaveProperty('paymentId');
      expect(result).toHaveProperty('orderId', 'paypal-order-123');
      expect(result).toHaveProperty('approvalUrl');
      expect(result.status).toBe('pending');
    });

    it('should throw error if appointment not found', async () => {
      dbPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        paymentService.createPayment(
          { appointmentId: 'invalid', amount: 50.00 },
          'user-123',
          'correlation-123'
        )
      ).rejects.toThrow('Appointment not found');
    });

    it('should throw error if user unauthorized', async () => {
      const mockAppointment = {
        id: 'apt-123',
        user_id: 'different-user',
        status: 'pending'
      };

      dbPool.query.mockResolvedValueOnce({ rows: [mockAppointment] });

      await expect(
        paymentService.createPayment(
          { appointmentId: 'apt-123', amount: 50.00 },
          'user-123',
          'correlation-123'
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('capturePayment', () => {
    it('should capture payment and publish event', async () => {
      const mockCapturedOrder = {
        id: 'order-123',
        purchase_units: [{
          reference_id: 'apt-123',
          payments: {
            captures: [{
              id: 'capture-123',
              amount: { value: '50.00' }
            }]
          }
        }]
      };

      const mockPayment = {
        id: 'payment-123',
        user_id: 'user-123',
        appointment_id: 'apt-123'
      };

      captureOrderBreaker.fire.mockResolvedValue(mockCapturedOrder);
      dbPool.query
        .mockResolvedValueOnce({ rows: [mockPayment] }) // Update payment
        .mockResolvedValueOnce({ rows: [] }); // Update appointment

      publishEvent.mockResolvedValue();

      const result = await paymentService.capturePayment('order-123', 'correlation-123');

      expect(result.status).toBe('completed');
      expect(result.paymentId).toBe('payment-123');
      expect(publishEvent).toHaveBeenCalledWith(
        'payment-events',
        expect.objectContaining({
          eventType: 'payment.completed'
        })
      );
    });
  });
});
