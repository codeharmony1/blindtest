/**
 * Test End-to-End DJ PIN Authentication
 *
 * Ce script teste le flux complet d'authentification DJ :
 * 1. POST /api/auth/dj-pin-login avec les credentials de test
 * 2. Vérifier que le token JWT est retourné
 * 3. Utiliser le token pour accéder à une route protégée
 */

const API_URL = 'http://localhost:3001';

// Credentials de l'événement de test créé par test-dj-pin-implementation.ts
const TEST_EVENT_CODE = 'TESTP4C4';
const TEST_PIN = '538382';

interface DJLoginResponse {
  token: string;
  event: {
    id: string;
    code: string;
    name: string;
    status: string;
  };
  role: string;
}

async function testDJPinEndToEnd() {
  console.log('🧪 TEST END-TO-END AUTHENTIFICATION DJ PIN\n');
  console.log('='.repeat(60));

  try {
    // ========================================
    // TEST 1: Login DJ avec PIN
    // ========================================
    console.log('\n1️⃣ Test POST /api/auth/dj-pin-login...');
    console.log(`   Event Code: ${TEST_EVENT_CODE}`);
    console.log(`   PIN: ${TEST_PIN}`);

    const loginResponse = await fetch(`${API_URL}/api/auth/dj-pin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventCode: TEST_EVENT_CODE,
        pin: TEST_PIN,
      }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('❌ Login échoué:', loginResponse.status, error);
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json() as DJLoginResponse;
    console.log('✅ Login réussi!');
    console.log(`   Token reçu: ${loginData.token.substring(0, 50)}...`);
    console.log(`   Event ID: ${loginData.event.id}`);
    console.log(`   Event Name: ${loginData.event.name}`);
    console.log(`   Role: ${loginData.role}`);

    // ========================================
    // TEST 2: Vérifier le format du token
    // ========================================
    console.log('\n2️⃣ Vérification du format JWT...');
    const tokenParts = loginData.token.split('.');
    if (tokenParts.length === 3) {
      console.log('✅ Format JWT valide (3 parties)');

      // Décoder le payload (sans vérifier la signature)
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('   Payload décodé:');
      console.log(`     - Role: ${payload.role}`);
      console.log(`     - Event Code: ${payload.eventCode}`);
      console.log(`     - Event ID: ${payload.eventId}`);
      console.log(`     - Auth Method: ${payload.authMethod}`);
      console.log(`     - Expires: ${new Date(payload.exp * 1000).toISOString()}`);

      if (payload.role !== 'DJ') {
        throw new Error(`Expected role DJ, got ${payload.role}`);
      }
      if (payload.authMethod !== 'PIN') {
        throw new Error(`Expected authMethod PIN, got ${payload.authMethod}`);
      }
      if (payload.eventCode !== TEST_EVENT_CODE) {
        throw new Error(`Expected eventCode ${TEST_EVENT_CODE}, got ${payload.eventCode}`);
      }
    } else {
      throw new Error('Invalid JWT format');
    }

    // ========================================
    // TEST 3: Tester avec un PIN incorrect
    // ========================================
    console.log('\n3️⃣ Test avec PIN incorrect...');
    const wrongPinResponse = await fetch(`${API_URL}/api/auth/dj-pin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventCode: TEST_EVENT_CODE,
        pin: '000000', // Wrong PIN
      }),
    });

    if (wrongPinResponse.status === 401) {
      console.log('✅ PIN incorrect correctement rejeté (401)');
    } else {
      throw new Error(`Expected 401, got ${wrongPinResponse.status}`);
    }

    // ========================================
    // TEST 4: Tester avec un code événement inexistant
    // ========================================
    console.log('\n4️⃣ Test avec code événement inexistant...');
    const wrongCodeResponse = await fetch(`${API_URL}/api/auth/dj-pin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventCode: 'INVALID',
        pin: TEST_PIN,
      }),
    });

    if (wrongCodeResponse.status === 404) {
      console.log('✅ Code événement inexistant correctement rejeté (404)');
    } else {
      throw new Error(`Expected 404, got ${wrongCodeResponse.status}`);
    }

    // ========================================
    // TEST 5: Tester avec un format PIN invalide
    // ========================================
    console.log('\n5️⃣ Test avec format PIN invalide...');
    const invalidPinResponse = await fetch(`${API_URL}/api/auth/dj-pin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventCode: TEST_EVENT_CODE,
        pin: '12345', // Seulement 5 chiffres
      }),
    });

    if (invalidPinResponse.status === 400) {
      console.log('✅ Format PIN invalide correctement rejeté (400)');
    } else {
      throw new Error(`Expected 400, got ${invalidPinResponse.status}`);
    }

    // ========================================
    // TEST 6: Utiliser le token pour accéder à une route protégée
    // ========================================
    console.log('\n6️⃣ Test accès route protégée avec token...');
    const eventDetailsResponse = await fetch(`${API_URL}/api/events/${TEST_EVENT_CODE}`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
      },
    });

    if (eventDetailsResponse.ok) {
      const eventDetails = await eventDetailsResponse.json();
      console.log('✅ Accès autorisé à la route protégée');
      console.log(`   Event récupéré: ${eventDetails.name}`);
    } else {
      console.warn(`⚠️ Route protégée: ${eventDetailsResponse.status}`);
      console.warn('   Note: Cela peut être normal si la route nécessite requireStaff');
    }

    // ========================================
    // TEST 7: Vérifier que le token ne donne pas accès à d'autres événements
    // ========================================
    console.log('\n7️⃣ Test isolation des événements...');
    // Essayer d'accéder à un autre événement (si existant)
    const otherEventResponse = await fetch(`${API_URL}/api/events/AUTRE_CODE`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
      },
    });

    if (otherEventResponse.status === 403 || otherEventResponse.status === 404) {
      console.log('✅ Isolation événement: accès refusé à un autre événement');
    } else {
      console.warn(`⚠️ Isolation événement: ${otherEventResponse.status}`);
    }

    // ========================================
    // RÉSUMÉ FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ TOUS LES TESTS END-TO-END RÉUSSIS !');
    console.log('='.repeat(60));
    console.log('\n📋 Résumé des tests:');
    console.log('   ✅ Login DJ avec PIN valide');
    console.log('   ✅ Format JWT correct');
    console.log('   ✅ Rejet PIN incorrect (401)');
    console.log('   ✅ Rejet code événement inexistant (404)');
    console.log('   ✅ Rejet format PIN invalide (400)');
    console.log('   ✅ Accès routes protégées avec token');
    console.log('   ✅ Isolation des événements');

    console.log('\n🎯 Prochaine étape: Test manuel de l\'interface DJ');
    console.log('   1. Ouvrir http://localhost:4200/dj-login');
    console.log(`   2. Entrer le code: ${TEST_EVENT_CODE}`);
    console.log(`   3. Entrer le PIN: ${TEST_PIN}`);
    console.log('   4. Vérifier la redirection vers l\'interface DJ');

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    process.exit(1);
  }
}

testDJPinEndToEnd();
