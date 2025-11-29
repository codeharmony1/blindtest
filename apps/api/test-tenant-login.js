// Test du login multi-tenant
const http = require('http');

const loginData = JSON.stringify({
  email: 'admin@test.com',
  password: 'password123',
  tenantSlug: 'test-company'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/tenants/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('🔐 Test de connexion multi-tenant...');
console.log('📧 Email: admin@test.com');
console.log('🏢 Tenant: test-company');
console.log('');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log('');

    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log('✅ Connexion réussie !');
        console.log('');
        console.log('👤 Utilisateur:');
        console.log(`   - ID: ${response.user.id}`);
        console.log(`   - Email: ${response.user.email}`);
        console.log(`   - Role: ${response.user.role}`);
        console.log(`   - Nom: ${response.user.displayName}`);
        console.log('');
        console.log('🏢 Organisation:');
        console.log(`   - ID: ${response.tenant.id}`);
        console.log(`   - Nom: ${response.tenant.name}`);
        console.log(`   - Slug: ${response.tenant.slug}`);
        console.log(`   - Plan: ${response.tenant.plan}`);
        console.log('');
        console.log('🔑 Token JWT:');
        console.log(`   ${response.token.substring(0, 50)}...`);
      } else {
        console.log('❌ Échec de connexion');
        console.log('');
        console.log('Réponse:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (e) {
      console.log('❌ Erreur de parsing:', e.message);
      console.log('Réponse brute:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Erreur de connexion:', error.message);
  console.log('');
  console.log('⚠️  Assurez-vous que l\'API tourne sur http://localhost:3000');
});

req.write(loginData);
req.end();
