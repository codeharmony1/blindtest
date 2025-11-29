// Détecte automatiquement l'environnement basé sur l'hostname
const isProduction = !window.location.hostname.includes('localhost') &&
                      !window.location.hostname.includes('127.0.0.1');

export const environment = {
  production: isProduction,
  apiBaseUrl: '/api',
  // En production, utilise l'origine actuelle; en dev, utilise localhost:3001
  wsUrl: isProduction
    ? window.location.origin.replace(/^http/, 'ws')
    : 'http://localhost:3001',
};
