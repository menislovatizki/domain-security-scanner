import { Router } from "express";
import { Domain, DomainAnalysis } from "../entities/Entities";
import { findOrCreateDomain } from "../services/databaseService";
import { getDatabaseConnection } from "../utils/connectionManager";
import { validateAndParseDomain } from "../services/parserService";
import { rabbitmqService } from "../services/rabbitmqService";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "Domain name is required" });
    }
    const {domain, valid} = validateAndParseDomain(url as string);
    
    if (!valid || domain === null) {
      return res.status(400).json({ error: "Invalid domain URL" });
    }

    const dataSource = await getDatabaseConnection();
    const domainRepo = dataSource.getRepository(Domain);
    const analysisRepo = dataSource.getRepository(DomainAnalysis);

    let domainObj = await domainRepo.findOne({
      where: { domainName: domain },
      relations: ["analyses"],
    });

    if (!domainObj) {
      // If domain doesn't exist, return a message saying it doesn't exist
      return res.status(404).json({ message: "Domain not found in our database." });
    }

    const latestAnalysis = await analysisRepo.find({
      where: { domain: domainObj },
      order: { analysisDate: "DESC" },
      take: 1,
    });

    if (latestAnalysis.length === 0) {
      // If domain exists but has no analysis, queue for scanning
      await rabbitmqService.sendToQueue('domain-scan', JSON.stringify({ domain }));
      return res.json({ message: "Domain queued for initial scanning. Check back later for results.", domain: domainObj });
    }

    const shouldRescan = Date.now() - latestAnalysis[0].analysisDate.getTime() > 24 * 60 * 60 * 1000; // 24 hours

    if (shouldRescan) {
      await rabbitmqService.sendToQueue('domain-scan', JSON.stringify({ domain }));
      return res.json({
        message: "Domain queued for rescanning. Returning last known results.",
        data: { domain: domainObj, latestAnalysis: latestAnalysis[0] }
      });
    }

    res.json({ domain: domainObj, latestAnalysis: latestAnalysis[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message ?? "unknown error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Domain name is required" });
    }
    const {domain, parentDomain, valid} = validateAndParseDomain(url);
    
    if (!valid || domain === null) {
      return res.status(400).json({ error: "Invalid domain URL" });
    }

    let domainObj = await findOrCreateDomain(domain, parentDomain);

    // Queue the domain for scanning
    await rabbitmqService.sendToQueue('domain-scan', JSON.stringify({ domain }));
    
    res.json({ message: "Domain added to scanning queue.", domain: domainObj });
  } catch (error: any) {
    console.error("Error in endpoint /:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

export default router;