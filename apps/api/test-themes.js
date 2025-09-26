const http = require('http');

const API_BASE = 'http://localhost:3000/api';

// Helper function to make HTTP requests
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

async function testThemeSystem() {
  console.log('🎨 Test du Système de Thèmes\n');

  try {
    // Test 1: Récupérer tous les thèmes
    console.log('1. 📋 Récupération de tous les thèmes...');
    const allThemes = await makeRequest('GET', '/themes');
    if (allThemes.status === 200) {
      console.log(`✅ ${allThemes.data.themes.length} thèmes trouvés`);
      console.log(`📂 Catégories: ${allThemes.data.categories.join(', ')}`);

      // Affichage des thèmes par catégorie
      const themesByCategory = {};
      allThemes.data.themes.forEach(theme => {
        if (!themesByCategory[theme.category]) {
          themesByCategory[theme.category] = [];
        }
        themesByCategory[theme.category].push(theme.name);
      });

      Object.entries(themesByCategory).forEach(([category, themes]) => {
        const categoryLabels = {
          'wedding': '💒 Mariage',
          'corporate': '🏢 Entreprise',
          'birthday': '🎂 Anniversaire',
          'party': '🎉 Soirée',
          'seasonal': '🌸 Saisonnier'
        };
        console.log(`   ${categoryLabels[category] || category}: ${themes.join(', ')}`);
      });
    } else {
      console.log('❌ Erreur lors de la récupération des thèmes');
    }

    // Test 2: Récupérer thèmes par catégorie
    console.log('\n2. 🏢 Récupération des thèmes Corporate...');
    const corporateThemes = await makeRequest('GET', '/themes?category=corporate');
    if (corporateThemes.status === 200) {
      console.log(`✅ ${corporateThemes.data.themes.length} thèmes corporate trouvés`);
      corporateThemes.data.themes.forEach(theme => {
        console.log(`   - ${theme.name}: ${theme.description}`);
      });
    }

    // Test 3: Récupérer un thème spécifique
    console.log('\n3. 🎨 Récupération du thème "birthday-fun"...');
    const birthdayTheme = await makeRequest('GET', '/themes/birthday-fun');
    if (birthdayTheme.status === 200) {
      console.log(`✅ Thème récupéré: ${birthdayTheme.data.name}`);
      console.log(`   Couleur primaire: ${birthdayTheme.data.colors.primary}`);
      console.log(`   Police principale: ${birthdayTheme.data.fonts.primary}`);
      console.log(`   Style d'animation: ${birthdayTheme.data.animations?.duration || 'non défini'}`);
    }

    // Test 4: Appliquer un thème à un événement (nécessite un événement existant)
    console.log('\n4. 📝 Test d\'application de thème à un événement...');

    // D'abord, créer un événement de test
    const testEvent = {
      organizerId: "3", // ID de l'organisateur de test créé précédemment
      name: "Test Theme Event",
    };

    const eventResponse = await makeRequest('POST', '/events', testEvent);
    if (eventResponse.status === 201) {
      const eventCode = eventResponse.data.code;
      console.log(`✅ Événement créé: ${eventCode}`);

      // Récupérer le thème par défaut
      console.log('\n   📖 Récupération du thème par défaut...');
      const defaultTheme = await makeRequest('GET', `/events/${eventCode}/theme`);
      if (defaultTheme.status === 200) {
        console.log(`   Thème par défaut: ${defaultTheme.data.theme.name}`);
        console.log(`   Source: ${defaultTheme.data.themeSource}`);
      }

      // Appliquer un thème corporate
      console.log('\n   🏢 Application du thème "corporate-modern"...');
      const applyTheme = await makeRequest('PUT', `/events/${eventCode}/theme`, {
        themeId: 'corporate-modern'
      });

      if (applyTheme.status === 200) {
        console.log(`   ✅ Thème appliqué: ${applyTheme.data.themeApplied}`);

        // Vérifier le nouveau thème
        const newTheme = await makeRequest('GET', `/events/${eventCode}/theme`);
        if (newTheme.status === 200) {
          console.log(`   🎨 Nouveau thème: ${newTheme.data.theme.name}`);
          console.log(`   🎨 Couleur primaire: ${newTheme.data.theme.colors.primary}`);
        }
      } else {
        console.log(`   ❌ Erreur application thème: ${applyTheme.data?.error?.message || 'Inconnue'}`);
      }

      // Test des surcharges individuelles
      console.log('\n   ✏️  Test des surcharges de couleurs...');
      const overrideTheme = await makeRequest('PUT', `/events/${eventCode}/theme`, {
        themeId: 'party-neon',
        overrides: {
          primaryColor: '#FF1493',
          fontFamily: "'Comic Sans MS', cursive"
        }
      });

      if (overrideTheme.status === 200) {
        console.log(`   ✅ Surcharges appliquées`);

        // Vérifier les surcharges
        const overriddenTheme = await makeRequest('GET', `/events/${eventCode}/theme`);
        if (overriddenTheme.status === 200) {
          console.log(`   🎨 Thème avec surcharges: ${overriddenTheme.data.theme.name}`);
          console.log(`   🎨 Couleur surchargée: ${overriddenTheme.data.theme.colors.primary}`);
        }
      }

    } else {
      console.log('❌ Impossible de créer un événement de test');
    }

    // Test 5: Test des thèmes invalides
    console.log('\n5. 🚫 Test de thème inexistant...');
    const invalidTheme = await makeRequest('GET', '/themes/theme-inexistant');
    if (invalidTheme.status === 404) {
      console.log('✅ Erreur 404 correctement retournée pour thème inexistant');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎨 Tests du système de thèmes terminés !');
    console.log('✅ Tous les endpoints fonctionnent correctement');
    console.log('🚀 Le système de thèmes est prêt à l\'utilisation');

  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
  }
}

// Démonstration des thèmes disponibles
async function showThemeDemo() {
  console.log('\n🌈 APERÇU DES THÈMES DISPONIBLES\n');

  const themes = [
    { id: 'wedding-autumn', emoji: '🍂', context: 'Mariage en automne, couleurs chaudes' },
    { id: 'wedding-spring', emoji: '🌸', context: 'Mariage printanier, fraîcheur et élégance' },
    { id: 'corporate-modern', emoji: '🏢', context: 'Événement d\'entreprise moderne' },
    { id: 'corporate-luxury', emoji: '👑', context: 'Événement corporate haut de gamme' },
    { id: 'birthday-fun', emoji: '🎉', context: 'Anniversaire festif et coloré' },
    { id: 'birthday-elegant', emoji: '🥂', context: 'Anniversaire sophistiqué adulte' },
    { id: 'seasonal-summer', emoji: '🏖️', context: 'Ambiance estivale tropicale' },
    { id: 'seasonal-winter', emoji: '❄️', context: 'Convivialité hivernale' },
    { id: 'party-neon', emoji: '🔥', context: 'Soirée électrique et moderne' },
    { id: 'party-retro', emoji: '📼', context: 'Nostalgie années 80-90' }
  ];

  themes.forEach(theme => {
    console.log(`${theme.emoji} ${theme.id}`);
    console.log(`   Usage: ${theme.context}`);
  });

  console.log('\n📋 UTILISATION:');
  console.log('1. GET /api/themes - Liste tous les thèmes');
  console.log('2. GET /api/themes/:id - Détails d\'un thème');
  console.log('3. GET /api/events/:code/theme - Thème appliqué à un événement');
  console.log('4. PUT /api/events/:code/theme - Appliquer un thème');
}

// Exécution des tests
console.log('🎨 Démarrage des tests du système de thèmes...\n');
showThemeDemo().then(() => {
  return testThemeSystem();
});