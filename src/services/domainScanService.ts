import {
  parseVirusTotalInfo,
  parseWhoisInfo,
  validateAndParseDomain,
} from "../utils/parseAndValidate";
import { getVirusTotalInfo, getWhoisInfo } from "../services/apiService";
import { getDatabaseConnection } from "../utils/databaseConnectionManager";
import { logRequest, updateDomainAnalysis } from "./databaseService";
import { Domain } from "../entities/Entities";
import { ApiEnum } from "../config/config";

export const processDomainScan = async (domainName: string) => {
  const dataSource = await getDatabaseConnection();
  const domainRepo = dataSource.getRepository(Domain);

  const domainData = await domainRepo.findOne({ where: { domainName } });
  if (!domainData) {
    console.error(`Domain ${domainName} not found in database`);
    return;
  }

  try {
    domainData.analysisStatus = "in_progress";
    await domainRepo.save(domainData);

    const { domain, valid } = validateAndParseDomain(domainName);
    if (!valid || domain === null) {
      throw new Error("Invalid URL");
    }

    const apiCalls = {
      [ApiEnum.VIRUSTOTAL]: () => getVirusTotalInfo(domain),
      [ApiEnum.WHOIS]: () => getWhoisInfo(domain),
      // Add more API's here
    };

    const results = await Promise.allSettled(
      Object.entries(apiCalls).map(([key, call]) =>
        call().then((data) => ({ key, data }))
      )
    );

    const analysisData: Partial<Record<ApiEnum, any>> = {};
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { key, data } = result.value;
        switch (key) {
          case ApiEnum.VIRUSTOTAL:
            analysisData[ApiEnum.VIRUSTOTAL] = parseVirusTotalInfo(data);
            break;
          case ApiEnum.WHOIS:
            analysisData[ApiEnum.WHOIS] = parseWhoisInfo(data);
            break;
          // Add more API's here
        }
      }
    });

    await updateDomainAnalysis(domainData, analysisData);
    await logRequest("scan", domain, analysisData);

    domainData.analysisStatus = "completed";
    await domainRepo.save(domainData);

    console.log(`Scan completed for domain: ${domainName}`);
  } catch (error) {
    const message = `Error processing domain scan for ${domainName}: ${error}`;
    console.error(message);
    await logRequest("scan", domainName, message);
    domainData.analysisStatus = "failed";
    await domainRepo.save(domainData);
  }
};
