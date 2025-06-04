// JWT Authentication Configuration
export const AUTH_CONFIG = {
  JWT_SECRET: 'scryvault_jwt_secret_key_2025_production_secure',
  JWT_REFRESH_SECRET: 'scryvault_refresh_secret_key_2025_production_secure',
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d'
};

export function getJWTSecret(): string {
  return process.env.JWT_SECRET || AUTH_CONFIG.JWT_SECRET;
}

export function getJWTRefreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || AUTH_CONFIG.JWT_REFRESH_SECRET;
}