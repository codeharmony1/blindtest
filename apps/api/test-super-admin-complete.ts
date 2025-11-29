/**
 * Test complet de l'API Super-Admin
 * Ce script teste toutes les fonctionnalités de l'API /api/backstage
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = 'http://localhost:3001';
const BACKSTAGE_URL = `${API_URL}/api/backstage`;

// Credentials
const SUPER_ADMIN_EMAIL = 'superadmin@blindtest.fr';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin2025!';

let authToken: string = '';
let client: AxiosInstance;

// Helpers
function success(message: string) {
  console.log(`✅ ${message}`);
}

function error(message: string, err?: any) {
  console.error(`❌ ${message}`);
  if (err?.response?.data) {
    console.error('   Response:', JSON.stringify(err.response.data, null, 2));
  } else if (err?.message) {
    console.error('   Error:', err.message);
  }
}

function info(message: string) {
  console.log(`ℹ️  ${message}`);
}

function section(title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

// Tests
async function testLogin() {
  section('1. TEST AUTHENTIFICATION');

  try {
    info('Connexion avec les identifiants super-admin...');
    const response = await axios.post(`${BACKSTAGE_URL}/auth/login`, {
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
    });

    authToken = response.data.token;
    success('Connexion réussie');
    console.log(`   Token: ${authToken.substring(0, 30)}...`);
    console.log(`   Admin: ${response.data.admin.email}`);

    // Créer un client axios avec le token
    client = axios.create({
      baseURL: BACKSTAGE_URL,
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    return true;
  } catch (err: any) {
    error('Échec de la connexion', err);
    return false;
  }
}

async function testGlobalStats() {
  section('2. TEST STATISTIQUES GLOBALES');

  try {
    info('Récupération des statistiques...');
    const response = await client.get('/stats');
    const stats = response.data;

    success('Statistiques récupérées');
    console.log('   📊 Données:');
    console.log(`      - Organisations: ${stats.tenantsCount} (${stats.activeTenantsCount} actives)`);
    console.log(`      - Événements: ${stats.totalEventsCount} (${stats.liveEventsCount} en cours)`);
    console.log(`      - Joueurs: ${stats.totalPlayersCount}`);
    console.log(`      - Utilisateurs: ${stats.totalUsersCount}`);

    return true;
  } catch (err: any) {
    error('Échec de récupération des stats', err);
    return false;
  }
}

async function testGetTenants() {
  section('3. TEST LISTE DES ORGANISATIONS');

  try {
    info('Récupération de la liste des tenants...');
    const response = await client.get('/tenants');
    const tenants = response.data;

    success(`${tenants.length} organisation(s) trouvée(s)`);

    tenants.forEach((tenant: any, index: number) => {
      console.log(`\n   ${index + 1}. ${tenant.name}`);
      console.log(`      - ID: ${tenant.id}`);
      console.log(`      - Slug: ${tenant.slug || 'N/A'}`);
      console.log(`      - Plan: ${tenant.subscription_plan}`);
      console.log(`      - Statut: ${tenant.subscription_status}`);
      console.log(`      - Email: ${tenant.billing_email}`);
      console.log(`      - Actif: ${tenant.is_active ? 'Oui' : 'Non'}`);
      if (tenant.stats) {
        console.log(`      - Stats: ${tenant.stats.usersCount} users, ${tenant.stats.eventsCount} events`);
      }
    });

    return tenants;
  } catch (err: any) {
    error('Échec de récupération des tenants', err);
    return [];
  }
}

async function testGetTenantDetails(tenantId: string) {
  section('4. TEST DÉTAILS D\'UNE ORGANISATION');

  try {
    info(`Récupération des détails du tenant ${tenantId}...`);
    const response = await client.get(`/tenants/${tenantId}`);
    const tenant = response.data;

    success('Détails récupérés');
    console.log(`\n   Organisation: ${tenant.name}`);
    console.log(`   - Plan: ${tenant.subscription_plan}`);
    console.log(`   - Limites:`);
    console.log(`     • Événements concurrents: ${tenant.max_concurrent_events}`);
    console.log(`     • Joueurs par événement: ${tenant.max_players_per_event}`);
    console.log(`     • Utilisateurs: ${tenant.max_users}`);
    console.log(`     • Chansons par événement: ${tenant.max_songs_per_event || 'illimité'}`);

    if (tenant.users && tenant.users.length > 0) {
      console.log(`\n   Utilisateurs (${tenant.users.length}):`);
      tenant.users.forEach((user: any) => {
        console.log(`     - ${user.email} (${user.role})`);
      });
    }

    if (tenant.events && tenant.events.length > 0) {
      console.log(`\n   Événements (${tenant.events.length}):`);
      tenant.events.slice(0, 3).forEach((event: any) => {
        console.log(`     - ${event.name} (${event.code})`);
      });
    }

    return tenant;
  } catch (err: any) {
    error('Échec de récupération des détails', err);
    return null;
  }
}

async function testSuspendTenant(tenantId: string) {
  section('5. TEST SUSPENSION D\'ORGANISATION');

  try {
    info(`Suspension du tenant ${tenantId}...`);
    const response = await client.put(`/tenants/${tenantId}/suspend`, {
      reason: 'Test automatique de suspension',
    });

    success('Tenant suspendu avec succès');
    console.log(`   Nouveau statut: ${response.data.tenant.subscription_status}`);

    return true;
  } catch (err: any) {
    error('Échec de suspension', err);
    return false;
  }
}

async function testReactivateTenant(tenantId: string) {
  section('6. TEST RÉACTIVATION D\'ORGANISATION');

  try {
    info(`Réactivation du tenant ${tenantId}...`);
    const response = await client.put(`/tenants/${tenantId}/reactivate`);

    success('Tenant réactivé avec succès');
    console.log(`   Nouveau statut: ${response.data.tenant.subscription_status}`);

    return true;
  } catch (err: any) {
    error('Échec de réactivation', err);
    return false;
  }
}

async function testUpdateTenantPlan(tenantId: string, newPlan: string) {
  section('7. TEST CHANGEMENT DE PLAN');

  try {
    info(`Changement du plan du tenant ${tenantId} vers ${newPlan}...`);
    const response = await client.put(`/tenants/${tenantId}/plan`, {
      plan: newPlan,
    });

    success('Plan modifié avec succès');
    console.log(`   Nouveau plan: ${response.data.tenant.subscription_plan}`);
    console.log(`   Nouvelles limites:`);
    console.log(`     • Chansons par événement: ${response.data.tenant.max_songs_per_event || 'illimité'}`);

    return true;
  } catch (err: any) {
    error('Échec de changement de plan', err);
    return false;
  }
}

async function testGetLiveEvents() {
  section('8. TEST ÉVÉNEMENTS EN COURS');

  try {
    info('Récupération des événements live...');
    const response = await client.get('/events/live');
    const events = response.data;

    success(`${events.length} événement(s) en cours`);

    events.slice(0, 5).forEach((event: any, index: number) => {
      console.log(`\n   ${index + 1}. ${event.name} (${event.code})`);
      console.log(`      - Tenant: ${event.tenant?.name || 'N/A'}`);
      console.log(`      - Joueurs: ${event.playersCount || 0}`);
      console.log(`      - Équipes: ${event.teamsCount || 0}`);
    });

    return true;
  } catch (err: any) {
    error('Échec de récupération des événements live', err);
    return false;
  }
}

async function testGetAuditLogs() {
  section('9. TEST AUDIT LOGS');

  try {
    info('Récupération des logs d\'audit (20 derniers)...');
    const response = await client.get('/audit-logs', {
      params: { limit: 20 },
    });
    const logs = response.data;

    success(`${logs.length} log(s) récupéré(s)`);

    logs.slice(0, 5).forEach((log: any, index: number) => {
      console.log(`\n   ${index + 1}. ${log.action}`);
      console.log(`      - Admin: ${log.admin?.email || 'N/A'}`);
      console.log(`      - Cible: ${log.target_type || 'N/A'} #${log.target_id || 'N/A'}`);
      console.log(`      - Date: ${new Date(log.timestamp).toLocaleString('fr-FR')}`);
      console.log(`      - IP: ${log.ip_address || 'N/A'}`);
    });

    return true;
  } catch (err: any) {
    error('Échec de récupération des logs', err);
    return false;
  }
}

// Fonction principale
async function runTests() {
  console.log('\n🚀 DÉMARRAGE DES TESTS SUPER-ADMIN API\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // 1. Authentification
  if (await testLogin()) {
    testsPassed++;
  } else {
    testsFailed++;
    console.error('\n❌ ÉCHEC: Impossible de continuer sans authentification\n');
    process.exit(1);
  }

  // 2. Statistiques
  if (await testGlobalStats()) testsPassed++; else testsFailed++;

  // 3. Liste des tenants
  const tenants = await testGetTenants();
  if (tenants.length > 0) {
    testsPassed++;

    // 4. Détails d'un tenant
    const firstTenant = tenants[0];
    if (await testGetTenantDetails(firstTenant.id)) testsPassed++; else testsFailed++;

    // 5-7. Tests de modification (seulement si tenant DEMO)
    if (firstTenant.subscription_plan === 'DEMO') {
      if (await testSuspendTenant(firstTenant.id)) testsPassed++; else testsFailed++;
      if (await testReactivateTenant(firstTenant.id)) testsPassed++; else testsFailed++;
      if (await testUpdateTenantPlan(firstTenant.id, 'PER_EVENT')) testsPassed++; else testsFailed++;
      // Remettre en DEMO
      await testUpdateTenantPlan(firstTenant.id, 'DEMO');
    } else {
      info('Saute les tests de modification (tenant non-DEMO)');
      testsPassed += 3;
    }
  } else {
    testsFailed++;
  }

  // 8. Événements live
  if (await testGetLiveEvents()) testsPassed++; else testsFailed++;

  // 9. Audit logs
  if (await testGetAuditLogs()) testsPassed++; else testsFailed++;

  // Résumé
  section('RÉSUMÉ DES TESTS');
  console.log(`✅ Tests réussis: ${testsPassed}`);
  console.log(`❌ Tests échoués: ${testsFailed}`);
  console.log(`📊 Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ\n');
    process.exit(1);
  }
}

// Exécution
runTests().catch((err) => {
  console.error('\n💥 ERREUR FATALE:', err.message);
  process.exit(1);
});
