import cron from "node-cron";
import { config } from "../config/config";
import { Domain, DomainAnalysis } from "../entities/Entities";
import { getDatabaseConnection } from "../utils/connectionManager";
import { getVirusTotalInfo, getWhoisInfo } from "./apiService";
import { parseVirusTotalInfo, parseWhoisInfo } from "./parserService";
import { updateDomainInfo } from "./databaseService";
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

export const processDomainScan = async (domainName: string) => {
  const dataSource = await getDatabaseConnection();
  const domainRepo = dataSource.getRepository(Domain);
  const analysisRepo = dataSource.getRepository(DomainAnalysis);

  const domain = await domainRepo.findOne({ where: { domainName } });
  if (!domain) {
    console.error(`Domain ${domainName} not found in database`);
    return;
  }

  try {
    domain.analysisStatus = "in_progress";
    await domainRepo.save(domain);

    const virusTotalInfo = await getVirusTotalInfo(domainName);
    const whoisInfo = await getWhoisInfo(domainName);

    const parsedVirusTotalInfo = parseVirusTotalInfo(virusTotalInfo);
    const parsedWhoisInfo = parseWhoisInfo(whoisInfo);

    await updateDomainInfo(domain, parsedVirusTotalInfo, parsedWhoisInfo);

    domain.analysisStatus = "completed";
    await domainRepo.save(domain);

    console.log(`Scan completed for domain: ${domainName}`);
  } catch (error) {
    console.error(`Error processing domain scan for ${domainName}:`, error);
    domain.analysisStatus = "failed";
    await domainRepo.save(domain);
  }
};