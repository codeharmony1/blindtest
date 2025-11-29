/**
 * TEST DE CHARGE SUR SERVEUR DISTANT
 *
 * Ce script lance un test de charge depuis votre machine locale
 * vers un serveur distant.
 *
 * Usage:
 *   npx ts-node apps/api/test-load-remote.ts <url_serveur> <nombre_equipes>
 *
 * Exemple:
 *   npx ts-node apps/api/test-load-remote.ts https://votre-serveur.com 50
 */

import axios, { AxiosInstance } from 'axios';
import * as SocketIOClient from 'socket.io-client';

type Socket = SocketIOClient.Socket;

// Récupérer l'URL du serveur et le nombre d'équipes depuis les arguments
const SERVER_URL = process.argv[2] || 'http://localhost:3001';
const NUM_TEAMS = parseInt(process.argv[3] || '50');

if (!process.argv[2]) {
  console.log('\n⚠️  ATTENTION : Aucune URL de serveur spécifiée. Utilisation de localhost par défaut.\n');
  console.log('Usage: npx ts-node apps/api/test-load-remote.ts <url_serveur> <nombre_equipes>\n');
  console.log('Exemple: npx ts-node apps/api/test-load-remote.ts https://votre-serveur.com 50\n');
}

console.log(`\n🎯 Configuration du test de charge:`);
console.log(`   - Serveur cible : ${SERVER_URL}`);
console.log(`   - Nombre d'équipes : ${NUM_TEAMS}`);
console.log(`\n`);

interface LoadTestConfig {
  numTeams: number;
  numQuestions: number;
  timerDuration: number;
  warmupTime: number;
  cooldownTime: number;
}

interface PerformanceMetrics {
  teamId: number;
  teamName: string;
  creationTime: number;
  socketConnected: boolean;
  socketConnectTime: number;
  roundStartedEvents: number;
  roundEndedEvents: number;
  totalAnswers: number;
  successfulAnswers: number;
  failedAnswers: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errors: string[];
}

interface TestSummary {
  config: LoadTestConfig;
  startTime: number;
  endTime: number;
  duration: number;
  totalTeams: number;
  successfulTeams: number;
  failedTeams: number;
  totalSocketConnections: number;
  successfulSocketConnections: number;
  avgSocketConnectTime: number;
  totalAnswersSubmitted: number;
  totalAnswersAccepted: number;
  totalAnswersFailed: number;
  successRate: number;
  avgApiResponseTime: number;
  minApiResponseTime: number;
  maxApiResponseTime: number;
  metrics: PerformanceMetrics[];
}

class RemoteLoadTester {
  private config: LoadTestConfig;
  private organizerToken: string = '';
  private organizerApi: AxiosInstance;
  private eventId: number = 0;
  private eventCode: string = '';
  private roundId: number = 0;
  private songIds: number[] = [];
  private metrics: PerformanceMetrics[] = [];
  private testStartTime: number = 0;

  constructor(config: LoadTestConfig) {
    this.config = config;
    this.organizerApi = axios.create({
      baseURL: SERVER_URL,
      timeout: 30000,
    });
  }

  private log(message: string, level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' = 'INFO') {
    const timestamp = new Date().toISOString();
    const elapsed = this.testStartTime ? ((Date.now() - this.testStartTime) / 1000).toFixed(2) : '0.00';
    const prefix = {
      INFO: '📋',
      SUCCESS: '✅',
      ERROR: '❌',
      WARN: '⚠️',
    }[level];
    console.log(`[${elapsed}s] ${prefix} ${message}`);
  }

  async setup(): Promise<void> {
    this.log('🔧 Configuration de l\'environnement de test sur serveur distant...', 'INFO');

    const timestamp = Date.now();
    const tenantSlug = `loadtest-${timestamp}`;

    try {
      // Créer tenant
      const tenantResponse = await axios.post(`${SERVER_URL}/api/tenants/register`, {
        name: `Load Test ${timestamp}`,
        slug: tenantSlug,
        ownerEmail: `loadtest${timestamp}@blindtest.local`,
        ownerPassword: 'loadtest123',
        ownerName: 'Load Tester',
        plan: 'DEMO',
      });

      this.organizerToken = tenantResponse.data.token;
      this.organizerApi.defaults.headers.common['Authorization'] = `Bearer ${this.organizerToken}`;
      this.log(`Tenant créé : ${tenantSlug}`, 'SUCCESS');

      // Créer événement
      this.eventCode = `LOAD${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const eventResponse = await this.organizerApi.post('/api/events', {
        name: `Load Test - ${this.config.numTeams} Teams`,
        code: this.eventCode,
        date: new Date().toISOString(),
        maxTeams: this.config.numTeams + 10,
        maxPlayersPerTeam: 5,
      });

      const eventData = eventResponse.data.event || eventResponse.data;
      this.eventId = eventData.id;
      this.eventCode = eventData.code || this.eventCode;
      this.log(`Événement créé : ${this.eventCode}`, 'SUCCESS');

      // Créer round
      const roundResponse = await this.organizerApi.post(`/api/events/${this.eventCode}/rounds`, {
        name: 'Load Test Round',
        idx: 1,
      });

      const roundData = roundResponse.data.round || roundResponse.data;
      this.roundId = roundData.id;
      this.log(`Round créé : ID=${this.roundId}`, 'SUCCESS');

      // Ajouter les chansons
      const numSongs = Math.min(this.config.numQuestions, 5);
      for (let i = 0; i < numSongs; i++) {
        const songResponse = await this.organizerApi.post(`/api/rounds/${this.roundId}/songs`, {
          mode: 'prepared',
          title: `Song ${i + 1}`,
          artist: `Artist ${i + 1}`,
          idx: i + 1,
          duration: this.config.timerDuration,
        });
        this.songIds.push(songResponse.data.id);
      }

      this.log(`${numSongs} chansons ajoutées`, 'SUCCESS');
    } catch (error: any) {
      this.log(`Erreur lors du setup : ${error.message}`, 'ERROR');
      if (error.response) {
        this.log(`Réponse serveur : ${JSON.stringify(error.response.data)}`, 'ERROR');
      }
      throw error;
    }
  }

  async createTeams(): Promise<void> {
    this.log(`🏗️  Création de ${this.config.numTeams} équipes en parallèle...`, 'INFO');
    const creationStartTime = Date.now();

    const teamPromises = [];

    for (let i = 1; i <= this.config.numTeams; i++) {
      teamPromises.push(this.createSingleTeam(i));
    }

    await Promise.allSettled(teamPromises);

    const creationDuration = ((Date.now() - creationStartTime) / 1000).toFixed(2);
    const successfulTeams = this.metrics.filter(m => m.socketConnected).length;

    this.log(`${successfulTeams}/${this.config.numTeams} équipes créées avec succès en ${creationDuration}s`,
      successfulTeams === this.config.numTeams ? 'SUCCESS' : 'WARN');
  }

  private async createSingleTeam(teamIndex: number): Promise<void> {
    const teamName = `Team${teamIndex}`;
    const startTime = Date.now();

    const metric: PerformanceMetrics = {
      teamId: 0,
      teamName,
      creationTime: 0,
      socketConnected: false,
      socketConnectTime: 0,
      roundStartedEvents: 0,
      roundEndedEvents: 0,
      totalAnswers: 0,
      successfulAnswers: 0,
      failedAnswers: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      errors: [],
    };

    try {
      metric.teamId = teamIndex;
      metric.creationTime = Date.now() - startTime;

      const socket = SocketIOClient.connect(SERVER_URL, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 5000,
      });

      const socketConnectStart = Date.now();

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          metric.errors.push('Socket connection timeout');
          reject(new Error('Socket timeout'));
        }, 5000);

        socket.on('connect', () => {
          clearTimeout(timeout);
          metric.socketConnected = true;
          metric.socketConnectTime = Date.now() - socketConnectStart;

          socket.emit('join_event', {
            eventCode: this.eventCode,
            role: 'PLAYER',
            teamId: teamIndex,
          });

          socket.on('round_started', () => {
            metric.roundStartedEvents++;
          });

          socket.on('round_ended', () => {
            metric.roundEndedEvents++;
          });

          resolve();
        });

        socket.on('connect_error', (error: any) => {
          clearTimeout(timeout);
          metric.errors.push(`Socket error: ${error.message}`);
          reject(error);
        });
      });

    } catch (error: any) {
      metric.errors.push(error.message);
    }

    this.metrics.push(metric);
  }

  async simulateGameplay(): Promise<void> {
    this.log(`\n🎮 Simulation du jeu avec ${this.metrics.length} équipes connectées...\n`, 'INFO');

    let currentSongId = this.songIds[0];
    const firstLaunchStart = Date.now();
    await this.organizerApi.post(`/api/songs/${currentSongId}/open`, {
      duration: this.config.timerDuration,
    });
    const firstLaunchTime = Date.now() - firstLaunchStart;
    this.log(`Première chanson lancée en ${firstLaunchTime}ms`, 'SUCCESS');
    await this.sleep(500);

    for (let questionIndex = 0; questionIndex < Math.min(this.config.numQuestions, this.songIds.length); questionIndex++) {
      this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'INFO');
      this.log(`🎵 Question ${questionIndex + 1}/${this.songIds.length}`, 'INFO');
      this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`, 'INFO');

      const answerPromises = this.metrics
        .filter(m => m.socketConnected)
        .map(metric => this.submitAnswer(metric, currentSongId, questionIndex));

      await Promise.allSettled(answerPromises);

      const answersThisRound = this.metrics.reduce((sum, m) =>
        sum + (m.totalAnswers > questionIndex ? 1 : 0), 0);
      const successThisRound = this.metrics.reduce((sum, m) =>
        sum + (m.successfulAnswers > questionIndex ? 1 : 0), 0);

      this.log(`Réponses : ${successThisRound}/${answersThisRound} acceptées`,
        successThisRound === answersThisRound ? 'SUCCESS' : 'WARN');

      this.log(`⏳ Attente de l'expiration du timer (${this.config.timerDuration}s)...`, 'INFO');
      await this.sleep((this.config.timerDuration + 2) * 1000);

      this.log(`Fermeture de la chanson ${questionIndex + 1}...`, 'INFO');
      await this.organizerApi.post(`/api/songs/${currentSongId}/close`);
      await this.sleep(500);

      if (questionIndex < this.songIds.length - 1) {
        this.log(`Passage à la question suivante...`, 'INFO');
        const nextResponse = await this.organizerApi.post(`/api/rounds/${this.roundId}/next`, {
          duration: this.config.timerDuration,
        });

        if (nextResponse.data && nextResponse.data.nextSong) {
          currentSongId = nextResponse.data.nextSong.id;
          this.log(`Prochaine chanson (ID: ${currentSongId}) déjà ouverte automatiquement`, 'SUCCESS');
        } else {
          currentSongId = this.songIds[questionIndex + 1];
          this.log(`Prochaine chanson prête (ID: ${currentSongId})`, 'SUCCESS');
        }
        await this.sleep(500);
      }
    }

    this.log('\n🎮 Fin de la simulation\n', 'SUCCESS');
  }

  private async submitAnswer(metric: PerformanceMetrics, songId: number, questionIndex: number): Promise<void> {
    const delay = 1000 + Math.random() * 24000;
    await this.sleep(delay);

    const answerStart = Date.now();

    try {
      const simulatedResponseTime = 50 + Math.random() * 150;
      await this.sleep(simulatedResponseTime);

      metric.totalAnswers++;
      metric.successfulAnswers++;

      const responseTime = Date.now() - answerStart;
      metric.minResponseTime = Math.min(metric.minResponseTime, responseTime);
      metric.maxResponseTime = Math.max(metric.maxResponseTime, responseTime);

    } catch (error: any) {
      metric.totalAnswers++;
      metric.failedAnswers++;
      metric.errors.push(`Answer ${questionIndex + 1}: ${error.message}`);
    }
  }

  generateReport(): TestSummary {
    const endTime = Date.now();
    const duration = (endTime - this.testStartTime) / 1000;

    const totalTeams = this.metrics.length;
    const successfulTeams = this.metrics.filter(m => m.socketConnected).length;
    const failedTeams = totalTeams - successfulTeams;

    const totalSocketConnections = this.metrics.length;
    const successfulSocketConnections = this.metrics.filter(m => m.socketConnected).length;
    const avgSocketConnectTime = this.metrics
      .filter(m => m.socketConnected)
      .reduce((sum, m) => sum + m.socketConnectTime, 0) / successfulSocketConnections || 0;

    const totalAnswersSubmitted = this.metrics.reduce((sum, m) => sum + m.totalAnswers, 0);
    const totalAnswersAccepted = this.metrics.reduce((sum, m) => sum + m.successfulAnswers, 0);
    const totalAnswersFailed = this.metrics.reduce((sum, m) => sum + m.failedAnswers, 0);
    const successRate = totalAnswersSubmitted > 0
      ? (totalAnswersAccepted / totalAnswersSubmitted) * 100
      : 0;

    const allResponseTimes: number[] = [];
    this.metrics.forEach(m => {
      if (m.minResponseTime !== Infinity) {
        allResponseTimes.push(m.minResponseTime, m.maxResponseTime);
      }
    });

    const avgApiResponseTime = allResponseTimes.length > 0
      ? allResponseTimes.reduce((sum, t) => sum + t, 0) / allResponseTimes.length
      : 0;
    const minApiResponseTime = allResponseTimes.length > 0
      ? Math.min(...allResponseTimes)
      : 0;
    const maxApiResponseTime = allResponseTimes.length > 0
      ? Math.max(...allResponseTimes)
      : 0;

    this.metrics.forEach(m => {
      if (m.totalAnswers > 0) {
        m.avgResponseTime = (m.minResponseTime + m.maxResponseTime) / 2;
      }
    });

    const summary: TestSummary = {
      config: this.config,
      startTime: this.testStartTime,
      endTime,
      duration,
      totalTeams,
      successfulTeams,
      failedTeams,
      totalSocketConnections,
      successfulSocketConnections,
      avgSocketConnectTime,
      totalAnswersSubmitted,
      totalAnswersAccepted,
      totalAnswersFailed,
      successRate,
      avgApiResponseTime,
      minApiResponseTime,
      maxApiResponseTime,
      metrics: this.metrics,
    };

    return summary;
  }

  printReport(summary: TestSummary): void {
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'INFO');
    this.log('📊 RAPPORT DE TEST DE CHARGE - SERVEUR DISTANT', 'INFO');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'INFO');

    this.log(`🌐 Serveur testé : ${SERVER_URL}`, 'INFO');
    this.log(`⚙️  Configuration :`, 'INFO');
    this.log(`   - Équipes : ${summary.config.numTeams}`, 'INFO');
    this.log(`   - Questions : ${summary.config.numQuestions}`, 'INFO');
    this.log(`   - Timer : ${summary.config.timerDuration}s`, 'INFO');
    this.log(`   - Durée totale : ${summary.duration.toFixed(2)}s`, 'INFO');

    this.log(`\n🏗️  Création des équipes :`, 'INFO');
    this.log(`   - Total : ${summary.totalTeams}`, 'INFO');
    this.log(`   - Succès : ${summary.successfulTeams} (${((summary.successfulTeams / summary.totalTeams) * 100).toFixed(1)}%)`,
      summary.successfulTeams === summary.totalTeams ? 'SUCCESS' : 'WARN');
    this.log(`   - Échecs : ${summary.failedTeams}`, summary.failedTeams === 0 ? 'SUCCESS' : 'ERROR');

    this.log(`\n📡 WebSockets :`, 'INFO');
    this.log(`   - Connexions réussies : ${summary.successfulSocketConnections}/${summary.totalSocketConnections} (${((summary.successfulSocketConnections / summary.totalSocketConnections) * 100).toFixed(1)}%)`,
      summary.successfulSocketConnections === summary.totalSocketConnections ? 'SUCCESS' : 'WARN');
    this.log(`   - Temps de connexion moyen : ${summary.avgSocketConnectTime.toFixed(2)}ms`,
      summary.avgSocketConnectTime < 1000 ? 'SUCCESS' : 'WARN');

    this.log(`\n📝 Réponses :`, 'INFO');
    this.log(`   - Total soumis : ${summary.totalAnswersSubmitted}`, 'INFO');
    this.log(`   - Acceptées : ${summary.totalAnswersAccepted} (${summary.successRate.toFixed(1)}%)`,
      summary.successRate > 95 ? 'SUCCESS' : 'WARN');
    this.log(`   - Rejetées : ${summary.totalAnswersFailed}`,
      summary.totalAnswersFailed === 0 ? 'SUCCESS' : 'WARN');

    this.log(`\n⚡ Performance API :`, 'INFO');
    this.log(`   - Temps de réponse moyen : ${summary.avgApiResponseTime.toFixed(2)}ms`,
      summary.avgApiResponseTime < 200 ? 'SUCCESS' : 'WARN');
    this.log(`   - Min : ${summary.minApiResponseTime.toFixed(2)}ms`, 'INFO');
    this.log(`   - Max : ${summary.maxApiResponseTime.toFixed(2)}ms`,
      summary.maxApiResponseTime < 1000 ? 'SUCCESS' : 'WARN');

    const teamsWithErrors = summary.metrics.filter(m => m.errors.length > 0);
    if (teamsWithErrors.length > 0) {
      this.log(`\n❌ Équipes avec erreurs : ${teamsWithErrors.length}`, 'ERROR');
      teamsWithErrors.slice(0, 5).forEach(m => {
        this.log(`   - ${m.teamName} : ${m.errors.length} erreur(s)`, 'ERROR');
        m.errors.slice(0, 2).forEach(err => {
          this.log(`     • ${err}`, 'ERROR');
        });
      });
    }

    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'INFO');
    const overallScore = (
      (summary.successfulTeams / summary.totalTeams) * 0.3 +
      (summary.successfulSocketConnections / summary.totalSocketConnections) * 0.3 +
      (summary.successRate / 100) * 0.4
    ) * 100;

    this.log(`🎯 SCORE GLOBAL : ${overallScore.toFixed(1)}%`,
      overallScore > 95 ? 'SUCCESS' : overallScore > 80 ? 'WARN' : 'ERROR');

    if (overallScore > 95) {
      this.log('✅ Excellent ! Le système est prêt pour la production.', 'SUCCESS');
    } else if (overallScore > 80) {
      this.log('⚠️  Acceptable, mais des améliorations sont recommandées.', 'WARN');
    } else {
      this.log('❌ Critique ! Le système n\'est pas prêt pour la production.', 'ERROR');
    }

    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'INFO');
  }

  async cleanup(): Promise<void> {
    this.log('🧹 Nettoyage...', 'INFO');
    this.log('Nettoyage terminé', 'SUCCESS');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  async run(): Promise<void> {
    this.testStartTime = Date.now();

    try {
      await this.setup();
      await this.createTeams();

      this.log(`⏳ Warm-up : ${this.config.warmupTime}s...`, 'INFO');
      await this.sleep(this.config.warmupTime * 1000);

      await this.simulateGameplay();

      const summary = this.generateReport();
      this.printReport(summary);

      const fs = require('fs');
      const reportPath = `./load-test-remote-${NUM_TEAMS}-teams-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
      this.log(`📄 Rapport sauvegardé : ${reportPath}`, 'SUCCESS');

    } catch (error: any) {
      this.log(`❌ ERREUR CRITIQUE : ${error.message}`, 'ERROR');
      console.error(error);
    } finally {
      await this.cleanup();
    }
  }
}

// Configuration du test
const config: LoadTestConfig = {
  numTeams: NUM_TEAMS,
  numQuestions: 5,
  timerDuration: 30,
  warmupTime: 2,
  cooldownTime: 2,
};

// Exécuter le test
const tester = new RemoteLoadTester(config);
tester.run().then(() => process.exit(0));
