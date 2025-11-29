// Test API détaillé
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function runTests() {
  console.log('=== TEST API DÉTAILLÉ ===\n');

  // 1. Health check
  console.log('1. Testing /health endpoint...');
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('   Error:', error.message);
    console.log('   Response:', error.response?.data);
  }

  // 2. Test login avec les bons paramètres
  console.log('\n2. Testing /auth/login (correct format)...');
  try {
    const loginData = {
      email: 'demo@blindtest.local',
      password: 'demo123',
      eventCode: 'DEMO',
      role: 'ADMIN'
    };
    console.log('   Request:', loginData);
    const response = await axios.post(`${API_URL}/auth/login`, loginData);
    console.log('   Status:', response.status);
    console.log('   Token received:', !!response.data.token);
    console.log('   Organizer:', response.data.organizer);
    console.log('   Event:', response.data.event);

    // Tester un endpoint protégé avec le token
    if (response.data.token) {
      console.log('\n3. Testing protected endpoint with token...');
      const eventsResponse = await axios.get(`${API_URL}/events`, {
        headers: { Authorization: `Bearer ${response.data.token}` }
      });
      console.log('   Status:', eventsResponse.status);
      console.log('   Events count:', eventsResponse.data.length);
    }
  } catch (error: any) {
    console.log('   Error:', error.message);
    console.log('   Response:', error.response?.data);
  }

  // 4. Test GET /events sans token (devrait être 401)
  console.log('\n4. Testing /events without token (should be 401)...');
  try {
    const response = await axios.get(`${API_URL}/events`);
    console.log('   Status:', response.status);
  } catch (error: any) {
    console.log('   Status:', error.response?.status, '(Expected 401)');
  }

  // 5. Vérifier les événements existants
  console.log('\n5. Checking database for demo event...');
  try {
    // Essayer de récupérer un event public
    const response = await axios.get(`${API_URL}/events/code/DEMO2024`);
    console.log('   Event found:', response.data);
  } catch (error: any) {
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data);
  }

  console.log('\n=== TESTS TERMINÉS ===');
}

runTests().catch(console.error);
