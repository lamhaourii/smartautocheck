const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');
const InvoiceService = require('../services/invoice.service');

let kafkaService = null;
let consumer = null;

class KafkaProducer {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'invoice-service',
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
      metadata: { source: 'invoice-service', ...metadata }
    };

    await this.producer.send({
      topic,
      messages: [{ key: event.eventId, value: JSON.stringify(event) }]
    });

    console.log(`Event published: ${eventType} to ${topic}`);
    return event;
  }

  getKafka() {
    return this.kafka;
  }
}

async function initKafka() {
  kafkaService = new KafkaProducer();
  await kafkaService.initProducer();
  return kafkaService;
}

async function startConsumer() {
  const kafka = kafkaService.getKafka();
  consumer = kafka.consumer({ groupId: 'invoice-service-group' });
  
  await consumer.connect();
  await consumer.subscribe({ topic: 'payments-topic', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());
        console.log(`Received event: ${event.eventType}`);

        if (event.eventType === 'payment.completed') {
          await InvoiceService.generateInvoice({
            paymentId: event.data.paymentId,
            appointmentId: event.data.appointmentId,
            amount: event.data.amount
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  });

  console.log('Kafka consumer started for payment.completed events');
}

module.exports = { initKafka, startConsumer, kafkaService: () => kafkaService };
