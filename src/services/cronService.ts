import cron from "node-cron";
import { config } from "../config/config";
import { Domain } from "../entities/Entities";
import { getDatabaseConnection } from "../utils/databaseConnectionManager";
import { rabbitmqService } from "./rabbitmqService";
import { LessThan } from "typeorm";

class CronService {
  private static instance: CronService | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("Cron service is already initialized");
      return;
    }

    try {
      await rabbitmqService.connect();

      cron.schedule(config.scanInterval, async () => {
        console.log("Running scheduled domain scan");
        await this.scanAllDomains();
      });

      this.isInitialized = true;
      console.log("Cron service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize cron service:", error);
      throw error;
    }
  }

  private async scanAllDomains(): Promise<void> {
    const dataSource = await getDatabaseConnection();
    const domainRepo = dataSource.getRepository(Domain);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const domains = await domainRepo.find({
      where: {
        analysisStatus: "completed",
        updatedAt: LessThan(twentyFourHoursAgo),
      },
    });

    const scanPromises = domains.map((domain) =>
      this.enqueueDomainScan(domain.domainName)
    );
    const results = await Promise.allSettled(scanPromises);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to enqueue scan for domain ${domains[index].domainName}:`,
          result.reason
        );
      }
    });

    console.log(
      `Scheduled scan completed. ${
        results.filter((r) => r.status === "fulfilled").length
      } domains enqueued for scanning.`
    );
  }

  private async enqueueDomainScan(domainName: string): Promise<void> {
    await rabbitmqService.sendToQueue(
      "domain-scan",
      JSON.stringify({ domain: domainName })
    );
    console.log(`Enqueued scan for domain: ${domainName}`);
  }
}

export const cronService = CronService.getInstance();
