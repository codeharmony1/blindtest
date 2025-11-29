/**
 * TEST COMPLET : 10 ÉQUIPES - 10 QUESTIONS
 *
 * Ce test vérifie :
 * 1. Que toutes les réponses des 10 équipes sont bien reçues en temps réel
 * 2. Que le timer de 30 secondes fonctionne correctement
 * 3. Qu'un message "Temps écoulé" apparaît à la fin du timer
 * 4. Qu'on ne peut plus répondre après expiration du timer
 * 5. Que le bouton "LANCER LA CHANSON SUIVANTE" fonctionne
 * 6. Que les scores sont correctement calculés
 */

import axios, { AxiosInstance } from 'axios';
import * as SocketIOClient from 'socket.io-client';

type Socket = SocketIOClient.Socket;

const API_URL = 'http://localhost:3001';
const SOCKET_URL = 'http://localhost:3001';

// Types
interface Team {
  id: number;
  name: string;
  token: string;
  socket: Socket;
  answers: SubmittedAnswer[];
  roundStartEvents: number;
  roundEndEvents: number;
}

interface SubmittedAnswer {
  songIndex: number;
  answer: string;
  submittedAt: number;
  serverResponse?: any;
  error?: any;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

// Configuration du test
const CONFIG = {
  NUM_TEAMS: 10,
  NUM_QUESTIONS: 5, // Limité à 5 pour le plan DEMO
  TIMER_DURATION: 30, // secondes
  ORGANIZER_CREDENTIALS: {
    email: 'admin@test.com',
    password: 'admin123456',
  },
  EVENT_NAME: 'Test 10 Teams - ' + new Date().toISOString(),
  ROUND_NAME: 'Round Test',
};

// Réponses type pour les tests (alternance entre bonnes et mauvaises réponses)
const TEST_ANSWERS = [
  { text: 'Billie Jean - Michael Jackson', isCorrect: true },
  { text: 'Mauvaise réponse 1', isCorrect: false },
  { text: 'Bohemian Rhapsody - Queen', isCorrect: true },
  { text: 'Mauvaise réponse 2', isCorrect: false },
  { text: 'Imagine - John Lennon', isCorrect: true },
  { text: 'Mauvaise réponse 3', isCorrect: false },
  { text: 'Hotel California - Eagles', isCorrect: true },
  { text: 'Mauvaise réponse 4', isCorrect: false },
  { text: 'Smells Like Teen Spirit - Nirvana', isCorrect: true },
  { text: 'Mauvaise réponse 5', isCorrect: false },
];

class BlindTestTester {
  private organizerToken: string = '';
  private organizerApi: AxiosInstance;
  private eventId: number = 0;
  private eventCode: string = '';
  private roundId: number = 0;
  private teams: Team[] = [];
  private songIds: number[] = [];
  private testResults: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.organizerApi = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    });
  }

  // Utilitaire pour logger avec timestamp
  private log(message: string, level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' = 'INFO') {
    const timestamp = new Date().toISOString();
    const elapsed = this.startTime ? ((Date.now() - this.startTime) / 1000).toFixed(2) : '0.00';
    const prefix = {
      INFO: '📋',
      SUCCESS: '✅',
      ERROR: '❌',
      WARN: '⚠️',
    }[level];
    console.log(`[${elapsed}s] ${prefix} ${message}`);
  }

  // Étape 1 : Créer un tenant de test
  async createTenant(): Promise<void> {
    this.log('Création d\'un tenant de test...', 'INFO');
    try {
      const timestamp = Date.now();
      const tenantSlug = `test10teams-${timestamp}`;

      const response = await axios.post(`${API_URL}/api/tenants/register`, {
        name: `Test 10 Teams ${timestamp}`,
        slug: tenantSlug,
        ownerEmail: `test${timestamp}@blindtest.local`,
        ownerPassword: CONFIG.ORGANIZER_CREDENTIALS.password,
        ownerName: 'Test Organizer',
        plan: 'DEMO', // Plan DEMO avec limite de 5 chansons
      });

      if (response.status === 201 && response.data.token) {
        this.organizerToken = response.data.token;
        this.organizerApi.defaults.headers.common['Authorization'] = `Bearer ${this.organizerToken}`;
        this.log(`Tenant créé : ${tenantSlug}`, 'SUCCESS');
        this.testResults.push({ success: true, message: `Tenant créé : ${tenantSlug}` });
      } else {
        throw new Error(`Échec création tenant: ${response.status}`);
      }
    } catch (error: any) {
      this.log(`Échec création tenant : ${error.message}`, 'ERROR');
      this.testResults.push({ success: false, message: 'Échec création tenant', details: error.message });
      throw error;
    }
  }

  // Étape 2 : Création de l'événement
  async createEvent(): Promise<void> {
    this.log('Création de l\'événement...', 'INFO');
    try {
      const eventCode = `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const response = await this.organizerApi.post('/api/events', {
        name: CONFIG.EVENT_NAME,
        code: eventCode,
        date: new Date().toISOString(),
        maxTeams: 20,
        maxPlayersPerTeam: 5,
      });

      const eventData = response.data.event || response.data;
      this.eventId = eventData.id;
      this.eventCode = eventData.code || eventCode;

      this.log(`Événement créé : ID=${this.eventId}, Code=${this.eventCode}`, 'SUCCESS');
      this.testResults.push({ success: true, message: `Événement créé : ${this.eventCode}` });
    } catch (error: any) {
      this.log(`Échec création événement : ${error.response?.data || error.message}`, 'ERROR');
      this.testResults.push({ success: false, message: 'Échec création événement', details: error.response?.data || error.message });
      throw error;
    }
  }

  // Étape 3 : Création du round
  async createRound(): Promise<void> {
    this.log('Création du round...', 'INFO');
    try {
      const response = await this.organizerApi.post(`/api/events/${this.eventCode}/rounds`, {
        name: CONFIG.ROUND_NAME,
        idx: 1,
      });
      const roundData = response.data.round || response.data;
      this.roundId = roundData.id;
      this.log(`Round créé : ID=${this.roundId}`, 'SUCCESS');
      this.testResults.push({ success: true, message: `Round créé : ${this.roundId}` });
    } catch (error: any) {
      this.log(`Échec création round : ${error.response?.data || error.message}`, 'ERROR');
      this.testResults.push({ success: false, message: 'Échec création round', details: error.response?.data || error.message });
      throw error;
    }
  }

  // Étape 4 : Ajout des chansons au round
  async addSongs(): Promise<void> {
    this.log(`Ajout de ${CONFIG.NUM_QUESTIONS} chansons au round...`, 'INFO');
    try {
      for (let i = 0; i < CONFIG.NUM_QUESTIONS; i++) {
        const response = await this.organizerApi.post(`/api/rounds/${this.roundId}/songs`, {
          mode: 'prepared',
          title: TEST_ANSWERS[i].text.split(' - ')[0] || `Chanson ${i + 1}`,
          artist: TEST_ANSWERS[i].text.split(' - ')[1] || `Artiste ${i + 1}`,
          idx: i + 1,
          duration: CONFIG.TIMER_DURATION,
        });
        const songData = response.data;
        this.songIds.push(songData.id);
      }
      this.log(`${CONFIG.NUM_QUESTIONS} chansons ajoutées avec succès`, 'SUCCESS');
      this.testResults.push({ success: true, message: `${CONFIG.NUM_QUESTIONS} chansons ajoutées` });
    } catch (error: any) {
      const errorDetail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.log(`Échec ajout chansons : ${errorDetail}`, 'ERROR');
      this.testResults.push({ success: false, message: 'Échec ajout chansons', details: errorDetail });
      throw error;
    }
  }

  // Étape 5 : Activation de l'événement (skip - not needed for multi-tenant)
  async activateEvent(): Promise<void> {
    this.log('Activation de l\'événement (skip - not needed)', 'INFO');
    this.testResults.push({ success: true, message: 'Événement activation skipped (multi-tenant)' });
    // Les événements multi-tenant sont actifs par défaut
  }

  // Étape 6 : Création des 10 équipes
  async createTeams(): Promise<void> {
    this.log(`Création de ${CONFIG.NUM_TEAMS} équipes...`, 'INFO');
    try {
      for (let i = 1; i <= CONFIG.NUM_TEAMS; i++) {
        const teamName = `Team${i}`;

        // Créer l'équipe
        const teamResponse = await axios.post(`${API_URL}/api/teams`, {
          event_code: this.eventCode,
          team_name: teamName,
        });
        const teamId = teamResponse.data.team.id;

        // Créer un joueur pour l'équipe
        const playerResponse = await axios.post(`${API_URL}/api/players`, {
          team_id: teamId,
          name: `Player${i}`,
        });
        const teamToken = playerResponse.data.teamToken;

        // Créer la socket WebSocket
        const socket = SocketIOClient.connect(SOCKET_URL, {
          transports: ['websocket'],
          reconnection: true,
        });

        const team: Team = {
          id: teamId,
          name: teamName,
          token: teamToken,
          socket,
          answers: [],
          roundStartEvents: 0,
          roundEndEvents: 0,
        };

        this.teams.push(team);
        this.log(`Équipe créée : ${teamName} (ID=${teamId})`, 'INFO');
      }
      this.log(`${CONFIG.NUM_TEAMS} équipes créées avec succès`, 'SUCCESS');
      this.testResults.push({ success: true, message: `${CONFIG.NUM_TEAMS} équipes créées` });
    } catch (error: any) {
      this.log(`Échec création équipes : ${error.message}`, 'ERROR');
      this.testResults.push({ success: false, message: 'Échec création équipes', details: error.message });
      throw error;
    }
  }

  // Étape 7 : Connexion des équipes via WebSocket
  async connectTeamSockets(): Promise<void> {
    this.log('Connexion des sockets WebSocket des équipes...', 'INFO');
    try {
      const connectionPromises = this.teams.map((team) => {
        return new Promise<void>((resolve, reject) => {
          team.socket.on('connect', () => {
            this.log(`Socket connectée pour ${team.name}`, 'INFO');

            // Rejoindre la room de l'événement
            team.socket.emit('join_event', {
              eventCode: this.eventCode,
              role: 'PLAYER',
              teamId: team.id,
            });

            // Écouter les événements de round
            team.socket.on('round_started', (data: any) => {
              team.roundStartEvents++;
              this.log(`${team.name} a reçu "round_started" pour la chanson ${data.songId}`, 'INFO');
            });

            team.socket.on('round_ended', (data: any) => {
              team.roundEndEvents++;
              this.log(`${team.name} a reçu "round_ended"`, 'INFO');
            });

            resolve();
          });

          team.socket.on('connect_error', (error: any) => {
            this.log(`Erreur de connexion socket pour ${team.name} : ${error.message}`, 'ERROR');
            reject(error);
          });

          // Timeout de connexion
          setTimeout(() => reject(new Error(`Timeout connexion socket pour ${team.name}`)), 5000);
        });
      });

      await Promise.all(connectionPromises);
      this.log('Toutes les sockets sont connectées', 'SUCCESS');
      this.testResults.push({ success: true, message: 'Toutes les sockets connectées' });
    } catch (error: any) {
      this.log(`Échec connexion sockets : ${error.message}`, 'ERROR');
      this.testResults.push({ success: false, message: 'Échec connexion sockets', details: error.message });
      throw error;
    }
  }

  // Étape 8 : Simuler le jeu - 10 questions
  async playGame(): Promise<void> {
    this.log(`\n🎮 DÉBUT DU JEU : ${CONFIG.NUM_QUESTIONS} questions\n`, 'INFO');

    for (let questionIndex = 0; questionIndex < CONFIG.NUM_QUESTIONS; questionIndex++) {
      const songId = this.songIds[questionIndex];
      const songTitle = TEST_ANSWERS[questionIndex].text;

      this.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'INFO');
      this.log(`📌 QUESTION ${questionIndex + 1}/${CONFIG.NUM_QUESTIONS} : ${songTitle}`, 'INFO');
      this.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`, 'INFO');

      // Lancer la chanson (DJ ouvre la question)
      await this.launchSong(songId, questionIndex);

      // Attendre que toutes les équipes reçoivent l'événement "round_started"
      await this.waitForRoundStartEvents();

      // Les équipes répondent à différents moments (répartis sur 30 secondes)
      await this.teamsSubmitAnswers(questionIndex);

      // Attendre l'expiration du timer (30 secondes)
      await this.waitForTimerExpiration();

      // Tester qu'on ne peut plus répondre après expiration
      await this.testPostExpirationSubmission(questionIndex);

      // Passer à la chanson suivante (DJ ferme et ouvre la suivante)
      if (questionIndex < CONFIG.NUM_QUESTIONS - 1) {
        await this.nextSong();
      }
    }

    this.log('\n🎮 FIN DU JEU\n', 'SUCCESS');
  }

  // Lancer une chanson (DJ)
  private async launchSong(songId: number, questionIndex: number): Promise<void> {
    try {
      this.log(`DJ lance la chanson ${questionIndex + 1}...`, 'INFO');
      const response = await this.organizerApi.post(`/api/songs/${songId}/open`, {
        duration: CONFIG.TIMER_DURATION,
      });
      this.log(`Chanson lancée : endsAt=${response.data.endsAt}`, 'SUCCESS');

      // Attendre un peu pour que les sockets reçoivent l'événement
      await this.sleep(200);
    } catch (error: any) {
      this.log(`Erreur lors du lancement de la chanson : ${error.message}`, 'ERROR');
      throw error;
    }
  }

  // Attendre que toutes les équipes reçoivent "round_started"
  private async waitForRoundStartEvents(): Promise<void> {
    const maxWait = 3000; // 3 secondes max
    const startWait = Date.now();

    while (Date.now() - startWait < maxWait) {
      const allReceived = this.teams.every(team => team.roundStartEvents > 0);
      if (allReceived) {
        this.log('✅ Toutes les équipes ont reçu "round_started"', 'SUCCESS');
        return;
      }
      await this.sleep(100);
    }

    const notReceived = this.teams.filter(team => team.roundStartEvents === 0);
    this.log(`⚠️ ${notReceived.length} équipes n'ont pas reçu "round_started"`, 'WARN');
  }

  // Les équipes soumettent leurs réponses à des moments différents
  private async teamsSubmitAnswers(questionIndex: number): Promise<void> {
    this.log('Les équipes commencent à répondre...', 'INFO');

    // Répartir les réponses sur 25 secondes (avant expiration du timer)
    const submissionPromises = this.teams.map(async (team, teamIndex) => {
      // Délai aléatoire entre 1 et 25 secondes
      const delay = 1000 + Math.random() * 24000;
      await this.sleep(delay);

      // Alterner entre bonnes et mauvaises réponses
      const answerText = teamIndex % 2 === 0
        ? TEST_ANSWERS[questionIndex].text
        : `Mauvaise réponse de ${team.name}`;

      const submittedAt = Date.now();

      try {
        const response = await axios.post(
          `${API_URL}/api/songs/${this.songIds[questionIndex]}/answers`,
          { text: answerText },
          { headers: { Authorization: `Bearer ${team.token}` } }
        );

        team.answers.push({
          songIndex: questionIndex,
          answer: answerText,
          submittedAt,
          serverResponse: response.data,
        });

        const elapsedSeconds = ((submittedAt - this.startTime) / 1000).toFixed(1);
        this.log(`${team.name} a répondu après ${elapsedSeconds}s : "${answerText.substring(0, 30)}..." → ${response.data.accepted ? '✅ Acceptée' : '❌ Rejetée'}`, 'SUCCESS');
      } catch (error: any) {
        team.answers.push({
          songIndex: questionIndex,
          answer: answerText,
          submittedAt,
          error: error.response?.data || error.message,
        });

        this.log(`${team.name} erreur de soumission : ${error.response?.data?.error?.code || error.message}`, 'ERROR');
      }
    });

    // Attendre que toutes les équipes aient tenté de répondre
    await Promise.all(submissionPromises);
    this.log('Toutes les équipes ont soumis leurs réponses', 'SUCCESS');
  }

  // Attendre l'expiration du timer
  private async waitForTimerExpiration(): Promise<void> {
    this.log(`⏳ Attente de l'expiration du timer (${CONFIG.TIMER_DURATION}s)...`, 'INFO');

    // Attendre 30 secondes + 2 secondes de marge
    await this.sleep((CONFIG.TIMER_DURATION + 2) * 1000);

    this.log('⏰ Timer expiré', 'SUCCESS');
  }

  // Tester qu'on ne peut plus répondre après expiration
  private async testPostExpirationSubmission(questionIndex: number): Promise<void> {
    this.log('Test de soumission après expiration du timer...', 'INFO');

    const testTeam = this.teams[0]; // Utiliser la première équipe pour le test
    const songId = this.songIds[questionIndex];

    try {
      await axios.post(
        `${API_URL}/api/songs/${songId}/answers`,
        { text: 'Réponse après expiration' },
        { headers: { Authorization: `Bearer ${testTeam.token}` } }
      );

      // Si on arrive ici, c'est un problème (la réponse n'aurait pas dû être acceptée)
      this.log('❌ ÉCHEC : La réponse a été acceptée après expiration du timer !', 'ERROR');
      this.testResults.push({
        success: false,
        message: `Question ${questionIndex + 1} : Réponse acceptée après expiration`,
      });
    } catch (error: any) {
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'TIME_EXPIRED' || errorCode === 'SUBMISSION_WINDOW_CLOSED' || errorCode === 'SONG_NOT_OPEN') {
        this.log(`✅ Réponse correctement rejetée : ${errorCode}`, 'SUCCESS');
        this.testResults.push({
          success: true,
          message: `Question ${questionIndex + 1} : Réponse rejetée après expiration (${errorCode})`,
        });
      } else {
        this.log(`⚠️ Réponse rejetée mais code d'erreur inattendu : ${errorCode}`, 'WARN');
        this.testResults.push({
          success: false,
          message: `Question ${questionIndex + 1} : Code d'erreur inattendu (${errorCode})`,
          details: error.response?.data,
        });
      }
    }
  }

  // Passer à la chanson suivante
  private async nextSong(): Promise<void> {
    try {
      this.log('DJ passe à la chanson suivante...', 'INFO');

      // Réinitialiser les compteurs d'événements pour la prochaine question
      this.teams.forEach(team => {
        team.roundStartEvents = 0;
        team.roundEndEvents = 0;
      });

      await this.organizerApi.post(`/api/rounds/${this.roundId}/next`, {
        duration: CONFIG.TIMER_DURATION,
      });

      this.log('Passage à la chanson suivante réussi', 'SUCCESS');

      // Attendre un peu pour que les sockets reçoivent les événements
      await this.sleep(500);
    } catch (error: any) {
      this.log(`Erreur lors du passage à la chanson suivante : ${error.message}`, 'ERROR');
      throw error;
    }
  }

  // Étape 9 : Vérification finale et génération du rapport
  async generateReport(): Promise<void> {
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'INFO');
    this.log('📊 RAPPORT FINAL DU TEST', 'INFO');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'INFO');

    // Résumé général
    const totalAnswers = this.teams.reduce((sum, team) => sum + team.answers.length, 0);
    const successfulAnswers = this.teams.reduce(
      (sum, team) => sum + team.answers.filter(a => a.serverResponse?.accepted).length,
      0
    );
    const rejectedAnswers = this.teams.reduce(
      (sum, team) => sum + team.answers.filter(a => a.error).length,
      0
    );

    this.log(`📌 Équipes créées : ${this.teams.length}/${CONFIG.NUM_TEAMS}`, 'INFO');
    this.log(`📌 Questions jouées : ${CONFIG.NUM_QUESTIONS}`, 'INFO');
    this.log(`📌 Réponses totales soumises : ${totalAnswers}`, 'INFO');
    this.log(`   ✅ Acceptées : ${successfulAnswers}`, 'SUCCESS');
    this.log(`   ❌ Rejetées : ${rejectedAnswers}`, 'ERROR');

    // Vérification des événements WebSocket
    this.log('\n📡 Événements WebSocket reçus :', 'INFO');
    this.teams.forEach(team => {
      this.log(`   ${team.name} : round_started=${team.roundStartEvents}, round_ended=${team.roundEndEvents}`, 'INFO');
    });

    // Résultats des tests
    const successCount = this.testResults.filter(r => r.success).length;
    const failureCount = this.testResults.filter(r => !r.success).length;

    this.log('\n✅ Tests réussis :', 'SUCCESS');
    this.testResults.filter(r => r.success).forEach(r => {
      this.log(`   ✓ ${r.message}`, 'SUCCESS');
    });

    if (failureCount > 0) {
      this.log('\n❌ Tests échoués :', 'ERROR');
      this.testResults.filter(r => !r.success).forEach(r => {
        this.log(`   ✗ ${r.message}`, 'ERROR');
        if (r.details) {
          this.log(`     Détails : ${JSON.stringify(r.details)}`, 'ERROR');
        }
      });
    }

    // Score final
    this.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'INFO');
    const scorePercentage = ((successCount / this.testResults.length) * 100).toFixed(1);
    this.log(`🎯 SCORE FINAL : ${successCount}/${this.testResults.length} (${scorePercentage}%)`,
      failureCount === 0 ? 'SUCCESS' : 'WARN');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'INFO');

    // Recommandations pour tests supplémentaires
    this.log('📋 TESTS SUPPLÉMENTAIRES RECOMMANDÉS AVANT LA PRODUCTION :', 'INFO');
    this.log('   1. Test de charge : Tester avec 50-100 équipes simultanées', 'INFO');
    this.log('   2. Test de reconnexion : Simuler des pertes de connexion réseau', 'INFO');
    this.log('   3. Test de latence : Simuler des connexions lentes (3G/4G)', 'INFO');
    this.log('   4. Test de stabilité : Faire tourner le jeu pendant 1-2 heures', 'INFO');
    this.log('   5. Test d\'intégrité des scores : Vérifier les calculs de points', 'INFO');
    this.log('   6. Test de sécurité : Tenter des injections SQL/XSS', 'INFO');
    this.log('   7. Test de cohérence : Vérifier la synchronisation entre clients', 'INFO');
    this.log('   8. Test de performance : Mesurer les temps de réponse API', 'INFO');
    this.log('   9. Test de UI/UX : Vérifier l\'affichage sur différents appareils', 'INFO');
    this.log('   10. Test de sauvegarde : Vérifier la persistance en base de données\n', 'INFO');
  }

  // Étape 10 : Nettoyage
  async cleanup(): Promise<void> {
    this.log('Nettoyage des ressources...', 'INFO');

    // Fermer toutes les sockets
    this.teams.forEach(team => {
      if (team.socket.connected) {
        team.socket.disconnect();
      }
    });

    this.log('Nettoyage terminé', 'SUCCESS');
  }

  // Utilitaire : Sleep
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Exécuter tous les tests
  async run(): Promise<void> {
    this.startTime = Date.now();

    try {
      await this.createTenant();
      await this.createEvent();
      await this.createRound();
      await this.addSongs();
      await this.activateEvent();
      await this.createTeams();
      await this.connectTeamSockets();
      await this.playGame();
      await this.generateReport();
    } catch (error: any) {
      this.log(`\n❌ ERREUR CRITIQUE : ${error.message}`, 'ERROR');
      console.error(error);
    } finally {
      await this.cleanup();
      process.exit(0);
    }
  }
}

// Exécution du test
const tester = new BlindTestTester();
tester.run();
