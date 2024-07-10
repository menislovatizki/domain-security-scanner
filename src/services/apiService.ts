import axios from "axios";
import { apiConfig, ApiEnum } from "../config/config";

const fetchApiInfo = async (apiName: ApiEnum, domain: string) => {
  const api = apiConfig(domain)[apiName];
  if (!api) {
    throw new Error(`API configuration for ${apiName} not found`);
  }

  try {
    const { url, headers, params } = api;

    const res = await axios.get(url, {
      headers: headers,
      params: params,
    });
    return res.data;
  } catch (error) {
    console.error(`Error fetching ${apiName} info:`, error);
    return null;
  }
};

export const getVirusTotalInfo = async (url: string) => {
  const virusTotalInfo = await fetchApiInfo(
    ApiEnum.VIRUSTOTAL,
    url
  );
  return virusTotalInfo;
};

export const getWhoisInfo = async (url: string) => {
  const whoisInfo = await fetchApiInfo(
    ApiEnum.WHOIS,
    url
  );
  return whoisInfo;
};

// Add more API's here (Make sure the fetchApiInfo method is satisfied)
