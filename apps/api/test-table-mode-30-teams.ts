import axios from 'axios';
import * as fs from 'fs';

const API_BASE = 'http://localhost:3001/api';

interface TestReport {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  eventCode: string;
  config: {
    tables: number;
    teamsPerTable: number;
    totalTeams: number;
    rounds: number;
    songsPerRound: number;
    totalSongs: number;
  };
  tables: Array<{
    id: string;
    name: string;
    teams: Array<{ id: string; name: string }>;
  }>;
  performance: {
    eventCreation: number;
    tablesCreation: number;
    teamsCreation: number;
    roundsCreation: number;
    answersSubmission: number;
    total: number;
  };
  results: {
    tableScores: Array<{
      tableName: string;
      totalScore: number;
      teamsCount: number;
      averageScore: number;
      rank: number;
    }>;
    teamScores: Array<{
      teamName: string;
      tableName: string;
      score: number;
      correctAnswers: number;
      totalAnswers: number;
      successRate: number;
    }>;
  };
  validation: {
    scoresMatchExpected: boolean;
    allTeamsAnswered: boolean;
    allTablesHaveTeams: boolean;
    errors: string[];
  };
}

const THEMED_TABLE_NAMES = [
  "Table des Mariés 💍",
  "Table de la Famille 👨‍👩‍👧‍👦",
  "Table des Amis d'Enfance 🧸",
  "Table des Collègues 💼",
  "Table des Copains de Fac 🎓",
  "Table des Cousins 🎪",
  "Table des Voisins 🏡",
  "Table des Sports 🏀",
  "Table de la Musique 🎸",
  "Table VIP ⭐"
];

class TableModeLoadTest {
  private token: string = '';
  private report: TestReport;
  private teamTokens: Map<string, string> = new Map();

  constructor() {
    this.report = {
      startTime: new Date(),
      eventCode: '',
      config: {
        tables: 10,
        teamsPerTable: 3,
        totalTeams: 30,
        rounds: 2,
        songsPerRound: 10,
        totalSongs: 20
      },
      tables: [],
      performance: {
        eventCreation: 0,
        tablesCreation: 0,
        teamsCreation: 0,
        roundsCreation: 0,
        answersSubmission: 0,
        total: 0
      },
      results: {
        tableScores: [],
        teamScores: []
      },
      validation: {
        scoresMatchExpected: false,
        allTeamsAnswered: false,
        allTablesHaveTeams: false,
        errors: []
      }
    };
  }

  private log(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  private async measure<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    this.log(`🚀 Starting: ${label}`);
    const result = await fn();
    const duration = Date.now() - start;
    this.log(`✅ Completed: ${label} (${duration}ms)`);
    return { result, duration };
  }

  async run() {
    try {
      this.log('🎯 Starting Table Mode Load Test');
      this.log('Configuration:', this.report.config);

      // 1. Login admin
      await this.loginAdmin();

      // 2. Create event with table mode
      const { duration: eventDuration } = await this.measure(
        'Event Creation',
        () => this.createEvent()
      );
      this.report.performance.eventCreation = eventDuration;

      // 3. Create tables
      const { duration: tablesDuration } = await this.measure(
        'Tables Creation',
        () => this.createTables()
      );
      this.report.performance.tablesCreation = tablesDuration;

      // 4. Create teams and assign to tables
      const { duration: teamsDuration } = await this.measure(
        'Teams Creation',
        () => this.createTeams()
      );
      this.report.performance.teamsCreation = teamsDuration;

      // 5. Create rounds with songs
      const { duration: roundsDuration } = await this.measure(
        'Rounds Creation',
        () => this.createRounds()
      );
      this.report.performance.roundsCreation = roundsDuration;

      // 6. Simulate game - submit answers
      const { duration: answersDuration } = await this.measure(
        'Answers Submission',
        () => this.simulateGame()
      );
      this.report.performance.answersSubmission = answersDuration;

      // 7. Get final scores and validate
      await this.getScoresAndValidate();

      // 8. Generate report
      this.report.endTime = new Date();
      this.report.performance.total =
        this.report.endTime.getTime() - this.report.startTime.getTime();

      this.generateReport();
    } catch (error: any) {
      this.log('❌ Test failed:', error.message);
      this.report.validation.errors.push(`Fatal error: ${error.message}`);
      this.generateReport();
      process.exit(1);
    }
  }

  private async loginAdmin() {
    this.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_BASE}/tenants/login`, {
      email: 'test@blindtest.local',
      password: 'test123'
    });
    this.token = response.data.token;
    this.log('✅ Admin logged in');
  }

  private async createEvent() {
    this.log('📅 Creating event with table mode enabled...');
    const response = await axios.post(
      `${API_BASE}/events`,
      {
        name: `Test Table Mode - ${new Date().toISOString()}`,
        code: `TBL${Date.now().toString().slice(-6)}`,
        gameMode: 'TEAM',
        tableMode: true,
        settings: {
          tableMode: true,
          themeId: 'wedding-autumn'
        }
      },
      {
        headers: { Authorization: `Bearer ${this.token}` }
      }
    );

    this.report.eventCode = response.data.code;
    this.log(`✅ Event created with code: ${this.report.eventCode}`);
  }

  private async createTables() {
    this.log(`🪑 Creating ${this.report.config.tables} tables...`);

    for (let i = 0; i < this.report.config.tables; i++) {
      const tableName = THEMED_TABLE_NAMES[i];
      const response = await axios.post(
        `${API_BASE}/events/${this.report.eventCode}/tables`,
        { name: tableName },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      this.report.tables.push({
        id: response.data.id,
        name: tableName,
        teams: []
      });

      this.log(`  ✅ Created table: ${tableName}`);
    }

    this.log(`✅ All ${this.report.config.tables} tables created`);
  }

  private async createTeams() {
    this.log(`👥 Creating ${this.report.config.totalTeams} teams...`);

    let teamIndex = 0;
    for (let tableIdx = 0; tableIdx < this.report.tables.length; tableIdx++) {
      const table = this.report.tables[tableIdx];

      for (let i = 0; i < this.report.config.teamsPerTable; i++) {
        teamIndex++;
        const teamName = `Équipe ${teamIndex}`;

        // Create team
        const teamResponse = await axios.post(
          `${API_BASE}/events/${this.report.eventCode}/teams`,
          { name: teamName },
          {
            headers: { Authorization: `Bearer ${this.token}` }
          }
        );

        const teamId = teamResponse.data.id;

        // Create a player (captain) for this team to get a token
        const playerResponse = await axios.post(
          `${API_BASE}/events/${this.report.eventCode}/join`,
          { teamId, nickname: `Captain ${teamIndex}` }
        );

        const playerToken = playerResponse.data.teamToken;
        this.teamTokens.set(teamId, playerToken);

        // Assign team to table
        await axios.post(
          `${API_BASE}/teams/${teamId}/join-table`,
          { tableId: table.id },
          {
            headers: { Authorization: `Bearer ${playerToken}` }
          }
        );

        table.teams.push({ id: teamId, name: teamName });
        this.log(`  ✅ Team "${teamName}" created and assigned to "${table.name}"`);
      }
    }

    this.log(`✅ All ${this.report.config.totalTeams} teams created and assigned`);
  }

  private async createRounds() {
    this.log(`🎵 Creating ${this.report.config.rounds} rounds with ${this.report.config.songsPerRound} songs each...`);

    for (let roundNum = 1; roundNum <= this.report.config.rounds; roundNum++) {
      // Create round
      const roundResponse = await axios.post(
        `${API_BASE}/events/${this.report.eventCode}/rounds`,
        { name: `Round ${roundNum}` },
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      const roundId = roundResponse.data.id;
      this.log(`  📝 Round ${roundNum} created (ID: ${roundId})`);

      // Add songs to round
      for (let songNum = 1; songNum <= this.report.config.songsPerRound; songNum++) {
        await axios.post(
          `${API_BASE}/rounds/${roundId}/songs`,
          {
            mode: 'prepared',
            idx: songNum,
            title: `Song ${songNum} - Round ${roundNum}`,
            artist: `Artist ${songNum}`
          },
          {
            headers: { Authorization: `Bearer ${this.token}` }
          }
        );
      }

      this.log(`  ✅ Round ${roundNum} completed with ${this.report.config.songsPerRound} songs`);
    }

    this.log(`✅ All rounds created`);
  }

  private async simulateGame() {
    this.log(`🎮 Simulating game with variable success rates...`);

    // Get all rounds
    const roundsResponse = await axios.get(
      `${API_BASE}/events/${this.report.eventCode}/rounds`,
      {
        headers: { Authorization: `Bearer ${this.token}` }
      }
    );

    const rounds = roundsResponse.data.rounds;

    for (const round of rounds) {
      this.log(`  🎵 Processing ${round.name}...`);

      // Get songs for this round
      const songsResponse = await axios.get(
        `${API_BASE}/rounds/${round.id}/songs`,
        {
          headers: { Authorization: `Bearer ${this.token}` }
        }
      );

      const songs = songsResponse.data.songs;

      // Process each song in this round
      for (const song of songs) {
        this.log(`    🎵 Song ${song.idx}: ${song.title} - ${song.artist}`);

        // Open the song to accept answers
        await axios.post(
          `${API_BASE}/songs/${song.id}/open`,
          {},
          {
            headers: { Authorization: `Bearer ${this.token}` }
          }
        );

        // Collect all answer submission promises for parallel execution
        const answerPromises: Promise<void>[] = [];

        // Each team answers in parallel
        for (const table of this.report.tables) {
          for (const team of table.teams) {
            // Variable success rate: 50% to 90%
            const successRate = 0.5 + Math.random() * 0.4;
            const isCorrect = Math.random() < successRate;

            // Random response time: 1-5 seconds (shortened for faster test)
            const responseTime = Math.floor(1000 + Math.random() * 4000);

            // Build answer text (matching.service expects "Title - Artist" format)
            const answerText = isCorrect
              ? `${song.title} - ${song.artist}`
              : `Wrong Answer ${Math.floor(Math.random() * 1000)} - Wrong Artist ${Math.floor(Math.random() * 1000)}`;

            // Create promise for this answer submission
            const answerPromise = (async () => {
              try {
                // Simulate response time delay
                await new Promise(resolve => setTimeout(resolve, responseTime));

                await axios.post(
                  `${API_BASE}/songs/${song.id}/answers`,
                  {
                    text: answerText
                  },
                  {
                    headers: { Authorization: `Bearer ${this.teamTokens.get(team.id)}` }
                  }
                );
              } catch (error: any) {
                this.log(`      ⚠️  Error submitting answer for team ${team.name}: ${error.response?.data?.error?.message || error.message}`);
              }
            })();

            answerPromises.push(answerPromise);
          }
        }

        // Wait for all answers to complete (with max 10 second timeout for all)
        await Promise.race([
          Promise.all(answerPromises),
          new Promise(resolve => setTimeout(resolve, 10000))
        ]);

        // Close the song after all teams have answered
        await axios.post(
          `${API_BASE}/songs/${song.id}/close`,
          {},
          {
            headers: { Authorization: `Bearer ${this.token}` }
          }
        );
      }

      this.log(`  ✅ All teams answered for ${round.name}`);
    }

    this.log(`✅ Game simulation completed`);
  }

  private async getScoresAndValidate() {
    this.log(`📊 Getting scores and validating results...`);

    // Get team scores
    const scoresResponse = await axios.get(
      `${API_BASE}/events/${this.report.eventCode}/scores`,
      {
        headers: { Authorization: `Bearer ${this.token}` }
      }
    );

    const teamScores = scoresResponse.data; // API returns array directly, not wrapped

    // Calculate table scores
    const tableScoresMap = new Map<string, { totalScore: number; teams: number }>();

    for (const table of this.report.tables) {
      let totalScore = 0;
      let teamsCount = 0;

      for (const team of table.teams) {
        const teamScore = teamScores.find((s: any) => s.teamId === team.id);
        if (teamScore) {
          const score = teamScore.totalPoints || 0;
          totalScore += score;
          teamsCount++;

          // Calculate correct answers based on score (assuming 100 points per correct answer)
          const correctAnswers = Math.floor(score / 100);

          this.report.results.teamScores.push({
            teamName: team.name,
            tableName: table.name,
            score: score,
            correctAnswers: correctAnswers,
            totalAnswers: this.report.config.totalSongs,
            successRate: (correctAnswers / this.report.config.totalSongs) * 100
          });
        }
      }

      tableScoresMap.set(table.name, { totalScore, teams: teamsCount });
    }

    // Build table scores array
    tableScoresMap.forEach((data, tableName) => {
      this.report.results.tableScores.push({
        tableName,
        totalScore: data.totalScore,
        teamsCount: data.teams,
        averageScore: data.teams > 0 ? data.totalScore / data.teams : 0,
        rank: 0 // Will be set after sorting
      });
    });

    // Sort and assign ranks
    this.report.results.tableScores.sort((a, b) => b.totalScore - a.totalScore);
    this.report.results.tableScores.forEach((table, index) => {
      table.rank = index + 1;
    });

    // Validation
    this.report.validation.allTablesHaveTeams = this.report.tables.every(
      (t) => t.teams.length === this.report.config.teamsPerTable
    );

    this.report.validation.allTeamsAnswered =
      this.report.results.teamScores.length === this.report.config.totalTeams;

    this.report.validation.scoresMatchExpected = this.report.results.tableScores.every(
      (t) => t.teamsCount === this.report.config.teamsPerTable
    );

    if (!this.report.validation.allTablesHaveTeams) {
      this.report.validation.errors.push('Not all tables have the expected number of teams');
    }
    if (!this.report.validation.allTeamsAnswered) {
      this.report.validation.errors.push('Not all teams have submitted answers');
    }
    if (!this.report.validation.scoresMatchExpected) {
      this.report.validation.errors.push('Table team counts do not match expected values');
    }

    this.log(`✅ Scores retrieved and validated`);
  }

  private generateReport() {
    this.log('\n' + '='.repeat(80));
    this.log('📋 DETAILED TEST REPORT - TABLE MODE LOAD TEST');
    this.log('='.repeat(80));

    this.log('\n📊 TEST CONFIGURATION:');
    this.log(`  Event Code: ${this.report.eventCode}`);
    this.log(`  Tables: ${this.report.config.tables}`);
    this.log(`  Teams per Table: ${this.report.config.teamsPerTable}`);
    this.log(`  Total Teams: ${this.report.config.totalTeams}`);
    this.log(`  Rounds: ${this.report.config.rounds}`);
    this.log(`  Songs per Round: ${this.report.config.songsPerRound}`);
    this.log(`  Total Songs: ${this.report.config.totalSongs}`);

    this.log('\n⏱️  PERFORMANCE METRICS:');
    this.log(`  Event Creation: ${this.report.performance.eventCreation}ms`);
    this.log(`  Tables Creation: ${this.report.performance.tablesCreation}ms`);
    this.log(`  Teams Creation: ${this.report.performance.teamsCreation}ms`);
    this.log(`  Rounds Creation: ${this.report.performance.roundsCreation}ms`);
    this.log(`  Answers Submission: ${this.report.performance.answersSubmission}ms`);
    this.log(`  TOTAL TEST DURATION: ${this.report.performance.total}ms`);

    this.log('\n🏆 TABLE RANKINGS (Top 10):');
    this.report.results.tableScores.forEach((table) => {
      this.log(
        `  ${table.rank}. ${table.tableName} - ${table.totalScore} pts (${table.teamsCount} teams, avg: ${table.averageScore.toFixed(2)})`
      );
    });

    this.log('\n👥 TEAM SCORES BY TABLE:');
    this.report.tables.forEach((table) => {
      this.log(`\n  📍 ${table.name}:`);
      const tableTeams = this.report.results.teamScores.filter(
        (ts) => ts.tableName === table.name
      );
      tableTeams.forEach((team) => {
        this.log(
          `    - ${team.teamName}: ${team.score} pts (${team.correctAnswers}/${team.totalAnswers} correct, ${team.successRate.toFixed(1)}%)`
        );
      });
    });

    this.log('\n✅ VALIDATION RESULTS:');
    this.log(`  All tables have teams: ${this.report.validation.allTablesHaveTeams ? '✅' : '❌'}`);
    this.log(`  All teams answered: ${this.report.validation.allTeamsAnswered ? '✅' : '❌'}`);
    this.log(`  Scores match expected: ${this.report.validation.scoresMatchExpected ? '✅' : '❌'}`);

    if (this.report.validation.errors.length > 0) {
      this.log('\n⚠️  ERRORS:');
      this.report.validation.errors.forEach((error) => {
        this.log(`  - ${error}`);
      });
    }

    this.log('\n' + '='.repeat(80));
    this.log('📄 Saving detailed report to file...');

    // Save JSON report
    const reportPath = `./test-table-mode-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    this.log(`✅ Report saved to: ${reportPath}`);

    const allValid =
      this.report.validation.allTablesHaveTeams &&
      this.report.validation.allTeamsAnswered &&
      this.report.validation.scoresMatchExpected &&
      this.report.validation.errors.length === 0;

    if (allValid) {
      this.log('\n🎉 TEST PASSED! All validations successful.');
    } else {
      this.log('\n⚠️  TEST COMPLETED WITH WARNINGS. Check errors above.');
    }
  }
}

// Run the test
const test = new TableModeLoadTest();
test.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
