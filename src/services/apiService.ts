import axios from "axios";
import { apiConfig, ApiEnum } from "../config/config";

const fetchApiInfo = async (apiName: ApiEnum, domain: string) => {
  const api = apiConfig[apiName];
  if (!api) {
    throw new Error(`API configuration for ${apiName} not found`);
  }

  try {
    const { url, headers, params } = api;
    const apiUrl = url.replace("{domain}", encodeURIComponent(domain));

    const res = await axios.get(apiUrl, {
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
  const decodedUrl = decodeURIComponent(url);
  const urlWithoutProtocol = decodedUrl.replace(/^https?:\/\//, "");
  const virusTotalInfo = await fetchApiInfo(
    ApiEnum.VIRUSTOTAL,
    urlWithoutProtocol
  );
  return virusTotalInfo;
};

export const getWhoisInfo = async (url: string) => {
  const decodedUrl = decodeURIComponent(url);
  const urlWithoutProtocol = decodedUrl.replace(/^https?:\/\//, "");
  const whoisInfo = await fetchApiInfo(
    ApiEnum.WHOIS,
    urlWithoutProtocol
  );
  return whoisInfo;
};

// Add more APIs here and make sure the fetchApiInfo method is satisfied
