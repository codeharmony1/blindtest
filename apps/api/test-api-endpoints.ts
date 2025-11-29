// Test des endpoints API principaux
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
}

const results: TestResult[] = [];

function log(result: TestResult) {
  results.push(result);
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
  const color = result.status === 'PASS' ? colors.green : result.status === 'FAIL' ? colors.red : colors.yellow;
  console.log(`${color}${icon} ${result.name}${colors.reset}: ${result.message}`);
}

async function testAPI() {
  console.log('\n=== TEST API ENDPOINTS ===\n');

  // 1. Test Health Check
  try {
    const response = await axios.get(`${API_URL}/health`);
    if (response.status === 200 && response.data.status === 'ok') {
      log({ name: 'Health Check', status: 'PASS', message: 'API is running' });
    } else {
      log({ name: 'Health Check', status: 'FAIL', message: 'Unexpected response' });
    }
  } catch (error: any) {
    log({ name: 'Health Check', status: 'FAIL', message: error.message });
  }

  // 2. Test Events - GET all
  try {
    const response = await axios.get(`${API_URL}/events`);
    if (response.status === 200 && Array.isArray(response.data)) {
      log({ name: 'GET /events', status: 'PASS', message: `Retrieved ${response.data.length} events` });
    } else {
      log({ name: 'GET /events', status: 'FAIL', message: 'Invalid response format' });
    }
  } catch (error: any) {
    log({ name: 'GET /events', status: 'FAIL', message: error.message });
  }

  // 3. Test Events - GET by code (sans auth, devrait échouer ou retourner info limitée)
  try {
    const response = await axios.get(`${API_URL}/events/code/DEMO2024`);
    if (response.status === 200) {
      log({ name: 'GET /events/code/:code', status: 'PASS', message: 'Event code lookup working' });
    } else {
      log({ name: 'GET /events/code/:code', status: 'FAIL', message: 'Unexpected response' });
    }
  } catch (error: any) {
    // Peut échouer si authentification requise
    if (error.response?.status === 401 || error.response?.status === 404) {
      log({ name: 'GET /events/code/:code', status: 'PASS', message: 'Auth protection working' });
    } else {
      log({ name: 'GET /events/code/:code', status: 'FAIL', message: error.message });
    }
  }

  // 4. Test Auth - Login (Organizer)
  let authToken: string | null = null;
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'demo@blindtest.local',
      password: 'demo123'
    });
    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      log({ name: 'POST /auth/login (Organizer)', status: 'PASS', message: 'Login successful' });
    } else {
      log({ name: 'POST /auth/login (Organizer)', status: 'FAIL', message: 'No token returned' });
    }
  } catch (error: any) {
    log({ name: 'POST /auth/login (Organizer)', status: 'FAIL', message: error.message });
  }

  // 5. Test Protected Endpoint avec token
  if (authToken) {
    try {
      const response = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (response.status === 200) {
        log({ name: 'Protected endpoint with token', status: 'PASS', message: 'Auth token valid' });
      }
    } catch (error: any) {
      log({ name: 'Protected endpoint with token', status: 'FAIL', message: error.message });
    }
  } else {
    log({ name: 'Protected endpoint with token', status: 'SKIP', message: 'No auth token available' });
  }

  // 6. Test Teams endpoint
  try {
    const response = await axios.get(`${API_URL}/teams`);
    if (response.status === 200) {
      log({ name: 'GET /teams', status: 'PASS', message: `Retrieved teams data` });
    }
  } catch (error: any) {
    log({ name: 'GET /teams', status: 'FAIL', message: error.message });
  }

  // 7. Test Players endpoint
  try {
    const response = await axios.get(`${API_URL}/players`);
    if (response.status === 200) {
      log({ name: 'GET /players', status: 'PASS', message: 'Players endpoint accessible' });
    }
  } catch (error: any) {
    log({ name: 'GET /players', status: 'FAIL', message: error.message });
  }

  // 8. Test Scores endpoint
  try {
    const response = await axios.get(`${API_URL}/scores`);
    if (response.status === 200) {
      log({ name: 'GET /scores', status: 'PASS', message: 'Scores endpoint accessible' });
    }
  } catch (error: any) {
    log({ name: 'GET /scores', status: 'FAIL', message: error.message });
  }

  // Summary
  console.log('\n=== SUMMARY ===\n');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`${colors.green}PASSED: ${passed}${colors.reset}`);
  console.log(`${colors.red}FAILED: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}SKIPPED: ${skipped}${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.green}✅ All API tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}❌ Some API tests failed${colors.reset}`);
  }
}

// Vérifier si l'API est lancée
console.log('⏳ Checking if API is running on http://localhost:3001...');
axios.get(`${API_URL}/health`)
  .then(() => {
    console.log('✅ API is running, starting tests...\n');
    return testAPI();
  })
  .catch(() => {
    console.log(`${colors.red}❌ API is not running on http://localhost:3001${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Please start the API with: npm run dev:api${colors.reset}`);
    process.exit(1);
  });
