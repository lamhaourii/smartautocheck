const { Kafka, logLevel } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

// Kafka Topics
const TOPICS = {
  APPOINTMENTS: 'appointments-topic',
  PAYMENTS: 'payments-topic',
  DOCUMENTS: 'documents-topic',
  INSPECTIONS: 'inspections-topic',
  CERTIFICATES: 'certificates-topic',
  NOTIFICATIONS: 'notifications-topic',
  INVOICES: 'invoices-topic'
};

// Event Types
const EVENT_TYPES = {
  // Appointment events
  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_UPDATED: 'appointment.updated',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  APPOINTMENT_CONFIRMED: 'appointment.confirmed',
  
  // Payment events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  
  // Document events
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_PROCESSED: 'document.processed',
  DOCUMENT_VALIDATED: 'document.validated',
  DOCUMENT_FAILED: 'document.failed',
  
  // Inspection events
  INSPECTION_STARTED: 'inspection.started',
  INSPECTION_CHECKPOINT_UPDATED: 'inspection.checkpoint.updated',
  INSPECTION_COMPLETED: 'inspection.completed',
  INSPECTION_FAILED: 'inspection.failed',
  
  // Certificate events
  CERTIFICATE_GENERATED: 'certificate.generated',
  CERTIFICATE_VERIFIED: 'certificate.verified',
  CERTIFICATE_EXPIRED: 'certificate.expired',
  
  // Invoice events
  INVOICE_CREATED: 'invoice.created',
  INVOICE_SENT: 'invoice.sent',
  
  // Notification events
  NOTIFICATION_EMAIL: 'notification.email',
  NOTIFICATION_SMS: 'notification.sms',
  NOTIFICATION_PUSH: 'notification.push'
};

class KafkaService {
  constructor(brokers, clientId) {
    this.kafka = new Kafka({
      clientId: clientId || 'smartautocheck',
      brokers: brokers || ['kafka:9092'],
      logLevel: logLevel.ERROR,
      retry: {
        initialRetryTime: 300,
        retries: 10
      }
    });

    this.producer = null;
    this.consumers = new Map();
  }

  // Initialize producer
  async initProducer() {
    if (!this.producer) {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000
      });
      await this.producer.connect();
      console.log('Kafka producer connected');
    }
    return this.producer;
  }

  // Create and initialize a consumer
  async initConsumer(groupId, topics) {
    if (this.consumers.has(groupId)) {
      return this.consumers.get(groupId);
    }

    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      retry: {
        initialRetryTime: 300,
        retries: 10
      }
    });

    await consumer.connect();
    
    // Subscribe to topics
    const topicArray = Array.isArray(topics) ? topics : [topics];
    for (const topic of topicArray) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }

    this.consumers.set(groupId, consumer);
    console.log(`Kafka consumer '${groupId}' connected to topics: ${topicArray.join(', ')}`);
    
    return consumer;
  }

  // Publish an event
  async publishEvent(topic, eventType, data, metadata = {}) {
    if (!this.producer) {
      await this.initProducer();
    }

    const event = {
      eventId: uuidv4(),
      eventType,
      timestamp: new Date().toISOString(),
      version: '1.0',
      data,
      metadata: {
        ...metadata,
        correlationId: metadata.correlationId || uuidv4()
      }
    };

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.eventId,
            value: JSON.stringify(event),
            headers: {
              eventType,
              timestamp: event.timestamp
            }
          }
        ]
      });

      console.log(`Event published: ${eventType} to ${topic}`);
      return event;
    } catch (error) {
      console.error('Error publishing event:', error);
      throw error;
    }
  }

  // Consume events with handler
  async consumeEvents(groupId, topics, messageHandler) {
    const consumer = await this.initConsumer(groupId, topics);

    await consumer.run({
      autoCommit: true,
      autoCommitInterval: 5000,
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          console.log(`Event received: ${event.eventType} from ${topic}`);
          
          await messageHandler(event, { topic, partition, offset: message.offset });
          
        } catch (error) {
          console.error('Error processing message:', error);
          // Implement dead letter queue logic here if needed
        }
      }
    });

    return consumer;
  }

  // Graceful shutdown
  async disconnect() {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        console.log('Producer disconnected');
      }

      for (const [groupId, consumer] of this.consumers) {
        await consumer.disconnect();
        console.log(`Consumer '${groupId}' disconnected`);
      }

      this.consumers.clear();
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }
}

// Health check function
async function checkKafkaHealth(brokers) {
  try {
    const kafka = new Kafka({
      clientId: 'health-check',
      brokers: brokers || ['kafka:9092'],
      retry: { retries: 3 }
    });

    const admin = kafka.admin();
    await admin.connect();
    await admin.listTopics();
    await admin.disconnect();
    
    return true;
  } catch (error) {
    console.error('Kafka health check failed:', error);
    return false;
  }
}

module.exports = {
  KafkaService,
  TOPICS,
  EVENT_TYPES,
  checkKafkaHealth
};
