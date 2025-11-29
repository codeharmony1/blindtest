/**
 * Test script for event duplication feature
 */

const API_URL = 'http://localhost:3001/api';

async function testDuplicateEvent() {
  console.log('🧪 Test de duplication d\'événement\n');

  // Step 1: Login
  console.log('1️⃣ Connexion en tant qu\'admin...');
  const loginResponse = await fetch(`${API_URL}/backstage/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@blindtest.local',
      password: 'password123'
    })
  });

  if (!loginResponse.ok) {
    console.error('❌ Échec de la connexion:', await loginResponse.text());
    return;
  }

  const loginData = await loginResponse.json() as { token: string };
  const { token } = loginData;
  console.log('✅ Connecté avec succès\n');

  // Step 2: Get list of events
  console.log('2️⃣ Récupération de la liste des événements...');
  const eventsResponse = await fetch(`${API_URL}/events`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!eventsResponse.ok) {
    console.error('❌ Échec de récupération des événements:', await eventsResponse.text());
    return;
  }

  const eventsData = await eventsResponse.json() as { events: any[] };
  const { events } = eventsData;
  console.log(`✅ ${events.length} événement(s) trouvé(s)`);

  if (events.length === 0) {
    console.log('⚠️ Aucun événement à dupliquer. Créez d\'abord un événement.');
    return;
  }

  const eventToDuplicate = events[0];
  console.log(`\n📋 Événement à dupliquer:`);
  console.log(`   - ID: ${eventToDuplicate.id}`);
  console.log(`   - Nom: ${eventToDuplicate.name}`);
  console.log(`   - Code: ${eventToDuplicate.code}`);
  console.log(`   - Rounds: ${eventToDuplicate.rounds_count || 0}`);

  // Step 3: Duplicate the event
  console.log('\n3️⃣ Duplication de l\'événement...');
  const duplicateResponse = await fetch(`${API_URL}/events/${eventToDuplicate.id}/duplicate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `${eventToDuplicate.name} (Test Copie)`
    })
  });

  if (!duplicateResponse.ok) {
    console.error('❌ Échec de la duplication:', await duplicateResponse.text());
    return;
  }

  const duplicatedEvent = await duplicateResponse.json() as any;
  console.log('✅ Événement dupliqué avec succès!');
  console.log(`\n🎉 Nouvel événement:`);
  console.log(`   - ID: ${duplicatedEvent.id}`);
  console.log(`   - Nom: ${duplicatedEvent.name}`);
  console.log(`   - Code: ${duplicatedEvent.code}`);
  console.log(`   - Mode de jeu: ${duplicatedEvent.gameMode}`);
  console.log(`   - Rounds dupliqués: ${duplicatedEvent.roundsCount}`);
  console.log(`   - Événement original: ${duplicatedEvent.originalEventId}`);

  // Step 4: Verify the duplicated event exists
  console.log('\n4️⃣ Vérification de l\'événement dupliqué...');
  const verifyResponse = await fetch(`${API_URL}/events/${duplicatedEvent.code}`);

  if (!verifyResponse.ok) {
    console.error('❌ Événement dupliqué non trouvé');
    return;
  }

  const verifiedEvent = await verifyResponse.json() as any;
  console.log('✅ Événement dupliqué vérifié:');
  console.log(`   - Code: ${verifiedEvent.code}`);
  console.log(`   - Nom: ${verifiedEvent.name}`);
  console.log(`   - Mode: ${verifiedEvent.gameMode}`);

  console.log('\n✨ Test terminé avec succès!');
}

// Run the test
testDuplicateEvent().catch(error => {
  console.error('❌ Erreur lors du test:', error);
  process.exit(1);
});
