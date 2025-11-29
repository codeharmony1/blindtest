import axios, { AxiosInstance } from 'axios';

const API_URL = 'http://localhost:3001';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  data?: any;
}

class SubscriptionTester {
  private api: AxiosInstance;
  private results: TestResult[] = [];
  private tenantData: any = null;
  private authToken: string = '';

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      validateStatus: () => true, // Ne pas rejeter les erreurs
    });
  }

  private log(emoji: string, message: string) {
    console.log(`${emoji} ${message}`);
  }

  private addResult(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message?: string, data?: any) {
    this.results.push({ test, status, message, data });
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    this.log(emoji, `${test}: ${message || status}`);
  }

  // Test 1: Enregistrement d'un nouveau tenant
  async testTenantRegistration() {
    try {
      const timestamp = Date.now();
      const tenantName = `Test Company ${timestamp}`;
      const tenantSlug = `test-company-${timestamp}`;

      this.log('🧪', 'Test 1: Enregistrement d\'un nouveau tenant');

      const response = await this.api.post('/api/tenants/register', {
        name: tenantName,
        slug: tenantSlug,
        ownerEmail: `owner${timestamp}@test.com`,
        ownerPassword: 'TestPassword123!',
        ownerName: 'Test Owner',
        plan: 'DEMO'
      });

      if (response.status === 201 && response.data.token) {
        this.tenantData = response.data;
        this.authToken = response.data.token;

        this.addResult(
          'Enregistrement tenant',
          'PASS',
          `Tenant créé avec succès (ID: ${response.data.tenant.id})`,
          { tenant: response.data.tenant, user: response.data.user }
        );
        return true;
      } else {
        this.addResult(
          'Enregistrement tenant',
          'FAIL',
          `Code: ${response.status}, Message: ${JSON.stringify(response.data)}`
        );
        return false;
      }
    } catch (error: any) {
      this.addResult('Enregistrement tenant', 'FAIL', error.message);
      return false;
    }
  }

  // Test 2: Vérification de la disponibilité du slug
  async testSlugAvailability() {
    try {
      this.log('🧪', 'Test 2: Vérification de la disponibilité du slug');

      // Test un slug existant
      const usedSlug = this.tenantData.tenant.slug;
      const response1 = await this.api.get(`/api/tenants/check-slug/${usedSlug}`);

      if (response1.status === 200 && response1.data.available === false) {
        this.addResult(
          'Vérification slug existant',
          'PASS',
          'Slug détecté comme non disponible'
        );
      } else {
        this.addResult(
          'Vérification slug existant',
          'FAIL',
          'Slug devrait être non disponible'
        );
      }

      // Test un slug disponible
      const newSlug = `available-slug-${Date.now()}`;
      const response2 = await this.api.get(`/api/tenants/check-slug/${newSlug}`);

      if (response2.status === 200 && response2.data.available === true) {
        this.addResult(
          'Vérification slug disponible',
          'PASS',
          'Slug détecté comme disponible'
        );
      } else {
        this.addResult(
          'Vérification slug disponible',
          'FAIL',
          'Slug devrait être disponible'
        );
      }
    } catch (error: any) {
      this.addResult('Vérification slug', 'FAIL', error.message);
    }
  }

  // Test 3: Connexion au tenant
  async testTenantLogin() {
    try {
      this.log('🧪', 'Test 3: Connexion au tenant');

      const response = await this.api.post('/api/tenants/login', {
        email: this.tenantData.user.email,
        password: 'TestPassword123!',
        tenantSlug: this.tenantData.tenant.slug
      });

      if (response.status === 200 && response.data.token) {
        this.authToken = response.data.token;
        this.addResult(
          'Connexion tenant',
          'PASS',
          'Connexion réussie avec token JWT'
        );
        return true;
      } else {
        this.addResult(
          'Connexion tenant',
          'FAIL',
          `Code: ${response.status}, Message: ${JSON.stringify(response.data)}`
        );
        return false;
      }
    } catch (error: any) {
      this.addResult('Connexion tenant', 'FAIL', error.message);
      return false;
    }
  }

  // Test 4: Récupération des informations du tenant actuel
  async testGetCurrentTenant() {
    try {
      this.log('🧪', 'Test 4: Récupération des informations du tenant actuel');

      const response = await this.api.get('/api/tenants/current', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200 && response.data.tenant) {
        this.addResult(
          'Informations tenant',
          'PASS',
          `Plan: ${response.data.tenant.plan}, Status: ${response.data.tenant.status}`,
          response.data
        );
        return true;
      } else {
        this.addResult(
          'Informations tenant',
          'FAIL',
          `Code: ${response.status}`
        );
        return false;
      }
    } catch (error: any) {
      this.addResult('Informations tenant', 'FAIL', error.message);
      return false;
    }
  }

  // Test 5: Récupération des tarifs
  async testGetPricing() {
    try {
      this.log('🧪', 'Test 5: Récupération des tarifs');

      const response = await this.api.get('/api/payments/pricing');

      if (response.status === 200 && response.data.subscriptions) {
        const plans = Object.keys(response.data.subscriptions);
        this.addResult(
          'Récupération tarifs',
          'PASS',
          `${plans.length} plans disponibles: ${plans.join(', ')}`,
          response.data
        );
        return true;
      } else {
        this.addResult(
          'Récupération tarifs',
          'FAIL',
          `Code: ${response.status}`
        );
        return false;
      }
    } catch (error: any) {
      this.addResult('Récupération tarifs', 'FAIL', error.message);
      return false;
    }
  }

  // Test 6: Statut de paiement et limites
  async testPaymentStatus() {
    try {
      this.log('🧪', 'Test 6: Statut de paiement et limites');

      const response = await this.api.get('/api/payments/status', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200) {
        this.addResult(
          'Statut de paiement',
          'PASS',
          `Plan: ${response.data.subscription.plan}, Limites: ${response.data.limits.maxEvents} events`,
          response.data
        );
        return true;
      } else {
        this.addResult(
          'Statut de paiement',
          'FAIL',
          `Code: ${response.status}`
        );
        return false;
      }
    } catch (error: any) {
      this.addResult('Statut de paiement', 'FAIL', error.message);
      return false;
    }
  }

  // Test 7: Création de session de checkout (simulation)
  async testCreateCheckoutSession() {
    try {
      this.log('🧪', 'Test 7: Création de session de checkout (SKIP - nécessite Stripe)');

      this.addResult(
        'Création checkout',
        'SKIP',
        'Test nécessite une configuration Stripe valide'
      );
    } catch (error: any) {
      this.addResult('Création checkout', 'FAIL', error.message);
    }
  }

  // Test 8: Historique des paiements
  async testPaymentHistory() {
    try {
      this.log('🧪', 'Test 8: Historique des paiements');

      const response = await this.api.get('/api/payments/history', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200) {
        const count = response.data.payments?.length || 0;
        this.addResult(
          'Historique paiements',
          'PASS',
          `${count} paiements trouvés`,
          response.data
        );
        return true;
      } else {
        this.addResult(
          'Historique paiements',
          'FAIL',
          `Code: ${response.status}`
        );
        return false;
      }
    } catch (error: any) {
      this.addResult('Historique paiements', 'FAIL', error.message);
      return false;
    }
  }

  // Test 9: Liste des sessions actives
  async testActiveSessions() {
    try {
      this.log('🧪', 'Test 9: Liste des sessions actives');

      const response = await this.api.get('/api/payments/sessions', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200) {
        const count = response.data.sessions?.length || 0;
        this.addResult(
          'Sessions actives',
          'PASS',
          `${count} sessions trouvées`,
          response.data
        );
        return true;
      } else {
        this.addResult(
          'Sessions actives',
          'FAIL',
          `Code: ${response.status}`
        );
        return false;
      }
    } catch (error: any) {
      this.addResult('Sessions actives', 'FAIL', error.message);
      return false;
    }
  }

  // Test 10: Gestion des utilisateurs
  async testUserManagement() {
    try {
      this.log('🧪', 'Test 10: Gestion des utilisateurs');

      // Récupérer la liste des utilisateurs
      const listResponse = await this.api.get('/api/tenants/users', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (listResponse.status === 200) {
        this.addResult(
          'Liste utilisateurs',
          'PASS',
          `${listResponse.data.users.length} utilisateurs trouvés`
        );

        // Créer un nouvel utilisateur
        const timestamp = Date.now();
        const createResponse = await this.api.post('/api/tenants/users', {
          email: `user${timestamp}@test.com`,
          password: 'TestPassword123!',
          role: 'ADMIN',
          displayName: 'Test Admin'
        }, {
          headers: { Authorization: `Bearer ${this.authToken}` }
        });

        if (createResponse.status === 201) {
          this.addResult(
            'Création utilisateur',
            'PASS',
            `Utilisateur créé: ${createResponse.data.user.email}`
          );
          return true;
        } else {
          this.addResult(
            'Création utilisateur',
            'FAIL',
            `Code: ${createResponse.status}`
          );
          return false;
        }
      } else {
        this.addResult(
          'Liste utilisateurs',
          'FAIL',
          `Code: ${listResponse.status}`
        );
        return false;
      }
    } catch (error: any) {
      this.addResult('Gestion utilisateurs', 'FAIL', error.message);
      return false;
    }
  }

  // Test 11: Mise à jour du tenant
  async testUpdateTenant() {
    try {
      this.log('🧪', 'Test 11: Mise à jour du tenant');

      const response = await this.api.put('/api/tenants/current', {
        name: `${this.tenantData.tenant.name} - Updated`,
        customDomain: 'custom.example.com'
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200) {
        this.addResult(
          'Mise à jour tenant',
          'PASS',
          'Tenant mis à jour avec succès'
        );
        return true;
      } else {
        this.addResult(
          'Mise à jour tenant',
          'FAIL',
          `Code: ${response.status}`
        );
        return false;
      }
    } catch (error: any) {
      this.addResult('Mise à jour tenant', 'FAIL', error.message);
      return false;
    }
  }

  // Test 12: Vérification des limites du plan DEMO
  async testDemoLimits() {
    try {
      this.log('🧪', 'Test 12: Vérification des limites du plan DEMO');

      const response = await this.api.get('/api/payments/status', {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });

      if (response.status === 200) {
        const limits = response.data.limits;
        const subscription = response.data.subscription;

        // Vérifier que c'est bien le plan DEMO
        if (subscription.plan === 'DEMO') {
          // Le plan DEMO devrait avoir des événements illimités
          const isValid = limits.maxEvents >= 999;

          this.addResult(
            'Limites DEMO',
            isValid ? 'PASS' : 'FAIL',
            `Événements: ${limits.maxEvents}, Joueurs: ${limits.maxPlayersPerEvent}`,
            limits
          );
          return isValid;
        } else {
          this.addResult(
            'Limites DEMO',
            'FAIL',
            `Plan actuel: ${subscription.plan}, attendu: DEMO`
          );
          return false;
        }
      } else {
        this.addResult(
          'Limites DEMO',
          'FAIL',
          `Code: ${response.status}`
        );
        return false;
      }
    } catch (error: any) {
      this.addResult('Limites DEMO', 'FAIL', error.message);
      return false;
    }
  }

  // Exécuter tous les tests
  async runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SCÉNARIO DE TEST COMPLET - SYSTÈME D\'ABONNEMENT');
    console.log('='.repeat(60) + '\n');

    // Vérifier que l'API est accessible
    try {
      await this.api.get('/api/health');
      this.log('✅', 'API accessible\n');
    } catch (error) {
      this.log('❌', 'API non accessible - Vérifiez que le serveur tourne sur port 3001\n');
      return;
    }

    // Exécuter les tests dans l'ordre
    const tests = [
      () => this.testTenantRegistration(),
      () => this.testSlugAvailability(),
      () => this.testTenantLogin(),
      () => this.testGetCurrentTenant(),
      () => this.testGetPricing(),
      () => this.testPaymentStatus(),
      () => this.testCreateCheckoutSession(),
      () => this.testPaymentHistory(),
      () => this.testActiveSessions(),
      () => this.testUserManagement(),
      () => this.testUpdateTenant(),
      () => this.testDemoLimits()
    ];

    for (const test of tests) {
      await test();
    }

    // Afficher le résumé
    this.displaySummary();
  }

  // Afficher le résumé des tests
  private displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS');
    console.log('='.repeat(60) + '\n');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;

    console.log(`✅ PASS: ${passed}/${total}`);
    console.log(`❌ FAIL: ${failed}/${total}`);
    console.log(`⏭️  SKIP: ${skipped}/${total}`);

    if (failed > 0) {
      console.log('\n❌ TESTS ÉCHOUÉS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`   - ${r.test}: ${r.message}`);
        });
    }

    console.log('\n' + '='.repeat(60));

    // Sauvegarder les résultats détaillés dans un fichier
    const fs = require('fs');
    const reportPath = 'test-subscription-results.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total, passed, failed, skipped },
      results: this.results,
      tenantData: this.tenantData
    }, null, 2));

    console.log(`\n📝 Rapport détaillé sauvegardé dans: ${reportPath}`);

    if (this.tenantData) {
      console.log(`\n🔑 Informations de connexion:`);
      console.log(`   Email: ${this.tenantData.user.email}`);
      console.log(`   Slug: ${this.tenantData.tenant.slug}`);
      console.log(`   Tenant ID: ${this.tenantData.tenant.id}`);
    }

    console.log('\n');
  }
}

// Exécuter les tests
const tester = new SubscriptionTester();
tester.runAllTests().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
