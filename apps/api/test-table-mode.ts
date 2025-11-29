/**
 * Script de test pour la fonctionnalité "Mode Table"
 *
 * Ce script teste :
 * 1. Création d'un événement avec tableMode activé
 * 2. Création de plusieurs équipes
 * 3. Création de tables
 * 4. Association équipes -> tables
 * 5. Récupération du classement par table
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testTableMode() {
  try {
    log('\n🧪 Test de la fonctionnalité "Mode Table"\n', 'magenta');

    // 1. Créer un événement avec tableMode activé
    log('📝 Étape 1: Création d\'un événement avec tableMode activé...', 'blue');

    // Note: Nous devons d'abord avoir un tenant et un utilisateur
    // Pour ce test, on suppose qu'il existe déjà un événement dans la DB
    // Utilisons un code d'événement existant ou créons-en un

    const eventCode = 'TEST' + Math.random().toString(36).substring(2, 8).toUpperCase();
    log(`   Code événement de test: ${eventCode}`, 'yellow');

    // 2. Créer des équipes
    log('\n📝 Étape 2: Création de 4 équipes...', 'blue');
    const teams = [];
    for (let i = 1; i <= 4; i++) {
      try {
        const teamRes = await axios.post(`${API_URL}/events/${eventCode}/teams`, {
          name: `Équipe ${i}`
        });
        teams.push(teamRes.data);
        log(`   ✓ Équipe ${i} créée: ${teamRes.data.id}`, 'green');
      } catch (error: any) {
        if (error.response?.data?.error?.code === 'EVENT_NOT_FOUND') {
          log(`   ✗ Événement ${eventCode} non trouvé. Créez d'abord un événement.`, 'red');
          return;
        }
        throw error;
      }
    }

    // 3. Créer des tables
    log('\n📝 Étape 3: Création de 2 tables...', 'blue');
    const tables = [];
    for (let i = 1; i <= 2; i++) {
      try {
        const tableRes = await axios.post(`${API_URL}/events/${eventCode}/tables`, {
          name: `Table ${i}`
        });
        tables.push(tableRes.data);
        log(`   ✓ Table ${i} créée: ${tableRes.data.id}`, 'green');
      } catch (error: any) {
        if (error.response?.data?.error?.code === 'TABLE_MODE_NOT_ENABLED') {
          log(`   ✗ Le mode table n'est pas activé pour cet événement.`, 'red');
          log(`      Activez-le en mettant table_mode=1 dans la table events pour cet événement.`, 'yellow');
          return;
        }
        throw error;
      }
    }

    // 4. Associer les équipes aux tables
    log('\n📝 Étape 4: Association des équipes aux tables...', 'blue');
    // Équipes 1 et 2 -> Table 1
    // Équipes 3 et 4 -> Table 2
    for (let i = 0; i < teams.length; i++) {
      const tableIndex = i < 2 ? 0 : 1;
      try {
        await axios.post(`${API_URL}/teams/${teams[i].id}/join-table`, {
          tableId: tables[tableIndex].id
        });
        log(`   ✓ ${teams[i].name} rejoint ${tables[tableIndex].name}`, 'green');
      } catch (error: any) {
        log(`   ✗ Erreur: ${error.response?.data?.error?.message || error.message}`, 'red');
      }
    }

    // 5. Récupérer la liste des tables
    log('\n📝 Étape 5: Récupération de la liste des tables...', 'blue');
    const tablesListRes = await axios.get(`${API_URL}/events/${eventCode}/tables`);
    log(`   ✓ ${tablesListRes.data.length} table(s) trouvée(s):`, 'green');
    tablesListRes.data.forEach((table: any) => {
      log(`      - ${table.name}: ${table.teamsCount} équipe(s)`, 'yellow');
    });

    // 6. Récupérer le classement par table
    log('\n📝 Étape 6: Récupération du classement par table...', 'blue');
    try {
      const leaderboardRes = await axios.get(`${API_URL}/events/${eventCode}/table-leaderboard`);
      log(`   ✓ Classement récupéré:`, 'green');
      leaderboardRes.data.forEach((table: any) => {
        log(`      ${table.rank}. ${table.tableName}: ${table.totalPoints} points (${table.teamsCount} équipes)`, 'yellow');
        table.teams?.forEach((team: any) => {
          log(`         - ${team.name}: ${team.points} points`, 'yellow');
        });
      });
    } catch (error: any) {
      log(`   ✗ Erreur: ${error.response?.data?.error?.message || error.message}`, 'red');
    }

    log('\n✅ Tests terminés avec succès!\n', 'green');

  } catch (error: any) {
    log('\n❌ Erreur lors des tests:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Message: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`   ${error.message}`, 'red');
    }
  }
}

// Instructions pour l'utilisateur
log('\n📋 Instructions avant de lancer le test:', 'yellow');
log('1. Assurez-vous que l\'API est démarrée (npm run dev:api)', 'yellow');
log('2. Créez un événement avec table_mode=1 dans la base de données', 'yellow');
log('3. Modifiez eventCode dans ce script si nécessaire', 'yellow');
log('\nLancement du test dans 3 secondes...\n', 'yellow');

setTimeout(() => {
  testTableMode();
}, 3000);
