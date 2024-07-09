import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    name: process.env.POSTGRES_DB,
  },
  rabbitmqUrl: process.env.RABBITMQ_URL,
  virusTotalApiKey: process.env.VIRUSTOTAL_API_KEY,
  whoisApiKey: process.env.WHOIS_API_KEY,
  scanInterval: process.env.SCAN_INTERVAL || "0 0 1 * *",
};

export enum ApiEnum {
  VIRUSTOTAL = 'virustotal',
  WHOIS = 'whois',
  // Add more API's here
}

type ApiConfig = {
  url: string;
  headers?: { [key: string]: string };
  params?: { [key: string]: string };
};

type ApiConfigMap = {
  [key in ApiEnum]: ApiConfig;
};

export const apiConfig: ApiConfigMap = {
  [ApiEnum.VIRUSTOTAL]: {
    url: 'https://www.virustotal.com/api/v3/domains/{domain}',
    headers: {
      'x-apikey': config.virusTotalApiKey as string,
    },
    params: {}
  },
  [ApiEnum.WHOIS]: {
    url: 'https://www.whoisxmlapi.com/whoisserver/WhoisService',
    headers: {},
    params: {
      apiKey: config.whoisApiKey as string,
      outputFormat: 'JSON',
      domainName: '{domain}'
    }
  },
  // Add more APIs here
};
