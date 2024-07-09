type ParsedDomain = {
  fullDomain: string;
  sourceDomain: string;
};

export const validateAndParseDomain = (url: string): ParsedDomain | null => {
  try {
    // Normalize the URL by adding a scheme if it's missing
    const normalizedUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `http://${url}`;
    
    const urlObj = new URL(normalizedUrl);

    // Validate if it's a valid domain URL
    const hostname = urlObj.hostname;
    if (!hostname) {
      return null;
    }

    // Remove www if present
    let sourceDomain = hostname.replace(/^www\./, '');

    // Extract the base domain
    const domainParts = sourceDomain.split('.');
    if (domainParts.length > 2) {
      sourceDomain = domainParts.slice(-2).join('.');
    }

    // Construct fullDomain including subdomain (if any) and path
    const fullDomain = urlObj.hostname + urlObj.pathname;

    return {
      fullDomain: fullDomain.endsWith('/') ? fullDomain.slice(0, -1) : fullDomain,
      sourceDomain: sourceDomain,
    };
  } catch (error) {
    console.error('Error parsing domain:', error);
    return null;
  }
};
export const parseVirusTotalInfo : any = (data: any) => {
      // Implement parsing logic for VirusTotal data
      return data;
    }
  
export const parseWhoisInfo : any = (data: any) => {
      // Implement parsing logic for WHOIS data
      return data;
    }
  
