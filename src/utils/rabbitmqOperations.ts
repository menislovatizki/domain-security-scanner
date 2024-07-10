import { rabbitmqService } from '../services/rabbitmqService';

export async function queueDomainForScan(domain: string): Promise<void> {
  try {
    await rabbitmqService.sendToQueue('domain-scan', JSON.stringify({ domain }));
    console.log(`Domain ${domain} queued for scanning`);
  } catch (error) {
    console.error(`Failed to queue domain ${domain} for scanning:`, error);
    throw error;
  }
}

export async function initializeRabbitMQ(): Promise<void> {
  try {
    await rabbitmqService.connect();
    await rabbitmqService.createQueue('domain-scan');
    console.log('RabbitMQ initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RabbitMQ:', error);
    throw error;
  }
}