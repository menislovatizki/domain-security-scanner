import cron from "node-cron";
import { config } from "../config/config";
import { Domain } from "../entities/Entities";
import { getDatabaseConnection } from "../utils/connectionManager";
import { rabbitmqService } from "./rabbitmqService";
import { LessThan } from "typeorm";


export const startCronJobs = async () => {
  await rabbitmqService.connect();

  cron.schedule(config.scanInterval, async () => {
    console.log("Running scheduled domain scan");
    await scanAllDomains();
  });
};

const scanAllDomains = async () => {
  const dataSource = await getDatabaseConnection();
  const domainRepo = dataSource.getRepository(Domain);

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const domains = await domainRepo.find({
    where: {
      analysisStatus: "completed",
      updatedAt: LessThan(twentyFourHoursAgo)
    }
  });

  for (const domain of domains) {
    await enqueueDomainScan(domain.domainName);
  }
}

const enqueueDomainScan = async (domainName: string) => {
  await rabbitmqService.sendToQueue('domain-scan', JSON.stringify({ domain: domainName }));
  console.log(`Enqueued scan for domain: ${domainName}`);
};

