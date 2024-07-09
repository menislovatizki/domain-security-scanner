import { URL } from 'url';

interface DomainInfo {
  valid: boolean;
  domain: string | null;
  parentDomain: string | null;
}

export const validateAndParseDomain = (input: string): DomainInfo => {
  let url: URL;

  try {
    // If the input doesn't start with a protocol, prepend 'http://'
    if (!/^[a-zA-Z]+:\/\//.test(input)) {
      input = 'http://' + input;
    }
    url = new URL(input);
  } catch (error) {
    return { valid: false, domain: null, parentDomain: null };
  }

  // Extract the hostname
  let hostname = url.hostname;

  // Remove 'www.' if present
  hostname = hostname.replace(/^www\./, '');

  // Validate the hostname
  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(hostname)) {
    return { valid: false, domain: null, parentDomain: null };
  }

  // Construct the domain with the correct protocol and path
  let domain = `${url.protocol}//${hostname}`;
  if (url.pathname !== '/') {
    // Remove trailing slash if it exists and add the path
    domain += url.pathname.replace(/\/$/, '');
  }

  // Extract the parent domain (last two parts of the hostname)
  const hostnameParts = hostname.split('.');
  const parentDomain = hostnameParts.slice(-2).join('.');

  return {
    valid: true,
    domain: domain,
    parentDomain: `${url.protocol}//${parentDomain}`
  };
}

export const parseVirusTotalInfo : any = (data: any) => {
      // Implement parsing logic for VirusTotal data
      return data;
    }
  
export const parseWhoisInfo : any = (data: any) => {
      // Implement parsing logic for WHOIS data
      return data;
    }
  
