import amqp from 'amqplib';

class RabbitMQService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect(retries = 5, interval = 5000) {
    for (let i = 0; i < retries; i++) {
      try {
        this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq');
        this.channel = await this.connection.createChannel();
        console.log('Connected to RabbitMQ');
        
        this.connection.on('error', (err) => {
          console.error('RabbitMQ connection error:', err);
          this.reconnect();
        });

        this.connection.on('close', () => {
          console.error('RabbitMQ connection closed');
          this.reconnect();
        });

        return;
      } catch (error) {
        console.error(`Failed to connect to RabbitMQ. Retrying in ${interval / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    throw new Error('Failed to connect to RabbitMQ after multiple retries');
  }

  private async reconnect() {
    this.channel = null;
    this.connection = null;
    await this.connect();
  }

  async createQueue(queueName: string) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    await this.channel.assertQueue(queueName, { durable: true });
  }

  async sendToQueue(queueName: string, message: string) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    this.channel.sendToQueue(queueName, Buffer.from(message));
  }

  async consume(queueName: string, callback: (message: amqp.ConsumeMessage | null) => void) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    await this.channel.consume(queueName, callback, { noAck: false });
  }

  async acknowledgeMessage(message: amqp.ConsumeMessage) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    this.channel.ack(message);
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

export const rabbitmqService = new RabbitMQService();