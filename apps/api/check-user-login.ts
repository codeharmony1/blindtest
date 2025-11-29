import { AppDataSource } from './src/db/data-source';
import { Organizer } from './src/db/entities/Organizer';
import bcrypt from 'bcryptjs';

async function checkUser() {
  try {
    await AppDataSource.initialize();
    console.log('✓ Database connected');

    const orgRepo = AppDataSource.getRepository(Organizer);

    // Vérifier si l'utilisateur existe
    const organizer = await orgRepo.findOne({
      where: { email: 'moi@blabla.fr' }
    });

    if (!organizer) {
      console.log('❌ User not found with email: moi@blabla.fr');

      // Lister tous les utilisateurs
      const allOrganizers = await orgRepo.find();
      console.log(`\n📋 Found ${allOrganizers.length} organizers in database:`);
      allOrganizers.forEach(org => {
        console.log(`  - ${org.email} (id: ${org.id})`);
      });
    } else {
      console.log('✓ User found:', {
        id: organizer.id,
        email: organizer.email,
        displayName: organizer.display_name,
        createdAt: organizer.created_at
      });

      // Tester le mot de passe
      const isPasswordValid = await bcrypt.compare('password123', organizer.password_hash);
      console.log(`\n🔑 Password test: ${isPasswordValid ? '✓ Valid' : '❌ Invalid'}`);

      if (!isPasswordValid) {
        console.log('\n⚠️  The password "password123" does not match the stored hash');
      }
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
