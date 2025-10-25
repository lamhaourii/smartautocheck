const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

let kafkaService = null;

class KafkaService {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'inspection-service',
      brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
      retry: { initialRetryTime: 300, retries: 10 }
    });
    this.producer = null;
  }

  async initProducer() {
    if (!this.producer) {
      this.producer = this.kafka.producer();
      await this.producer.connect();
      console.log('Kafka producer connected');
    }
    return this.producer;
  }

  async publishEvent(topic, eventType, data, metadata = {}) {
    if (!this.producer) await this.initProducer();

    const event = {
      eventId: uuidv4(),
      eventType,
      timestamp: new Date().toISOString(),
      version: '1.0',
      data,
      metadata: { source: 'inspection-service', ...metadata }
    };

    await this.producer.send({
      topic,
      messages: [{ key: event.eventId, value: JSON.stringify(event) }]
    });

    console.log(`Event published: ${eventType} to ${topic}`);
    return event;
  }

  async disconnect() {
    if (this.producer) await this.producer.disconnect();
  }
}

async function initKafka() {
  kafkaService = new KafkaService();
  await kafkaService.initProducer();
  return kafkaService;
}

module.exports = { initKafka, kafkaService: () => kafkaService };
