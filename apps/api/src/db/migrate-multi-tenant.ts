import { AppDataSource } from './data-source';
import * as fs from 'fs';
import * as path from 'path';

async function runMultiTenantMigration() {
  try {
    console.log('🚀 Démarrage de la migration multi-tenant...');

    // Initialiser la connexion à la base de données
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Connexion à la base de données établie');
    }

    // Lire le fichier de migration SQL
    const migrationPath = path.join(__dirname, 'migrations', '001-create-multi-tenant-structure-fixed.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Lecture du fichier de migration SQL...');

    // Séparer les commandes SQL (par point-virgule)
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 ${commands.length} commandes SQL à exécuter`);

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`⚙️  Exécution commande ${i + 1}/${commands.length}`);
          await AppDataSource.query(command);
        } catch (error: any) {
          // Ignorer les erreurs de tables/colonnes qui existent déjà
          if (error.code === 'ER_TABLE_EXISTS_ERROR' ||
              error.code === 'ER_DUP_FIELDNAME' ||
              error.code === 'ER_DUP_KEYNAME' ||
              error.message.includes('already exists')) {
            console.log(`⚠️  Ignoré (déjà existant): ${error.message.split(':')[0]}`);
            continue;
          }
          throw error;
        }
      }
    }

    console.log('✅ Migration multi-tenant terminée avec succès !');
    console.log('\n🎉 Votre application est maintenant multi-tenant !');
    console.log('\n📋 Prochaines étapes :');
    console.log('1. Configurer vos clés Stripe dans .env');
    console.log('2. Démarrer l\'API : npm run dev');
    console.log('3. Tester l\'inscription : POST /api/tenants/register');

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la migration si ce script est appelé directement
if (require.main === module) {
  runMultiTenantMigration();
}

export { runMultiTenantMigration };