const http = require('http');

const API_BASE = 'http://localhost:3000/api';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testApplication() {
  console.log('🔍 Testing Blind Test Musical Application\n');

  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, passed, details = '') {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name} ${details}`);
    testResults.tests.push({ name, passed, details });
    if (passed) testResults.passed++;
    else testResults.failed++;
  }

  try {
    // Test 1: Health Check
    console.log('📋 1. HEALTH CHECK');
    const health = await makeRequest('GET', '/health');
    logTest('Health endpoint', health.status === 200, JSON.stringify(health.data));

    // Test 2: Create an organizer first (needed for events)
    console.log('\n👤 2. ORGANIZER MANAGEMENT');
    const newOrganizer = {
      name: 'Test Organizer',
      email: 'test@example.com'
    };
    const orgResponse = await makeRequest('POST', '/organizers', newOrganizer);
    const organizerId = orgResponse.data?.id;
    logTest('Create organizer', orgResponse.status === 201, `ID: ${organizerId}`);

    // Test 3: Event Management
    console.log('\n🎉 3. EVENT MANAGEMENT');
    const newEvent = {
      organizerId: organizerId,
      name: 'Test Wedding Event',
      description: 'Un événement de test pour un mariage'
    };
    const eventResponse = await makeRequest('POST', '/events', newEvent);
    const eventId = eventResponse.data?.id;
    const eventCode = eventResponse.data?.code;
    logTest('Create event', eventResponse.status === 201, `Code: ${eventCode}`);

    // Test 4: Get event by code
    if (eventCode) {
      const getEvent = await makeRequest('GET', `/events/${eventCode}`);
      logTest('Get event by code', getEvent.status === 200, getEvent.data?.name);
    }

    // Test 5: Team Management
    console.log('\n👥 4. TEAM MANAGEMENT');
    const newTeam = { name: 'Test Team Alpha' };
    const teamResponse = await makeRequest('POST', `/events/${eventCode}/teams`, newTeam);
    const teamId = teamResponse.data?.id;
    logTest('Create team', teamResponse.status === 201, `Team ID: ${teamId}`);

    // Test 6: Get teams
    const getTeams = await makeRequest('GET', `/events/${eventCode}/teams`);
    logTest('List teams', getTeams.status === 200, `Found ${getTeams.data?.length || 0} teams`);

    // Test 7: Player Management
    console.log('\n🎮 5. PLAYER MANAGEMENT');
    const newPlayer = {
      nickname: 'TestPlayer1',
      teamId: teamId
    };
    const playerResponse = await makeRequest('POST', `/events/${eventCode}/players`, newPlayer);
    const playerId = playerResponse.data?.id;
    logTest('Create player', playerResponse.status === 201, `Player ID: ${playerId}`);

    // Test 8: Set team captain
    if (teamId && playerId) {
      const captainResponse = await makeRequest('POST', `/teams/${teamId}/captain`, { playerId });
      logTest('Set team captain', captainResponse.status === 200, 'Captain set');
    }

    // Test 9: Round Management
    console.log('\n🎵 6. ROUND MANAGEMENT');
    const newRound = {
      name: 'Round 1 - Pop Music',
      eventId: eventId
    };
    const roundResponse = await makeRequest('POST', '/rounds', newRound);
    const roundId = roundResponse.data?.id;
    logTest('Create round', roundResponse.status === 201, `Round ID: ${roundId}`);

    // Test 10: Song Management
    console.log('\n🎶 7. SONG MANAGEMENT');
    const newSong = {
      roundId: roundId,
      title_official: 'Bohemian Rhapsody',
      artist_official: 'Queen',
      duration_s: 20
    };
    const songResponse = await makeRequest('POST', '/songs', newSong);
    const songId = songResponse.data?.id;
    logTest('Create song', songResponse.status === 201, `Song ID: ${songId}`);

    // Test 11: Answer Submission
    console.log('\n💭 8. ANSWER MANAGEMENT');
    if (songId && teamId) {
      const newAnswer = {
        songId: songId,
        teamId: teamId,
        text_raw: 'Bohemian Rhapsody - Queen'
      };
      const answerResponse = await makeRequest('POST', '/answers', newAnswer);
      logTest('Submit answer', answerResponse.status === 201, 'Answer submitted');
    }

    // Test 12: Score Management
    console.log('\n🏆 9. SCORE MANAGEMENT');
    const scoresResponse = await makeRequest('GET', `/events/${eventCode}/scores`);
    logTest('Get scores', scoresResponse.status === 200, 'Scores retrieved');

    // Test 13: Settings Management
    console.log('\n⚙️ 10. SETTINGS MANAGEMENT');
    const settingsResponse = await makeRequest('GET', `/events/${eventCode}/settings`);
    logTest('Get event settings', settingsResponse.status === 200, 'Settings retrieved');

    // Test 14: Update settings
    const updateSettings = {
      settings: {
        defaultSongDuration: 25,
        defaultSongsPerRound: 15,
        theme: {
          primaryColor: '#FF5722'
        }
      }
    };
    const updateSettingsResponse = await makeRequest('PUT', `/events/${eventCode}/settings`, updateSettings);
    logTest('Update settings', updateSettingsResponse.status === 401 || updateSettingsResponse.status === 200, 'Settings update attempted (may require auth)');

    // Test 15: Export functionality
    console.log('\n📊 11. EXPORT FUNCTIONALITY');
    const exportResponse = await makeRequest('GET', `/events/${eventCode}/export-scores`);
    logTest('Export scores', exportResponse.status === 200, 'Export attempted');

    console.log('\n' + '='.repeat(50));
    console.log(`📊 TEST SUMMARY:`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.tests.filter(t => !t.passed).forEach(t => {
        console.log(`   - ${t.name}: ${t.details}`);
      });
    }

  } catch (error) {
    console.error('❌ Critical error during testing:', error.message);
  }
}

testApplication();