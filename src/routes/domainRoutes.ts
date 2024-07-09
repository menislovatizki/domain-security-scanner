import { Router } from "express";
import { Domain } from "../entities/Entities";
import { findOrCreateDomain } from "../services/databaseService";
import { getDatabaseConnection } from "../utils/connectionManager";
import { validateAndParseDomain } from "../services/parserService";
import { rabbitmqService } from "../services/rabbitmqService";

const router = Router();

router.get("/:domain", async (req, res) => {
  try {
    const { domain } = req.params;
    if (!domain) {
      return res.status(400).json({ error: "Domain name is required" });
    }
    const parsedDomain = validateAndParseDomain(domain);
    
    if (!parsedDomain) {
      return res.status(400).json({ error: "Invalid domain URL" });
    }
    const { fullDomain } = parsedDomain;
    const dataSource = await getDatabaseConnection();
    const domainRepo = dataSource.getRepository(Domain);

    let domainObj = await domainRepo.findOne({
      where: { domainName: fullDomain },
      relations: ["whoisRecords", "analyses"],
    });

    if (!domainObj) {
      return res.status(404).json({ error: "Domain not found" });
    }

    const shouldRescan = domainObj.analyses.length === 0 ||
                         Date.now() - domainObj.updatedAt.getTime() > 24 * 60 * 60 * 1000; // 24 hours

    if (shouldRescan) {
      await rabbitmqService.sendToQueue('domain-scan', JSON.stringify({ domain: fullDomain }));
      
      if (domainObj.analyses.length === 0) {
        return res.json({ message: "Domain queued for initial scanning. Check back later for results." });
      } else {
        return res.json({
          message: "Domain queued for rescanning. Returning last known results.",
          data: domainObj
        });
      }
    }

    res.json(domainObj);
  } catch (error: any) {
    res.status(500).json({ error: error.message ?? "unknown error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ error: "Domain name is required" });
    }
    const parsedDomain = validateAndParseDomain(domain);
    
    if (!parsedDomain) {
      return res.status(400).json({ error: "Invalid domain URL" });
    }
    const { fullDomain, sourceDomain } = parsedDomain;
    const dataSource = await getDatabaseConnection();
    let domainObj: Domain = await findOrCreateDomain(fullDomain, sourceDomain);
    
    // Queue the domain for scanning
    await rabbitmqService.sendToQueue('domain-scan', JSON.stringify({ domain }));
    
    res.json({ message: "Domain added to scanning queue." });
  } catch (error: any) {
    console.error("Error in endpoint /:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});


export default router;