import { parseVirusTotalInfo, parseWhoisInfo, validateAndParseDomain } from "./parserService";
import { getVirusTotalInfo, getWhoisInfo } from "../services/apiService";
import {
  Domain,
  DomainAnalysis,
  RequestLog,
} from "../entities/Entities";
import { getDatabaseConnection } from "../utils/connectionManager";

export async function findOrCreateDomain(
  name: string,
  sourceDomain?: string | null
): Promise<Domain> {
  const dataSource = await getDatabaseConnection();
  const domainRepo = dataSource.getRepository(Domain);

  let domain = await domainRepo.findOne({ where: { domainName: name } });

  if (!domain) {
    let parentDomain: Domain | null = null;

    if (sourceDomain) {
      parentDomain = await domainRepo.findOne({ where: { domainName: sourceDomain } });
      if (!parentDomain) {
        parentDomain = await findOrCreateDomain(sourceDomain);
      }
    }

    domain = domainRepo.create({
      domainName: name,
      parentDomain: parentDomain,
      tld: name.split(".").pop(),
    });

    await domainRepo.save(domain);
  }

  return domain;
}

async function logRequest(
  requestType: string,
  domainName: string,
  requestData: any
) {
  const dataSource = await getDatabaseConnection();
  const requestLogRepo = dataSource.getRepository(RequestLog);
  const requestLog = requestLogRepo.create({
    requestType,
    domainName,
    requestData,
  });
  await requestLogRepo.save(requestLog);
}

export const processDomainScan = async (domainName: string) => {
  const dataSource = await getDatabaseConnection();
  const domainRepo = dataSource.getRepository(Domain);
  const analysisRepo = dataSource.getRepository(DomainAnalysis);

  const domainData = await domainRepo.findOne({ where: { domainName } });
  if (!domainData) {
    console.error(`Domain ${domainName} not found in database`);
    return;
  }

  try {
    domainData.analysisStatus = "in_progress";
    await domainRepo.save(domainData);

    const {domain, parentDomain, valid} = validateAndParseDomain(domainName);
    if (!valid || domain === null) {
      throw new Error("Invalid URL");
    }

    // Log the scan request
    await logRequest('scan', domain, { parentDomain });

    const virusTotalInfo = await getVirusTotalInfo(domain);
    const whoisInfo = await getWhoisInfo(domain);

    const parsedVirusTotalInfo = parseVirusTotalInfo(virusTotalInfo);
    const parsedWhoisInfo = parseWhoisInfo(whoisInfo);

    await updateDomainAnalysis(domainData, parsedVirusTotalInfo, parsedWhoisInfo);

    domainData.analysisStatus = "completed";
    await domainRepo.save(domainData);

    console.log(`Scan completed for domain: ${domainName}`);
  } catch (error) {
    console.error(`Error processing domain scan for ${domainName}:`, error);
    domainData.analysisStatus = "failed";
    await domainRepo.save(domainData);
  }
};

export async function updateDomainAnalysis(
  domain: Domain,
  virusTotalInfo: any,
  whoisInfo: any
) {
  const dataSource = await getDatabaseConnection();

  await dataSource.manager.transaction(async (transactionalEntityManager) => {
    if (whoisInfo) {
      const whoisAnalysis = new DomainAnalysis();
      whoisAnalysis.domain = domain;
      whoisAnalysis.analysisType = "whois";
      whoisAnalysis.rawData = whoisInfo;
      whoisAnalysis.analysisDate = new Date();
      await transactionalEntityManager.save(whoisAnalysis);
    }

    if (virusTotalInfo) {
      const virusTotalAnalysis = new DomainAnalysis();
      virusTotalAnalysis.domain = domain;
      virusTotalAnalysis.analysisType = "virustotal";
      virusTotalAnalysis.rawData = virusTotalInfo;
      virusTotalAnalysis.lastAnalysisStats = virusTotalInfo.last_analysis_stats;
      virusTotalAnalysis.reputation = virusTotalInfo.reputation;
      virusTotalAnalysis.analysisDate = new Date();
      await transactionalEntityManager.save(virusTotalAnalysis);
    }

    domain.updatedAt = new Date();
    await transactionalEntityManager.save(domain);
  });

  return domain;
}