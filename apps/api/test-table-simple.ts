/**
 * Test simple du mode table
 * Prérequis: Exécuter setup-table-test.sql pour créer l'événement TABLETEST
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const EVENT_CODE = 'TABLETEST';

async function test() {
  console.log('\n🧪 Test du Mode Table\n');

  try {
    // 1. Vérifier que l'événement existe
    console.log('1️⃣  Vérification de l\'événement...');
    const eventRes = await axios.get(`${API_URL}/events/${EVENT_CODE}/public`);
    console.log(`   ✓ Événement: ${eventRes.data.name}`);
    console.log(`   ✓ Table mode: ${eventRes.data.settings?.tableMode || eventRes.data.tableMode || 'N/A'}`);

    // 2. Créer 4 équipes
    console.log('\n2️⃣  Création de 4 équipes...');
    const teams = [];
    for (let i = 1; i <= 4; i++) {
      try {
        const res = await axios.post(`${API_URL}/events/${EVENT_CODE}/teams`, {
          name: `Équipe ${i}`
        });
        teams.push(res.data);
        console.log(`   ✓ ${res.data.name} créée (ID: ${res.data.id})`);
      } catch (err: any) {
        if (err.response?.status === 409) {
          console.log(`   ⚠  Équipe ${i} existe déjà`);
          // Récupérer l'équipe existante
          const teamsRes = await axios.get(`${API_URL}/events/${EVENT_CODE}/teams`);
          const existing = teamsRes.data.find((t: any) => t.name === `Équipe ${i}`);
          if (existing) teams.push(existing);
        } else {
          throw err;
        }
      }
    }

    // 3. Créer 2 tables
    console.log('\n3️⃣  Création de 2 tables...');
    const tables = [];
    for (let i = 1; i <= 2; i++) {
      try {
        const res = await axios.post(`${API_URL}/events/${EVENT_CODE}/tables`, {
          name: `Table ${i}`
        });
        tables.push(res.data);
        console.log(`   ✓ ${res.data.name} créée (ID: ${res.data.id})`);
      } catch (err: any) {
        if (err.response?.status === 409) {
          console.log(`   ⚠  Table ${i} existe déjà`);
          const tablesRes = await axios.get(`${API_URL}/events/${EVENT_CODE}/tables`);
          const existing = tablesRes.data.find((t: any) => t.name === `Table ${i}`);
          if (existing) tables.push(existing);
        } else {
          throw err;
        }
      }
    }

    // 4. Associer équipes -> tables
    console.log('\n4️⃣  Association équipes -> tables...');
    if (teams.length >= 4 && tables.length >= 2) {
      // Équipes 1-2 -> Table 1, Équipes 3-4 -> Table 2
      for (let i = 0; i < 4; i++) {
        const tableIdx = i < 2 ? 0 : 1;
        try {
          await axios.post(`${API_URL}/teams/${teams[i].id}/join-table`, {
            tableId: tables[tableIdx].id
          });
          console.log(`   ✓ ${teams[i].name} → ${tables[tableIdx].name}`);
        } catch (err: any) {
          if (err.response?.data?.error?.code === 'TEAM_ALREADY_HAS_TABLE') {
            console.log(`   ⚠  ${teams[i].name} a déjà une table`);
          } else {
            throw err;
          }
        }
      }
    }

    // 5. Afficher les tables avec leurs équipes
    console.log('\n5️⃣  Liste des tables et équipes:');
    const tablesRes = await axios.get(`${API_URL}/events/${EVENT_CODE}/tables`);
    for (const table of tablesRes.data) {
      console.log(`   📊 ${table.name}: ${table.teamsCount} équipe(s)`);
    }

    // 6. Classement par table
    console.log('\n6️⃣  Classement par table:');
    try {
      const leaderboardRes = await axios.get(`${API_URL}/events/${EVENT_CODE}/table-leaderboard`);
      for (const table of leaderboardRes.data) {
        console.log(`   ${table.rank}. ${table.tableName}: ${table.totalPoints} pts (${table.teamsCount} équipes)`);
        if (table.teams) {
          table.teams.forEach((team: any) => {
            console.log(`      - ${team.name}: ${team.points} pts`);
          });
        }
      }
    } catch (err: any) {
      console.log(`   ⚠  ${err.response?.data?.error?.message || err.message}`);
    }

    console.log('\n✅ Test terminé avec succès!\n');

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.response?.data || error.message);
    process.exit(1);
  }
}

test();
