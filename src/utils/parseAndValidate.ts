import { URL } from 'url';

interface DomainInfo {
  valid: boolean;
  domain: string | null;
  parentDomain: string | null;
}

export const validateAndParseDomain = (input: string): DomainInfo => {
  let url: URL;
  
  try {
    input = decodeURIComponent(input.trim());
    
    // If the input doesn't start with a protocol, prepend 'http://'
    if (!/^[a-zA-Z]+:\/\//.test(input)) {
      input = 'http://' + input;
    }
    url = new URL(input);
  } catch (error) {
    return { valid: false, domain: null, parentDomain: null };
  }

  let hostname = url.hostname.toLowerCase();
  
  // Remove 'www.' if present
  hostname = hostname.replace(/^www\./, '');
  
  // Validate the hostname
  // Allow IDNs and subdomains
  if (!/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(hostname)) {
    return { valid: false, domain: null, parentDomain: null };
  }
  
  let domain = hostname;
  if (url.pathname !== '/' && url.pathname !== '') {
    // Add the path, removing trailing slash if it exists
    domain += url.pathname.replace(/\/$/, '');
  }
  const hostnameParts = hostname.split('.');
  const parentDomain = hostnameParts.slice(-2).join('.');
  
  return {
    valid: true,
    domain: domain,
    parentDomain: parentDomain
  };
}

export const parseVirusTotalInfo = (rawData: any) => {
      return rawData;
    }
  
export const parseWhoisInfo = (rawData: any) => {
      return rawData;
    }
  
