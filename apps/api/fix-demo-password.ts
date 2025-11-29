import { AppDataSource } from './src/db/data-source';
import { Organizer } from './src/db/entities/Organizer';
import bcrypt from 'bcryptjs';

async function fixDemoPassword() {
  await AppDataSource.initialize();

  const orgRepo = AppDataSource.getRepository(Organizer);

  // Trouver l'organisateur demo
  const demo = await orgRepo.findOne({ where: { email: 'demo@blindtest.local' } });

  if (!demo) {
    console.log('❌ Demo organizer not found');
    await AppDataSource.destroy();
    return;
  }

  console.log('Found demo organizer:', demo.email);
  console.log('Current password_hash:', demo.password_hash);

  // Hasher le password "demo123"
  const hashedPassword = await bcrypt.hash('demo123', 10);
  console.log('New hashed password:', hashedPassword);

  // Mettre à jour
  demo.password_hash = hashedPassword;
  await orgRepo.save(demo);

  console.log('✅ Demo password fixed! You can now login with:');
  console.log('   Email: demo@blindtest.local');
  console.log('   Password: demo123');

  await AppDataSource.destroy();
}

fixDemoPassword().catch(console.error);
