import { parseVirusTotalInfo, parseWhoisInfo } from "./parserService";
import { getVirusTotalInfo, getWhoisInfo } from "../services/apiService";
import {
  Domain,
  ApiRequest,
  DomainAnalysis,
  WhoisRecord,
} from "../entities/Entities";
import { getDatabaseConnection } from "../utils/connectionManager";
import { ApiEnum } from "../config/config";

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

async function logApiRequest(
  apiType: ApiEnum,
  domainName: string,
  response: any,
  error?: string
) {
  const dataSource = await getDatabaseConnection();
  const apiRequestRepo = dataSource.getRepository(ApiRequest);
  const apiRequest = apiRequestRepo.create({
    apiType,
    domainName,
    response,
    errorMessage: error,
  });
  await apiRequestRepo.save(apiRequest);
}

export async function scanDomain(name: string) {
  console.log("Start scanning for: ", name);

  let virusTotalInfo, whoisInfo; // Add more API's here

  try {
    virusTotalInfo = await getVirusTotalInfo(name);
    await logApiRequest(ApiEnum.VIRUSTOTAL, name, virusTotalInfo);
  } catch (error: any) {
    await logApiRequest(
      ApiEnum.VIRUSTOTAL,
      name,
      null,
      error.message ?? "unknown error"
    );
  }

  try {
    whoisInfo = await getWhoisInfo(name);
    await logApiRequest(ApiEnum.WHOIS, name, whoisInfo);
  } catch (error: any) {
    await logApiRequest(
      ApiEnum.WHOIS,
      name,
      null,
      error.message ?? "unknown error"
    );
  }

  // Add more API's here

  return {
    virusTotalInfo: parseVirusTotalInfo(virusTotalInfo),
    whoisInfo: parseWhoisInfo(whoisInfo),
    // Add more API's here
  };
}

export async function updateDomainInfo(
  domain: Domain,
  virusTotalInfo: any,
  whoisInfo: any
) {
  const dataSource = await getDatabaseConnection();

  await dataSource.manager.transaction(async (transactionalEntityManager) => {
    if (whoisInfo) {
      const whoisRecord = new WhoisRecord();
      whoisRecord.domain = domain;
      whoisRecord.rawData = whoisInfo;
      whoisRecord.registrar = whoisInfo.registrar;
      whoisRecord.creationDate = whoisInfo.creationDate;
      whoisRecord.expirationDate = whoisInfo.expirationDate;
      whoisRecord.lastUpdateDate = whoisInfo.lastUpdateDate;
      await transactionalEntityManager.save(whoisRecord);
    }

    if (virusTotalInfo) {
      const domainAnalysis = new DomainAnalysis();
      domainAnalysis.domain = domain;
      domainAnalysis.analysisType = "virustotal";
      domainAnalysis.rawData = virusTotalInfo;
      domainAnalysis.lastAnalysisStats = virusTotalInfo.last_analysis_stats;
      domainAnalysis.reputation = virusTotalInfo.reputation;
      domainAnalysis.analysisDate = new Date();
      await transactionalEntityManager.save(domainAnalysis);
    }
    // Add more API's here

    domain.updatedAt = new Date();
    await transactionalEntityManager.save(domain);
  });

  return domain;
}
