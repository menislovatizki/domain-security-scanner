import { ApiEnum } from "../config/config";
import { Domain, DomainAnalysis, RequestLog } from "../entities/Entities";
import { getDatabaseConnection } from "../utils/databaseConnectionManager";
import { EntityManager } from "typeorm";

export async function createDomain(
  name: string,
  sourceDomain?: string | null
): Promise<Domain> {
  const dataSource = await getDatabaseConnection();
  const domainRepo = dataSource.getRepository(Domain);

  let domain = await domainRepo.findOne({ where: { domainName: name } });

  if (!domain) {
    let parentDomain: Domain | null = null;

    if (sourceDomain) {
      parentDomain = await domainRepo.findOne({
        where: { domainName: sourceDomain },
      });
      if (!parentDomain) {
        parentDomain = await createDomain(sourceDomain);
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

export async function getDomainAndLatestAnalysis(domain: string) {
  const dataSource = await getDatabaseConnection();
  const domainRepo = dataSource.getRepository(Domain);
  const analysisRepo = dataSource.getRepository(DomainAnalysis);

  const [domainObj, latestAnalysis] = await Promise.all([
    domainRepo.findOne({
      where: { domainName: domain },
      relations: ["analyses"],
    }),
    analysisRepo.find({
      where: { domain: { domainName: domain } },
      order: { analysisDate: "DESC" },
      take: 1,
    }),
  ]);

  return { domainObj, latestAnalysis: latestAnalysis[0] };
}

export async function logRequest(
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

export async function updateDomainAnalysis(
  domain: Domain,
  analysisData: Partial<Record<ApiEnum, any>>
): Promise<Domain> {
  const dataSource = await getDatabaseConnection();

  try {
    await dataSource.manager.transaction(async (transactionalEntityManager) => {
      const analysisPromises = Object.entries(analysisData).map(([type, data]) =>
        saveAnalysis(transactionalEntityManager, domain, type as ApiEnum, data)
      );

      await Promise.allSettled(analysisPromises);

      domain.updatedAt = new Date();
      await transactionalEntityManager.save(domain);
    });

    return domain;
  } catch (error) {
    console.error("Failed to update domain analysis", { error });
    throw error;
  }
}

async function saveAnalysis(
  manager: EntityManager,
  domain: Domain,
  analysisType: ApiEnum,
  rawData: any
) {
  const analysis = manager.create(DomainAnalysis, {
    domain: domain,
    analysisType: analysisType,
    rawData: rawData,
    analysisDate: new Date(),
  });

  switch (analysisType) {
    case ApiEnum.VIRUSTOTAL:
      const vtAttributes = rawData.data.attributes;
      Object.assign(analysis, {
        lastAnalysisStats: vtAttributes.last_analysis_stats,
        reputation: vtAttributes.reputation,
        vtLastAnalysisDate: new Date(vtAttributes.last_analysis_date * 1000),
        vtPopularityRanks: vtAttributes.popularity_ranks,
        vtCategories: vtAttributes.categories
      });
      break;
    case ApiEnum.WHOIS:
      break;
  }

  await manager.save(analysis);
}
