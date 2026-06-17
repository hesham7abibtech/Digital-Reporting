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
  
  // Unified API Entry Point (mapped to the same project)
  API_DOMAIN: IS_PROD ? 'api.rehdigital.com' : 'localhost:3000/api',
  
  // Protocol
  PROTOCOL: IS_PROD ? 'https://' : 'http://',
  
  get BASE_URL() {
    return `${this.PROTOCOL}${this.MAIN_DOMAIN}`;
  },
  
  get API_BASE_URL() {
    // In production, force all API calls through the 'api.' subdomain
    // In dev, use the localhost/api pattern
    return IS_PROD ? `${this.PROTOCOL}${this.API_DOMAIN}` : `http://localhost:3000/api`;
  }
};

/**
 * Utility to construct API endpoints
 * Using relative paths to avoid CORS issues in unified architecture
 */
export function getApiEndpoint(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}
