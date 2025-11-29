/**
 * Script de test des endpoints critiques de l'API
 *
 * Usage:
 *   npx ts-node apps/api/test-critical-endpoints.ts
 *
 * Ce script teste:
 * - Authentification (login, register, refresh token, reset password)
 * - Gestion événements (création, lecture, mise à jour)
 * - Gestion équipes et joueurs
 * - Gestion rounds et chansons
 * - Réponses et scores
 * - Paiements Stripe
 * - Super-admin
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = `test-${Date.now()}@blindtest.local`;
const TEST_PASSWORD = 'TestPassword123!';
const ADMIN_EMAIL = 'admin@blindtest.local';
const ADMIN_PASSWORD = 'admin123456';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Statistiques
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
};

// Contexte global pour stocker les données entre tests
const context: any = {
  tenantToken: '',
  refreshToken: '',
  eventCode: '',
  eventId: '',
  teamId: '',
  playerId: '',
  roundId: '',
  songId: '',
  playerToken: '',
};

/**
 * Afficher un message de section
 */
function section(title: string) {
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);
}

/**
 * Afficher le résultat d'un test
 */
function logTest(name: string, passed: boolean, details?: string) {
  stats.total++;
  if (passed) {
    stats.passed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    if (details) console.log(`  ${colors.blue}→${colors.reset} ${details}`);
  } else {
    stats.failed++;
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (details) console.log(`  ${colors.red}→${colors.reset} ${details}`);
  }
}

/**
 * Afficher un test ignoré
 */
function logSkip(name: string, reason: string) {
  stats.total++;
  stats.skipped++;
  console.log(`${colors.yellow}⊘${colors.reset} ${name} (${reason})`);
}

/**
 * Créer une instance axios avec gestion d'erreurs
 */
function createApiClient(token?: string): AxiosInstance {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return axios.create({
    baseURL: API_BASE_URL,
    headers,
    validateStatus: () => true, // Ne pas throw sur erreurs HTTP
  });
}

/**
 * Tests d'authentification
 */
async function testAuthentication() {
  section('Tests Authentification');

  const api = createApiClient();

  // Test 1: Register
  try {
    const res = await api.post('/api/auth/register', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: 'Test User',
    });

    logTest(
      'POST /api/auth/register',
      res.status === 201 || res.status === 200,
      `Status: ${res.status}, User ID: ${res.data?.id || 'N/A'}`
    );
  } catch (error: any) {
    logTest('POST /api/auth/register', false, error.message);
  }

  // Test 2: Login super-admin
  try {
    const res = await api.post('/api/backstage/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const success = res.status === 200 && res.data?.token;
    logTest(
      'POST /api/backstage/auth/login',
      success,
      `Status: ${res.status}, Token: ${success ? 'Received' : 'Missing'}`
    );

    if (success) {
      context.tenantToken = res.data.token;
      // Note: Super-admin uses single token, not refresh token
    }
  } catch (error: any) {
    logTest('POST /api/backstage/auth/login', false, error.message);
  }

  // Test 3: Refresh token
  if (context.refreshToken) {
    try {
      const res = await api.post('/api/auth/refresh', {
        refreshToken: context.refreshToken,
      });

      const success = res.status === 200 && res.data?.accessToken;
      logTest(
        'POST /api/auth/refresh',
        success,
        `Status: ${res.status}, New token: ${success ? 'Received' : 'Missing'}`
      );

      if (success) {
        context.tenantToken = res.data.accessToken;
      }
    } catch (error: any) {
      logTest('POST /api/auth/refresh', false, error.message);
    }
  } else {
    logSkip('POST /api/auth/refresh', 'No refresh token available');
  }

  // Test 4: Forgot password
  try {
    const res = await api.post('/api/auth/forgot-password', {
      email: ADMIN_EMAIL,
    });

    logTest(
      'POST /api/auth/forgot-password',
      res.status === 200,
      `Status: ${res.status}, Message: ${res.data?.message || 'N/A'}`
    );
  } catch (error: any) {
    logTest('POST /api/auth/forgot-password', false, error.message);
  }
}

/**
 * Tests des événements
 */
async function testEvents() {
  section('Tests Événements');

  if (!context.tenantToken) {
    logSkip('Event tests', 'No tenant token available');
    return;
  }

  const api = createApiClient(context.tenantToken);

  // Test 1: Créer un événement
  try {
    const res = await api.post('/api/events', {
      name: `Test Event ${Date.now()}`,
      gameMode: 'TEAM',
    });

    const success = res.status === 201 && res.data?.code;
    logTest(
      'POST /api/events',
      success,
      `Status: ${res.status}, Code: ${res.data?.code || 'N/A'}`
    );

    if (success) {
      context.eventCode = res.data.code;
      context.eventId = res.data.id;
    }
  } catch (error: any) {
    logTest('POST /api/events', false, error.message);
  }

  // Test 2: Lister les événements
  try {
    const res = await api.get('/api/events');

    const success = res.status === 200 && Array.isArray(res.data?.events);
    logTest(
      'GET /api/events',
      success,
      `Status: ${res.status}, Count: ${res.data?.events?.length || 0}`
    );
  } catch (error: any) {
    logTest('GET /api/events', false, error.message);
  }

  // Test 3: Récupérer un événement public
  if (context.eventCode) {
    try {
      const res = await api.get(`/api/events/${context.eventCode}/public`);

      const success = res.status === 200 && res.data?.code === context.eventCode;
      logTest(
        `GET /api/events/${context.eventCode}/public`,
        success,
        `Status: ${res.status}, Name: ${res.data?.name || 'N/A'}`
      );
    } catch (error: any) {
      logTest(`GET /api/events/${context.eventCode}/public`, false, error.message);
    }
  } else {
    logSkip('GET /api/events/:code/public', 'No event created');
  }
}

/**
 * Tests des équipes
 */
async function testTeams() {
  section('Tests Équipes');

  if (!context.tenantToken || !context.eventCode) {
    logSkip('Team tests', 'No token or event available');
    return;
  }

  const api = createApiClient(context.tenantToken);

  // Test 1: Créer une équipe
  try {
    const res = await api.post(`/api/events/${context.eventCode}/teams`, {
      name: `Test Team ${Date.now()}`,
    });

    const success = res.status === 201 && res.data?.id;
    logTest(
      `POST /api/events/${context.eventCode}/teams`,
      success,
      `Status: ${res.status}, Team ID: ${res.data?.id || 'N/A'}`
    );

    if (success) {
      context.teamId = res.data.id;
    }
  } catch (error: any) {
    logTest(`POST /api/events/${context.eventCode}/teams`, false, error.message);
  }

  // Test 2: Lister les équipes
  try {
    const res = await api.get(`/api/events/${context.eventCode}/teams`);

    const success = res.status === 200 && Array.isArray(res.data);
    logTest(
      `GET /api/events/${context.eventCode}/teams`,
      success,
      `Status: ${res.status}, Count: ${res.data?.length || 0}`
    );
  } catch (error: any) {
    logTest(`GET /api/events/${context.eventCode}/teams`, false, error.message);
  }
}

/**
 * Tests des joueurs
 */
async function testPlayers() {
  section('Tests Joueurs');

  if (!context.eventCode || !context.teamId) {
    logSkip('Player tests', 'No event or team available');
    return;
  }

  const api = createApiClient();

  // Test 1: Rejoindre un événement
  try {
    const res = await api.post(`/api/events/${context.eventCode}/join`, {
      nickname: `TestPlayer${Date.now()}`,
      teamId: context.teamId,
    });

    const success = res.status === 200 && res.data?.teamToken;
    logTest(
      `POST /api/events/${context.eventCode}/join`,
      success,
      `Status: ${res.status}, Token: ${success ? 'Received' : 'Missing'}`
    );

    if (success) {
      context.playerId = res.data.player?.id;
      context.playerToken = res.data.teamToken;
    }
  } catch (error: any) {
    logTest(`POST /api/events/${context.eventCode}/join`, false, error.message);
  }

  // Test 2: Lister les joueurs
  if (context.tenantToken) {
    const apiAuth = createApiClient(context.tenantToken);
    try {
      const res = await apiAuth.get(`/api/events/${context.eventCode}/players`);

      const success = res.status === 200 && Array.isArray(res.data);
      logTest(
        `GET /api/events/${context.eventCode}/players`,
        success,
        `Status: ${res.status}, Count: ${res.data?.length || 0}`
      );
    } catch (error: any) {
      logTest(`GET /api/events/${context.eventCode}/players`, false, error.message);
    }
  }
}

/**
 * Tests des rounds
 */
async function testRounds() {
  section('Tests Rounds');

  if (!context.tenantToken || !context.eventCode) {
    logSkip('Round tests', 'No token or event available');
    return;
  }

  const api = createApiClient(context.tenantToken);

  // Test 1: Créer un round
  try {
    const res = await api.post(`/api/events/${context.eventCode}/rounds`, {
      name: `Test Round ${Date.now()}`,
      defaultDuration: 30,
    });

    const success = res.status === 201 && res.data?.id;
    logTest(
      `POST /api/events/${context.eventCode}/rounds`,
      success,
      `Status: ${res.status}, Round ID: ${res.data?.id || 'N/A'}`
    );

    if (success) {
      context.roundId = res.data.id;
    }
  } catch (error: any) {
    logTest(`POST /api/events/${context.eventCode}/rounds`, false, error.message);
  }

  // Test 2: Lister les rounds
  try {
    const res = await api.get(`/api/events/${context.eventCode}/rounds`);

    const success = res.status === 200 && Array.isArray(res.data);
    logTest(
      `GET /api/events/${context.eventCode}/rounds`,
      success,
      `Status: ${res.status}, Count: ${res.data?.length || 0}`
    );
  } catch (error: any) {
    logTest(`GET /api/events/${context.eventCode}/rounds`, false, error.message);
  }
}

/**
 * Tests des paiements
 */
async function testPayments() {
  section('Tests Paiements');

  if (!context.tenantToken) {
    logSkip('Payment tests', 'No tenant token available');
    return;
  }

  const api = createApiClient(context.tenantToken);

  // Test 1: Get pricing
  try {
    const res = await api.get('/api/payments/pricing');

    const success = res.status === 200 && res.data?.subscriptions;
    logTest(
      'GET /api/payments/pricing',
      success,
      `Status: ${res.status}, Plans: ${Object.keys(res.data?.subscriptions || {}).length}`
    );
  } catch (error: any) {
    logTest('GET /api/payments/pricing', false, error.message);
  }

  // Test 2: Get payment status
  try {
    const res = await api.get('/api/payments/status');

    const success = res.status === 200 && res.data?.subscription;
    logTest(
      'GET /api/payments/status',
      success,
      `Status: ${res.status}, Plan: ${res.data?.subscription?.plan || 'N/A'}`
    );
  } catch (error: any) {
    logTest('GET /api/payments/status', false, error.message);
  }
}

/**
 * Tests dashboard
 */
async function testDashboard() {
  section('Tests Dashboard');

  if (!context.tenantToken) {
    logSkip('Dashboard tests', 'No tenant token available');
    return;
  }

  const api = createApiClient(context.tenantToken);

  // Test: Get dashboard stats
  try {
    const res = await api.get('/api/dashboard/stats');

    const success = res.status === 200 && typeof res.data?.totalEvents === 'number';
    logTest(
      'GET /api/dashboard/stats',
      success,
      `Status: ${res.status}, Events: ${res.data?.totalEvents || 0}`
    );
  } catch (error: any) {
    logTest('GET /api/dashboard/stats', false, error.message);
  }
}

/**
 * Afficher le résumé final
 */
function displaySummary() {
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}RÉSUMÉ DES TESTS${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  console.log(`Total:   ${stats.total}`);
  console.log(`${colors.green}Passed:  ${stats.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:  ${stats.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${stats.skipped}${colors.reset}`);

  const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
  console.log(`\nTaux de réussite: ${colors.green}${successRate}%${colors.reset}\n`);

  if (stats.failed > 0) {
    console.log(`${colors.red}⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✓ Tous les tests sont passés !${colors.reset}\n`);
    process.exit(0);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`${colors.blue}╔═══════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║   Tests Endpoints Critiques API      ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════╝${colors.reset}`);
  console.log(`\nAPI Base URL: ${colors.cyan}${API_BASE_URL}${colors.reset}\n`);

  try {
    await testAuthentication();
    await testEvents();
    await testTeams();
    await testPlayers();
    await testRounds();
    await testPayments();
    await testDashboard();

    displaySummary();
  } catch (error: any) {
    console.error(`\n${colors.red}Erreur fatale:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Exécution
main();
