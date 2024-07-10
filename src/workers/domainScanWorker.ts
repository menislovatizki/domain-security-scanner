import { rabbitmqService } from '../services/rabbitmqService';
import { processDomainScan } from '../services/domainScanService';

async function startWorker() {
  await rabbitmqService.connect();
  await rabbitmqService.createQueue('domain-scan');

  console.log('Domain scan worker started');

  await rabbitmqService.consume('domain-scan', async (message) => {
    if (message) {
      const content = JSON.parse(message.content.toString());
      await processDomainScan(content.domain);
      await rabbitmqService.acknowledgeMessage(message);
    }
  });
}

startWorker().catch(console.error);