const { Kafka } = require('kafkajs');
const { logger } = require('./logger');
const { handlePaymentCompleted } = require('../consumers/paymentConsumer');

const kafka = new Kafka({
  clientId: 'inspection-certification-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:29092').split(','),
  retry: {
    initialRetryTime: 300,
    retries: 8
  }
});

const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000
});

const consumer = kafka.consumer({
  groupId: 'inspection-certification-service-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000
});

let producerConnected = false;
let consumerConnected = false;

const initKafka = async () => {
  try {
    await producer.connect();
    producerConnected = true;
    logger.info('Kafka producer connected');
  } catch (error) {
    logger.error('Failed to connect Kafka producer:', error);
    throw error;
  }
};

const startConsumer = async () => {
  try {
    await consumer.connect();
    consumerConnected = true;

    // Subscribe to payment-events topic
    await consumer.subscribe({
      topic: 'payment-events',
      fromBeginning: false
    });

    logger.info('Subscribed to payment-events topic');

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const eventData = JSON.parse(message.value.toString());
        const correlationId = message.headers?.['correlation-id']?.toString() || '';

        logger.info('Received Kafka message', {
          topic,
          partition,
          offset: message.offset,
          eventType: eventData.eventType,
          correlationId
        });

        try {
          if (eventData.eventType === 'payment.completed') {
            await handlePaymentCompleted(eventData, correlationId);
          }
        } catch (error) {
          logger.error('Error processing Kafka message:', {
            error: error.message,
            topic,
            offset: message.offset,
            correlationId
          });
          // In production, send to DLQ after retries
        }
      }
    });

    logger.info('Kafka consumer running');
  } catch (error) {
    logger.error('Failed to start Kafka consumer:', error);
    throw error;
  }
};

const publishEvent = async (topic, event) => {
  if (!producerConnected) {
    throw new Error('Kafka producer not connected');
  }

  try {
    await producer.send({
      topic,
      messages: [
        {
          key: event.eventId,
          value: JSON.stringify(event),
          headers: {
            'event-type': event.eventType,
            'correlation-id': event.metadata?.correlationId || ''
          }
        }
      ]
    });
    
    logger.info(`Event published to ${topic}`, {
      eventType: event.eventType,
      eventId: event.eventId
    });
  } catch (error) {
    logger.error(`Failed to publish event to ${topic}:`, error);
    throw error;
  }
};

const gracefulShutdown = async () => {
  if (consumerConnected) {
    await consumer.disconnect();
    logger.info('Kafka consumer disconnected');
  }
  if (producerConnected) {
    await producer.disconnect();
    logger.info('Kafka producer disconnected');
  }
};

module.exports = {
  kafka,
  producer,
  consumer,
  initKafka,
  startConsumer,
  publishEvent,
  gracefulShutdown
};
