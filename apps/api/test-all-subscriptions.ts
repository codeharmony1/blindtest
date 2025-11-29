/**
 * Script de test complet pour tous les types d'abonnements
 * Test l'inscription et les fonctionnalités de chaque plan
 */

import axios from 'axios';
import * as fs from 'fs';

const API_URL = 'http://localhost:3001';

interface TestResult {
  plan: string;
  testName: string;
  success: boolean;
  details?: any;
  error?: string;
  timestamp: string;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  results.push(result);
  const icon = result.success ? '✅' : '❌';
  console.log(`${icon} [${result.plan}] ${result.testName}`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
  if (result.details) {
    console.log(`   Details:`, JSON.stringify(result.details, null, 2));
  }
}

async function testSubscriptionPlan(plan: 'DEMO' | 'PER_EVENT' | 'MONTHLY') {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST DU PLAN: ${plan}`);
  console.log(`${'='.repeat(60)}\n`);

  const timestamp = Date.now();
  const testSlug = `test-${plan.toLowerCase()}-${timestamp}`;
  const testEmail = `test-${plan.toLowerCase()}-${timestamp}@test.local`;
  const testPassword = 'TestPassword123!';
  let token = '';
  let tenantId = '';

  // Test 1: Inscription
  try {
    console.log(`\n📝 Test 1: Inscription avec le plan ${plan}...`);
    const registerResponse = await axios.post(`${API_URL}/api/tenants/register`, {
      name: `Test Organization ${plan}`,
      slug: testSlug,
      ownerEmail: testEmail,
      ownerPassword: testPassword,
      ownerName: `Test Owner ${plan}`,
      plan: plan
    });

    token = registerResponse.data.token;
    tenantId = registerResponse.data.tenant.id;

    logResult({
      plan,
      testName: 'Inscription',
      success: true,
      details: {
        tenantId: registerResponse.data.tenant.id,
        slug: registerResponse.data.tenant.slug,
        plan: registerResponse.data.tenant.plan,
        expiresAt: registerResponse.data.tenant.expiresAt,
        userEmail: registerResponse.data.user.email,
        userRole: registerResponse.data.user.role
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logResult({
      plan,
      testName: 'Inscription',
      success: false,
      error: error.response?.data?.error?.message || error.message,
      timestamp: new Date().toISOString()
    });
    return; // Arrêter les tests pour ce plan si l'inscription échoue
  }

  // Test 2: Connexion
  try {
    console.log(`\n🔐 Test 2: Connexion...`);
    const loginResponse = await axios.post(`${API_URL}/api/tenants/login`, {
      email: testEmail,
      password: testPassword,
      tenantSlug: testSlug
    });

    token = loginResponse.data.token;

    logResult({
      plan,
      testName: 'Connexion',
      success: true,
      details: {
        userEmail: loginResponse.data.user.email,
        tenantName: loginResponse.data.tenant.name,
        plan: loginResponse.data.tenant.plan
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logResult({
      plan,
      testName: 'Connexion',
      success: false,
      error: error.response?.data?.error?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }

  // Test 3: Récupérer les informations du tenant
  try {
    console.log(`\n📊 Test 3: Informations du tenant...`);
    const tenantResponse = await axios.get(`${API_URL}/api/tenants/current`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const tenant = tenantResponse.data.tenant;
    const usage = tenantResponse.data.usage;

    logResult({
      plan,
      testName: 'Informations du tenant',
      success: true,
      details: {
        plan: tenant.plan,
        status: tenant.status,
        limits: tenant.limits,
        usage: usage
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logResult({
      plan,
      testName: 'Informations du tenant',
      success: false,
      error: error.response?.data?.error?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }

  // Test 4: Créer un événement
  try {
    console.log(`\n🎵 Test 4: Création d'un événement...`);
    const eventResponse = await axios.post(
      `${API_URL}/api/events`,
      {
        name: `Test Event ${plan}`,
        game_mode: 'BUZZ',
        playlist_size: 10
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    logResult({
      plan,
      testName: 'Création d\'événement',
      success: true,
      details: {
        eventId: eventResponse.data.id,
        eventCode: eventResponse.data.code,
        name: eventResponse.data.name
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logResult({
      plan,
      testName: 'Création d\'événement',
      success: false,
      error: error.response?.data?.error?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }

  // Test 5: Lister les utilisateurs
  try {
    console.log(`\n👥 Test 5: Liste des utilisateurs...`);
    const usersResponse = await axios.get(`${API_URL}/api/tenants/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logResult({
      plan,
      testName: 'Liste des utilisateurs',
      success: true,
      details: {
        userCount: usersResponse.data.users.length,
        users: usersResponse.data.users.map((u: any) => ({
          email: u.email,
          role: u.role,
          isActive: u.isActive
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logResult({
      plan,
      testName: 'Liste des utilisateurs',
      success: false,
      error: error.response?.data?.error?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }

  // Test 6: Créer un nouvel utilisateur (si limite le permet)
  try {
    console.log(`\n➕ Test 6: Création d'un nouvel utilisateur...`);
    const newUserResponse = await axios.post(
      `${API_URL}/api/tenants/users`,
      {
        email: `user2-${plan.toLowerCase()}-${timestamp}@test.local`,
        password: 'Password123!',
        role: 'ADMIN',
        displayName: `Test User 2 ${plan}`
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    logResult({
      plan,
      testName: 'Création d\'un nouvel utilisateur',
      success: true,
      details: {
        userId: newUserResponse.data.user.id,
        email: newUserResponse.data.user.email,
        role: newUserResponse.data.user.role
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logResult({
      plan,
      testName: 'Création d\'un nouvel utilisateur',
      success: false,
      error: error.response?.data?.error?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }

  // Test 7: Vérifier la disponibilité du slug
  try {
    console.log(`\n🔍 Test 7: Vérification de la disponibilité du slug...`);

    // Test avec un slug existant (devrait retourner available: false)
    const checkExistingResponse = await axios.get(
      `${API_URL}/api/tenants/check-slug/${testSlug}`
    );

    // Test avec un slug nouveau (devrait retourner available: true)
    const newSlug = `new-slug-${timestamp}`;
    const checkNewResponse = await axios.get(
      `${API_URL}/api/tenants/check-slug/${newSlug}`
    );

    logResult({
      plan,
      testName: 'Vérification de la disponibilité du slug',
      success: !checkExistingResponse.data.available && checkNewResponse.data.available,
      details: {
        existingSlugAvailable: checkExistingResponse.data.available,
        newSlugAvailable: checkNewResponse.data.available
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logResult({
      plan,
      testName: 'Vérification de la disponibilité du slug',
      success: false,
      error: error.response?.data?.error?.message || error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function runAllTests() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🧪 TEST COMPLET DES ABONNEMENTS - BLINDTEST MUSICAL     ║
╚═══════════════════════════════════════════════════════════╝
  `);

  const plans: ('DEMO' | 'PER_EVENT' | 'MONTHLY')[] = ['DEMO', 'PER_EVENT', 'MONTHLY'];

  // Tester chaque plan
  for (const plan of plans) {
    await testSubscriptionPlan(plan);
  }

  // Générer le rapport final
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`📊 RAPPORT FINAL`);
  console.log(`${'='.repeat(60)}\n`);

  const summary = {
    totalTests: results.length,
    successCount: results.filter(r => r.success).length,
    failureCount: results.filter(r => !r.success).length,
    successRate: 0,
    byPlan: {} as Record<string, any>
  };

  summary.successRate = (summary.successCount / summary.totalTests) * 100;

  // Statistiques par plan
  for (const plan of plans) {
    const planResults = results.filter(r => r.plan === plan);
    const planSuccess = planResults.filter(r => r.success).length;

    summary.byPlan[plan] = {
      total: planResults.length,
      success: planSuccess,
      failure: planResults.length - planSuccess,
      successRate: (planSuccess / planResults.length) * 100
    };
  }

  console.log(`📈 Résumé global:`);
  console.log(`   Total des tests: ${summary.totalTests}`);
  console.log(`   Succès: ${summary.successCount} ✅`);
  console.log(`   Échecs: ${summary.failureCount} ❌`);
  console.log(`   Taux de réussite: ${summary.successRate.toFixed(2)}%\n`);

  console.log(`📊 Résultats par plan:\n`);
  for (const plan of plans) {
    const stats = summary.byPlan[plan];
    const icon = stats.successRate === 100 ? '✅' : stats.successRate > 50 ? '⚠️' : '❌';
    console.log(`   ${icon} ${plan}:`);
    console.log(`      Succès: ${stats.success}/${stats.total} (${stats.successRate.toFixed(2)}%)`);
  }

  // Sauvegarder le rapport détaillé
  const reportPath = './test-subscription-report.json';
  const report = {
    summary,
    results,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Rapport détaillé sauvegardé dans: ${reportPath}`);

  // Afficher les échecs détaillés
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log(`\n\n⚠️  DÉTAILS DES ÉCHECS:\n`);
    failures.forEach((failure, index) => {
      console.log(`${index + 1}. [${failure.plan}] ${failure.testName}`);
      console.log(`   Erreur: ${failure.error}\n`);
    });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✨ Tests terminés!`);
  console.log(`${'='.repeat(60)}\n`);
}

// Exécuter les tests
runAllTests().catch(error => {
  console.error('❌ Erreur fatale lors de l\'exécution des tests:', error);
  process.exit(1);
});
