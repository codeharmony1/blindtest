/**
 * Script pour créer un organisateur de test
 */

import { AppDataSource } from './src/db/data-source';
import { Organizer } from './src/db/entities/Organizer';
const bcrypt = require('bcrypt');

async function createTestOrganizer() {
  try {
    console.log('🔧 Initialisation de la connexion à la base de données...');
    await AppDataSource.initialize();
    console.log('✅ Connexion établie\n');

    const orgRepo = AppDataSource.getRepository(Organizer);

    // Vérifier si l'organisateur existe déjà
    const existing = await orgRepo.findOne({ where: { email: 'admin@test.com' } });
    if (existing) {
      console.log('ℹ️  L\'organisateur admin@test.com existe déjà');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Email: ${existing.email}`);
      await AppDataSource.destroy();
      return;
    }

    // Créer l'organisateur
    console.log('📝 Création de l\'organisateur de test...');
    const passwordHash = await bcrypt.hash('admin123456', 10);

    const organizer = orgRepo.create({
      email: 'admin@test.com',
      password_hash: passwordHash,
    });

    await orgRepo.save(organizer);

    console.log('✅ Organisateur créé avec succès !');
    console.log(`   ID: ${organizer.id}`);
    console.log(`   Email: ${organizer.email}`);
    console.log(`   Password: admin123456\n`);

    await AppDataSource.destroy();
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createTestOrganizer();
