/**
 * Centralized Domain and API Configuration
 * 
 * This file manages the environment-specific endpoints for the REH Digital Reporting platform.
 * It ensures that the application uses the premium custom domain (rehdigital.com) in production
 * while maintaining flexibility for development.
 */

const IS_PROD = process.env.NODE_ENV === 'production';

export const DOMAIN_CONFIG = {
  // Main Platform Domain
  MAIN_DOMAIN: IS_PROD ? 'rehdigital.com' : 'localhost:3000',
  
  // API Subdomain
  API_DOMAIN: IS_PROD ? 'api.rehdigital.com' : 'localhost:3000/api',
  
  // Protocol
  PROTOCOL: IS_PROD ? 'https://' : 'http://',
  
  // Full Base URLs
  get BASE_URL() {
    return `${this.PROTOCOL}${this.MAIN_DOMAIN}`;
  },
  
  get API_BASE_URL() {
    return `${this.PROTOCOL}${this.API_DOMAIN}`;
  }
};

/**
 * Utility to construct API endpoints
 */
export function getApiEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${DOMAIN_CONFIG.API_BASE_URL}${cleanPath}`;
}
