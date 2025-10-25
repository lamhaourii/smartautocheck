const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

const TOPICS = {
  APPOINTMENTS: 'appointments-topic',
  NOTIFICATIONS: 'notifications-topic'
};

const EVENT_TYPES = {
  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_UPDATED: 'appointment.updated',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  APPOINTMENT_CONFIRMED: 'appointment.confirmed'
};

let kafkaService = null;

class KafkaService {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'appointment-service',
      brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
      retry: {
        initialRetryTime: 300,
        retries: 10
      }
    });

    this.producer = null;
  }

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
        source: 'appointment-service',
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

  async disconnect() {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        console.log('Producer disconnected');
      }
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }
}

async function initKafka() {
  kafkaService = new KafkaService();
  await kafkaService.initProducer();
  return kafkaService;
}

module.exports = {
  initKafka,
  kafkaService: () => kafkaService,
  TOPICS,
  EVENT_TYPES
};
