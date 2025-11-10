const { Kafka } = require('kafkajs');
const { logger } = require('./logger');

const kafka = new Kafka({
  clientId: 'payment-invoice-service',
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
  groupId: 'payment-invoice-service-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000
});

let producerConnected = false;

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
  publishEvent,
  gracefulShutdown
};
