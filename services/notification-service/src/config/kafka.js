const { Kafka } = require('kafkajs');
const NotificationService = require('../services/notification.service');

let consumer = null;

async function startConsumer() {
  const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
    retry: { initialRetryTime: 300, retries: 10 }
  });

  consumer = kafka.consumer({ groupId: 'notification-service-group' });
  
  await consumer.connect();
  
  // Subscribe to all notification topics
  await consumer.subscribe({ topic: 'notifications-topic', fromBeginning: false });
  await consumer.subscribe({ topic: 'appointments-topic', fromBeginning: false });
  await consumer.subscribe({ topic: 'payments-topic', fromBeginning: false });
  await consumer.subscribe({ topic: 'certificates-topic', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log(`Received event: ${event.eventType} from ${topic}`);

        // Route events to appropriate handlers
        switch (event.eventType) {
          case 'appointment.created':
            await NotificationService.sendAppointmentConfirmation(event.data);
            break;
          case 'payment.completed':
            await NotificationService.sendPaymentReceipt(event.data);
            break;
          case 'certificate.generated':
            await NotificationService.sendCertificateReady(event.data);
            break;
          case 'notification.email':
            await NotificationService.sendEmail(event.data);
            break;
          case 'notification.sms':
            await NotificationService.sendSMS(event.data);
            break;
        }
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    }
  });

  console.log('Notification consumer started');
}

module.exports = { startConsumer };
