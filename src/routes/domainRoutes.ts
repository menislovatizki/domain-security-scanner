import { Router } from "express";
import { DomainAnalysis } from "../entities/Entities";
import {
  createDomain,
  getDomainAndLatestAnalysis,
} from "../services/databaseService";
import { validateAndParseDomain } from "../utils/parseAndValidate";
import { queueDomainForScan } from "../utils/rabbitmqOperations";

const router = Router();

const RESCAN_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

function shouldRescan(latestAnalysis: DomainAnalysis | undefined) {
  return (
    !latestAnalysis ||
    Date.now() - latestAnalysis.analysisDate.getTime() > RESCAN_INTERVAL
  );
}

router.get("/get-domain", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Valid domain URL is required" });
    }

    const { domain, valid } = validateAndParseDomain(url);
    if (!valid || !domain) {
      return res.status(400).json({ error: "Invalid domain URL" });
    }

    const { domainObj, latestAnalysis } = await getDomainAndLatestAnalysis(domain);

    if (!domainObj) {
      return res.status(404).json({ 
        message: "Domain not found in our database.",
        suggestion: "You can add this domain using the POST /api/add-domain endpoint."
      });
    }

    if (shouldRescan(latestAnalysis)) {
      await queueDomainForScan(domain);
      const message = latestAnalysis
        ? "Domain queued for rescanning. Returning last known results."
        : "Domain queued for initial scanning. Check back later for results.";
      return res.json({ message, data: { domain: domainObj, latestAnalysis } });
    }

    res.json({ domain: domainObj, latestAnalysis });
  } catch (error: any) {
    res.status(500).json({ error: error.message ?? "Unknown error" });
  }
});

router.post("/add-domain", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Valid domain URL is required" });
    }

    const { domain, parentDomain, valid } = validateAndParseDomain(url);
    if (!valid || !domain) {
      return res.status(400).json({ error: "Invalid domain URL" });
    }

    // Check if the domain already exists in the database
    const existingDomain = await getDomainAndLatestAnalysis(domain);

    if (existingDomain.domainObj) {
      return res.status(409).json({ 
        message: "Domain already exists in the database.",
        domain: existingDomain.domainObj
      });
    }

    const [domainObj] = await Promise.all([
      createDomain(domain, parentDomain),
      queueDomainForScan(domain),
    ]);

    res.status(201).json({ 
      message: "Domain added to scanning queue.", 
      domain: domainObj 
    });
  } catch (error: any) {
    console.error("Error in add-domain endpoint:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

export default router;
