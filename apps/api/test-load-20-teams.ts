import axios from 'axios';
import WebSocket from 'ws';
import * as fs from 'fs';

const API_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

interface TestMetrics {
  totalTeams: number;
  totalRounds: number;
  startTime: number;
  endTime: number;
  duration: number;

  teamCreationTime: number;
  playerJoinTime: number;
  round1Time: number;
  round2Time: number;

  successfulAnswers: number;
  failedAnswers: number;
  totalAnswers: number;

  wsConnectionSuccesses: number;
  wsConnectionFailures: number;

  finalScores: any[];
  errors: string[];
  warnings: string[];
}

interface TeamData {
  teamId: string;
  teamName: string;
  players: {
    playerId: string;
    playerName: string;
    token: string;
    ws: WebSocket | null;
    connected: boolean;
    answersSent: number;
    answersReceived: number;
  }[];
}

const metrics: TestMetrics = {
  totalTeams: 20,
  totalRounds: 2,
  startTime: Date.now(),
  endTime: 0,
  duration: 0,

  teamCreationTime: 0,
  playerJoinTime: 0,
  round1Time: 0,
  round2Time: 0,

  successfulAnswers: 0,
  failedAnswers: 0,
  totalAnswers: 0,

  wsConnectionSuccesses: 0,
  wsConnectionFailures: 0,

  finalScores: [],
  errors: [],
  warnings: []
};

const teams: TeamData[] = [];
let djToken = '';
let eventId = '';
let eventCode = '';
let round1Id = '';
let round2Id = '';
let djWs: WebSocket | null = null;

// Utility functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const log = (message: string, type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' = 'INFO') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    INFO: '📋',
    SUCCESS: '✅',
    ERROR: '❌',
    WARN: '⚠️'
  }[type];

  console.log(`${prefix} [${timestamp}] ${message}`);

  if (type === 'ERROR') {
    metrics.errors.push(message);
  } else if (type === 'WARN') {
    metrics.warnings.push(message);
  }
};

// Step 1: Register and Login as DJ (using organizer auth)
async function loginAsDJ() {
  log('Creating load test organizer...', 'INFO');

  const email = `loadtest-${Date.now()}@blindtest.local`;
  const password = 'LoadTest2025!';

  try {
    // First register
    await axios.post(`${API_URL}/api/auth/register`, {
      email: email,
      password: password,
      displayName: 'Load Test Organizer'
    });

    log(`Organizer created: ${email}`, 'SUCCESS');

    // Then login to get token
    const loginResponse = await axios.post(`${API_URL}/api/auth/organizer-login`, {
      email: email,
      password: password
    });

    djToken = loginResponse.data.token;
    log(`DJ logged in successfully`, 'SUCCESS');
    log(`Token: ${djToken.substring(0, 30)}...`, 'INFO');
    return true;
  } catch (error: any) {
    log(`Failed to login/register as DJ: ${error.response?.data?.error?.message || error.response?.data?.message || error.message}`, 'ERROR');
    return false;
  }
}

// Step 2: Create test event
async function createTestEvent() {
  log('Creating test event...', 'INFO');

  try {
    const response = await axios.post(
      `${API_URL}/api/events`,
      {
        name: `Load Test 20 Teams - ${new Date().toISOString()}`,
        date: new Date().toISOString().split('T')[0],
        gameMode: 'TEAM',
        maxTeams: 20,
        maxPlayersPerTeam: 3,
        enableTeamAutoMatch: false
      },
      {
        headers: { Authorization: `Bearer ${djToken}` }
      }
    );

    eventId = response.data.id;
    eventCode = response.data.code;
    log(`Event created: ${eventCode} (ID: ${eventId})`, 'SUCCESS');
    return true;
  } catch (error: any) {
    log(`Failed to create event: ${error.response?.data?.error?.message || error.response?.data?.message || error.message}`, 'ERROR');
    if (error.response?.data) {
      log(`Response data: ${JSON.stringify(error.response.data)}`, 'ERROR');
    }
    return false;
  }
}

// Step 3: Create 20 teams
async function createTeams() {
  log('Creating 20 teams...', 'INFO');
  const startTime = Date.now();

  try {
    for (let i = 1; i <= 20; i++) {
      const teamName = `Team ${i.toString().padStart(2, '0')}`;

      const response = await axios.post(
        `${API_URL}/api/events/${eventCode}/teams`,
        {
          name: teamName
        }
      );

      teams.push({
        teamId: response.data.id,
        teamName: teamName,
        players: []
      });

      if (i % 5 === 0) {
        log(`Created ${i}/20 teams...`, 'INFO');
      }

      await sleep(50); // Small delay to avoid overwhelming the server
    }

    metrics.teamCreationTime = Date.now() - startTime;
    log(`All 20 teams created in ${metrics.teamCreationTime}ms`, 'SUCCESS');
    return true;
  } catch (error: any) {
    log(`Failed to create teams: ${error.response?.data?.message || error.message}`, 'ERROR');
    return false;
  }
}

// Step 4: Add 2 players per team (40 players total)
async function addPlayers() {
  log('Adding 2 players per team (40 players total)...', 'INFO');
  const startTime = Date.now();

  try {
    for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
      const team = teams[teamIndex];

      for (let playerNum = 1; playerNum <= 2; playerNum++) {
        const playerName = `Player ${teamIndex + 1}-${playerNum}`;

        const response = await axios.post(
          `${API_URL}/api/events/${eventCode}/join`,
          {
            nickname: playerName,
            teamId: team.teamId
          }
        );

        team.players.push({
          playerId: response.data.player.id,
          playerName: playerName,
          token: response.data.teamToken,
          ws: null,
          connected: false,
          answersSent: 0,
          answersReceived: 0
        });

        await sleep(30);
      }

      if ((teamIndex + 1) % 5 === 0) {
        log(`Added players for ${teamIndex + 1}/20 teams...`, 'INFO');
      }
    }

    metrics.playerJoinTime = Date.now() - startTime;
    log(`All 40 players added in ${metrics.playerJoinTime}ms`, 'SUCCESS');
    return true;
  } catch (error: any) {
    log(`Failed to add players: ${error.response?.data?.message || error.message}`, 'ERROR');
    return false;
  }
}

// Step 5: Connect all players via WebSocket
async function connectPlayersWS() {
  log('Connecting all 40 players via WebSocket...', 'INFO');

  const connectionPromises: Promise<void>[] = [];

  for (const team of teams) {
    for (const player of team.players) {
      const promise = new Promise<void>((resolve) => {
        try {
          const ws = new WebSocket(`${WS_URL}?token=${player.token}&role=PLAYER`);

          ws.on('open', () => {
            player.ws = ws;
            player.connected = true;
            metrics.wsConnectionSuccesses++;
            resolve();
          });

          ws.on('error', (error: Error) => {
            log(`WS connection error for ${player.playerName}: ${error.message}`, 'WARN');
            metrics.wsConnectionFailures++;
            resolve();
          });

          ws.on('message', (data: WebSocket.Data) => {
            try {
              const message = JSON.parse(data.toString());

              if (message.event === 'answer:recorded') {
                player.answersReceived++;
                metrics.successfulAnswers++;
              }
            } catch (e) {
              // Ignore parse errors
            }
          });

          // Timeout after 5 seconds
          setTimeout(() => {
            if (!player.connected) {
              log(`WS connection timeout for ${player.playerName}`, 'WARN');
              metrics.wsConnectionFailures++;
              resolve();
            }
          }, 5000);

        } catch (error: any) {
          log(`Failed to create WS for ${player.playerName}: ${error.message}`, 'WARN');
          metrics.wsConnectionFailures++;
          resolve();
        }
      });

      connectionPromises.push(promise);
      await sleep(50); // Stagger connections
    }
  }

  await Promise.all(connectionPromises);

  log(`WebSocket connections: ${metrics.wsConnectionSuccesses} success, ${metrics.wsConnectionFailures} failures`,
      metrics.wsConnectionFailures > 0 ? 'WARN' : 'SUCCESS');

  return metrics.wsConnectionSuccesses > 0;
}

// Step 6: Connect DJ via WebSocket
async function connectDJWS() {
  log('Connecting DJ via WebSocket...', 'INFO');

  return new Promise<boolean>((resolve) => {
    try {
      djWs = new WebSocket(`${WS_URL}?token=${djToken}&role=DJ&eventCode=${eventCode}`);

      djWs.on('open', () => {
        log('DJ WebSocket connected', 'SUCCESS');
        resolve(true);
      });

      djWs.on('error', (error: Error) => {
        log(`DJ WS error: ${error.message}`, 'ERROR');
        resolve(false);
      });

      setTimeout(() => {
        if (!djWs || djWs.readyState !== WebSocket.OPEN) {
          log('DJ WS connection timeout', 'ERROR');
          resolve(false);
        }
      }, 5000);

    } catch (error: any) {
      log(`Failed to connect DJ WS: ${error.message}`, 'ERROR');
      resolve(false);
    }
  });
}

// Step 7: Create rounds and songs
async function createRounds() {
  log('Creating 2 rounds with songs...', 'INFO');

  try {
    // Round 1
    const round1Response = await axios.post(
      `${API_URL}/api/events/${eventCode}/rounds`,
      {
        name: 'Round 1 - Load Test',
        defaultDuration: 30,
        totalSongs: 5
      },
      {
        headers: { Authorization: `Bearer ${djToken}` }
      }
    );

    round1Id = round1Response.data.id;
    log(`Round 1 created (ID: ${round1Id})`, 'SUCCESS');

    // Add 5 songs to Round 1
    for (let i = 1; i <= 5; i++) {
      await axios.post(
        `${API_URL}/api/rounds/${round1Id}/songs`,
        {
          mode: 'prepared',
          idx: i,
          artist: `Artist ${i}`,
          title: `Song ${i}`,
          duration: 30
        },
        {
          headers: { Authorization: `Bearer ${djToken}` }
        }
      );
    }
    log('Added 5 songs to Round 1', 'SUCCESS');

    // Round 2
    const round2Response = await axios.post(
      `${API_URL}/api/events/${eventCode}/rounds`,
      {
        name: 'Round 2 - Load Test',
        defaultDuration: 30,
        totalSongs: 5
      },
      {
        headers: { Authorization: `Bearer ${djToken}` }
      }
    );

    round2Id = round2Response.data.id;
    log(`Round 2 created (ID: ${round2Id})`, 'SUCCESS');

    // Add 5 songs to Round 2
    for (let i = 1; i <= 5; i++) {
      await axios.post(
        `${API_URL}/api/rounds/${round2Id}/songs`,
        {
          mode: 'prepared',
          idx: i,
          artist: `Artist ${i + 5}`,
          title: `Song ${i + 5}`,
          duration: 30
        },
        {
          headers: { Authorization: `Bearer ${djToken}` }
        }
      );
    }
    log('Added 5 songs to Round 2', 'SUCCESS');

    return true;
  } catch (error: any) {
    log(`Failed to create rounds: ${error.response?.data?.error?.message || error.response?.data?.message || error.message}`, 'ERROR');
    if (error.response?.data) {
      log(`Response data: ${JSON.stringify(error.response.data)}`, 'ERROR');
    }
    return false;
  }
}

// Step 8: Play rounds and simulate answers
async function playRound(roundNumber: 1 | 2) {
  const roundId = roundNumber === 1 ? round1Id : round2Id;
  log(`\n🎵 Starting Round ${roundNumber}...`, 'INFO');
  const startTime = Date.now();

  try {
    // Get songs for this round
    const songsResponse = await axios.get(
      `${API_URL}/api/songs?roundId=${roundId}`,
      {
        headers: { Authorization: `Bearer ${djToken}` }
      }
    );

    const songs = songsResponse.data;
    log(`Round ${roundNumber} has ${songs.length} songs`, 'INFO');

    for (let songIndex = 0; songIndex < songs.length; songIndex++) {
      const song = songs[songIndex];
      log(`\n  Song ${songIndex + 1}/${songs.length}: "${song.title}" by ${song.artist}`, 'INFO');

      // Simulate 40 players (20 teams × 2 players) submitting answers
      const answerPromises: Promise<void>[] = [];

      for (const team of teams) {
        for (const player of team.players) {
          const promise = (async () => {
            try {
              // Random delay to simulate real-world timing (0-2 seconds)
              await sleep(Math.random() * 2000);

              // Simulate answer (80% correct, 20% wrong)
              const isCorrect = Math.random() > 0.2;

              // Use HTTP API instead of WebSocket
              const response = await axios.post(
                `${API_URL}/api/answers`,
                {
                  roundSongId: song.id,
                  playerId: player.playerId,
                  artist: isCorrect ? song.artist_official || song.artist : `Wrong Artist ${Math.floor(Math.random() * 100)}`,
                  title: isCorrect ? song.title_official || song.title : `Wrong Title ${Math.floor(Math.random() * 100)}`
                },
                {
                  headers: { Authorization: `Bearer ${player.token}` }
                }
              );

              player.answersSent++;
              player.answersReceived++;
              metrics.totalAnswers++;
              metrics.successfulAnswers++;

            } catch (error: any) {
              log(`Failed to send answer for ${player.playerName}: ${error.response?.data?.error?.message || error.message}`, 'WARN');
              metrics.failedAnswers++;
              metrics.totalAnswers++;
            }
          })();

          answerPromises.push(promise);
        }
      }

      // Wait for all answers to be sent
      await Promise.all(answerPromises);

      // Wait for processing
      await sleep(1000);

      log(`  Song ${songIndex + 1} completed - ${metrics.successfulAnswers} answers recorded`, 'INFO');
    }

    const roundTime = Date.now() - startTime;
    if (roundNumber === 1) {
      metrics.round1Time = roundTime;
    } else {
      metrics.round2Time = roundTime;
    }

    log(`\n✅ Round ${roundNumber} completed in ${roundTime}ms`, 'SUCCESS');

    // Small delay between rounds
    await sleep(2000);

    return true;
  } catch (error: any) {
    log(`Failed to play round ${roundNumber}: ${error.response?.data?.message || error.message}`, 'ERROR');
    return false;
  }
}

// Step 9: Get final scores
async function getFinalScores() {
  log('\n📊 Retrieving final scores...', 'INFO');

  try {
    const response = await axios.get(
      `${API_URL}/api/scores/${eventId}`,
      {
        headers: { Authorization: `Bearer ${djToken}` }
      }
    );

    metrics.finalScores = response.data;

    log(`Retrieved scores for ${metrics.finalScores.length} teams`, 'SUCCESS');

    // Display top 10 teams
    const sortedScores = [...metrics.finalScores].sort((a, b) => b.totalPoints - a.totalPoints);
    log('\n🏆 Top 10 Teams:', 'INFO');
    for (let i = 0; i < Math.min(10, sortedScores.length); i++) {
      const score = sortedScores[i];
      log(`  ${i + 1}. ${score.teamName || 'Unknown'}: ${score.totalPoints} points`, 'INFO');
    }

    return true;
  } catch (error: any) {
    log(`Failed to get final scores: ${error.response?.data?.message || error.message}`, 'ERROR');
    return false;
  }
}

// Cleanup
async function cleanup() {
  log('\n🧹 Cleaning up connections...', 'INFO');

  for (const team of teams) {
    for (const player of team.players) {
      if (player.ws) {
        try {
          player.ws.close();
        } catch (e) {
          // Ignore
        }
      }
    }
  }

  if (djWs) {
    try {
      djWs.close();
    } catch (e) {
      // Ignore
    }
  }

  log('All connections closed', 'SUCCESS');
}

// Generate report
function generateReport() {
  metrics.endTime = Date.now();
  metrics.duration = metrics.endTime - metrics.startTime;

  const report = {
    summary: {
      testDate: new Date().toISOString(),
      totalDuration: `${(metrics.duration / 1000).toFixed(2)}s`,
      totalTeams: metrics.totalTeams,
      totalPlayers: metrics.totalTeams * 2,
      totalRounds: metrics.totalRounds,
      totalSongs: 10,
      expectedAnswers: metrics.totalTeams * 2 * 10, // 20 teams × 2 players × 10 songs
      actualAnswers: metrics.totalAnswers
    },

    performance: {
      teamCreationTime: `${metrics.teamCreationTime}ms`,
      playerJoinTime: `${metrics.playerJoinTime}ms`,
      round1Time: `${metrics.round1Time}ms`,
      round2Time: `${metrics.round2Time}ms`,
      avgTimePerSong: `${((metrics.round1Time + metrics.round2Time) / 10).toFixed(0)}ms`
    },

    websockets: {
      successfulConnections: metrics.wsConnectionSuccesses,
      failedConnections: metrics.wsConnectionFailures,
      connectionRate: `${((metrics.wsConnectionSuccesses / (metrics.wsConnectionSuccesses + metrics.wsConnectionFailures)) * 100).toFixed(1)}%`
    },

    answers: {
      totalSubmitted: metrics.totalAnswers,
      successfullyRecorded: metrics.successfulAnswers,
      failed: metrics.failedAnswers,
      successRate: `${((metrics.successfulAnswers / metrics.totalAnswers) * 100).toFixed(1)}%`
    },

    teams: teams.map(team => ({
      teamName: team.teamName,
      players: team.players.map(p => ({
        playerName: p.playerName,
        connected: p.connected,
        answersSent: p.answersSent,
        answersReceived: p.answersReceived
      }))
    })),

    finalScores: metrics.finalScores,

    issues: {
      errors: metrics.errors,
      warnings: metrics.warnings
    }
  };

  const reportPath = 'd:\\Projet\\Blind test musical\\apps\\api\\test-load-20-teams-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log(`\n📄 Report saved to: ${reportPath}`, 'SUCCESS');

  return report;
}

// Main test execution
async function runLoadTest() {
  console.log('\n'.repeat(2));
  log('='.repeat(80), 'INFO');
  log('🚀 LOAD TEST: 20 TEAMS × 2 PLAYERS × 2 ROUNDS', 'INFO');
  log('='.repeat(80), 'INFO');

  try {
    // Step 1: Login
    if (!await loginAsDJ()) {
      throw new Error('Failed to login');
    }
    await sleep(500);

    // Step 2: Create event
    if (!await createTestEvent()) {
      throw new Error('Failed to create event');
    }
    await sleep(500);

    // Step 3: Create teams
    if (!await createTeams()) {
      throw new Error('Failed to create teams');
    }
    await sleep(500);

    // Step 4: Add players
    if (!await addPlayers()) {
      throw new Error('Failed to add players');
    }
    await sleep(500);

    // Step 5: Connect players via WS
    log('Skipping WebSocket connections (API WS server might not be running)', 'WARN');
    // if (!await connectPlayersWS()) {
    //   throw new Error('Failed to connect players');
    // }
    // await sleep(1000);

    // Step 6: Connect DJ via WS
    // if (!await connectDJWS()) {
    //   throw new Error('Failed to connect DJ');
    // }
    // await sleep(500);

    // Step 7: Create rounds
    if (!await createRounds()) {
      throw new Error('Failed to create rounds');
    }
    await sleep(500);

    // Step 8: Play Round 1
    if (!await playRound(1)) {
      throw new Error('Failed to play round 1');
    }

    // Step 9: Play Round 2
    if (!await playRound(2)) {
      throw new Error('Failed to play round 2');
    }

    // Step 10: Get final scores
    if (!await getFinalScores()) {
      throw new Error('Failed to get final scores');
    }

    // Generate report
    const report = generateReport();

    // Display summary
    log('\n' + '='.repeat(80), 'INFO');
    log('📊 TEST SUMMARY', 'INFO');
    log('='.repeat(80), 'INFO');
    log(`Duration: ${report.summary.totalDuration}`, 'INFO');
    log(`Teams: ${report.summary.totalTeams}`, 'INFO');
    log(`Players: ${report.summary.totalPlayers}`, 'INFO');
    log(`Expected Answers: ${report.summary.expectedAnswers}`, 'INFO');
    log(`Actual Answers: ${report.summary.actualAnswers}`, 'INFO');
    log(`WS Connections: ${report.websockets.successfulConnections}/${report.websockets.successfulConnections + report.websockets.failedConnections} (${report.websockets.connectionRate})`, 'INFO');
    log(`Answer Success Rate: ${report.answers.successRate}`, 'INFO');
    log(`Errors: ${metrics.errors.length}`, metrics.errors.length > 0 ? 'ERROR' : 'INFO');
    log(`Warnings: ${metrics.warnings.length}`, metrics.warnings.length > 0 ? 'WARN' : 'INFO');
    log('='.repeat(80), 'INFO');

    if (metrics.errors.length === 0 && metrics.wsConnectionSuccesses >= 35) {
      log('\n✅ LOAD TEST PASSED!', 'SUCCESS');
    } else {
      log('\n⚠️ LOAD TEST COMPLETED WITH ISSUES', 'WARN');
    }

  } catch (error: any) {
    log(`\n❌ LOAD TEST FAILED: ${error.message}`, 'ERROR');
  } finally {
    await cleanup();
  }
}

// Run the test
runLoadTest().catch(console.error);
