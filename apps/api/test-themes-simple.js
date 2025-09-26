const http = require('http');

const API_BASE = 'http://localhost:3000/api';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testBasicThemes() {
  console.log('🎨 Test Simple du Système de Thèmes\n');

  try {
    // Test 1: Récupérer tous les thèmes
    console.log('1. 📋 Test GET /api/themes...');
    const allThemes = await makeRequest('GET', '/themes');
    console.log(`   Status: ${allThemes.status}`);

    if (allThemes.status === 200) {
      console.log(`   ✅ ${allThemes.data.themes.length} thèmes trouvés`);
      console.log(`   📂 Catégories: ${allThemes.data.categories.join(', ')}`);
    } else {
      console.log(`   ❌ Erreur: ${allThemes.data?.error?.message || 'Réponse inattendue'}`);
    }

    // Test 2: Récupérer un thème spécifique
    console.log('\n2. 🎨 Test GET /api/themes/wedding-autumn...');
    const specificTheme = await makeRequest('GET', '/themes/wedding-autumn');
    console.log(`   Status: ${specificTheme.status}`);

    if (specificTheme.status === 200) {
      console.log(`   ✅ Thème: ${specificTheme.data.name}`);
      console.log(`   🎨 Couleur primaire: ${specificTheme.data.colors.primary}`);
    } else {
      console.log(`   ❌ Erreur: ${specificTheme.data?.error?.message || 'Réponse inattendue'}`);
    }

    // Test 3: Test d'un thème inexistant
    console.log('\n3. 🚫 Test GET /api/themes/inexistant...');
    const invalidTheme = await makeRequest('GET', '/themes/inexistant');
    console.log(`   Status: ${invalidTheme.status}`);

    if (invalidTheme.status === 404) {
      console.log('   ✅ Erreur 404 correctement retournée');
    } else {
      console.log(`   ❌ Statut inattendu: ${invalidTheme.status}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎨 Tests basiques terminés !');

  } catch (error) {
    console.error('❌ Erreur de test:', error.message);
  }
}

testBasicThemes();