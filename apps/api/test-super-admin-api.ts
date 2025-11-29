import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

interface SuperAdminLoginResponse {
  token: string;
  admin: {
    id: string;
    email: string;
    name: string;
  };
}

async function testSuperAdminAPI() {
  try {
    console.log('🧪 Test de l\'API Super-Admin\n');

    // 1. Test de connexion super-admin
    console.log('1️⃣  Test de connexion super-admin...');
    const loginResponse = await axios.post<SuperAdminLoginResponse>(
      `${API_URL}/backstage/auth/login`,
      {
        email: 'admin@blindtest.local',
        password: 'admin123456'
      }
    );

    const token = loginResponse.data.token;
    console.log(`✅ Connexion réussie: ${loginResponse.data.admin.email}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // 2. Test des statistiques globales
    console.log('\n2️⃣  Test des statistiques globales...');
    const statsResponse = await axios.get(`${API_URL}/backstage/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Statistiques récupérées:`);
    console.log(`   - Tenants: ${statsResponse.data.tenantsCount}`);
    console.log(`   - Tenants actifs: ${statsResponse.data.activeTenantsCount}`);
    console.log(`   - Événements: ${statsResponse.data.totalEventsCount}`);
    console.log(`   - Événements live: ${statsResponse.data.liveEventsCount}`);

    // 3. Test de la liste des tenants
    console.log('\n3️⃣  Test de la liste des tenants...');
    const tenantsResponse = await axios.get(`${API_URL}/backstage/tenants`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ ${tenantsResponse.data.length} tenant(s) trouvé(s)`);
    tenantsResponse.data.forEach((tenant: any) => {
      console.log(`   - ${tenant.name} (${tenant.subscription_plan}) - ${tenant.billing_email}`);
    });

    // 4. Test des événements en direct
    console.log('\n4️⃣  Test des événements en direct...');
    const liveEventsResponse = await axios.get(`${API_URL}/backstage/events/live`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ ${liveEventsResponse.data.length} événement(s) en cours`);
    liveEventsResponse.data.slice(0, 5).forEach((event: any) => {
      console.log(`   - ${event.name} (${event.code}) - ${event.playersCount || 0} joueurs`);
    });

    // 5. Test des logs d'audit
    console.log('\n5️⃣  Test des logs d\'audit...');
    const logsResponse = await axios.get(`${API_URL}/backstage/audit-logs?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ ${logsResponse.data.length} log(s) d'audit récupéré(s)`);
    logsResponse.data.forEach((log: any) => {
      console.log(`   - [${log.action}] ${log.admin?.email || 'N/A'} - ${new Date(log.timestamp).toLocaleString()}`);
    });

    // 6. Test de création d'un tenant (si besoin)
    if (tenantsResponse.data.length === 0) {
      console.log('\n6️⃣  Création d\'un tenant de test...');
      // NOTE: Ceci utiliserait l'API publique de création de tenant
      const newTenantResponse = await axios.post(`${API_URL}/tenants/register`, {
        name: 'Organisation Test',
        slug: 'org-test',
        ownerEmail: 'test@example.com',
        ownerPassword: 'Test123!',
        ownerName: 'Test Owner',
        plan: 'TRIAL'
      });
      console.log(`✅ Tenant créé: ${newTenantResponse.data.tenant.name}`);
    }

    console.log('\n✅ Tous les tests sont passés avec succès !');

  } catch (error: any) {
    if (error.response) {
      console.error(`\n❌ Erreur API: ${error.response.status}`);
      console.error(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`\n❌ Erreur: ${error.message}`);
    }
    process.exit(1);
  }
}

testSuperAdminAPI();
