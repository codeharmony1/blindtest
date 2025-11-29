import { AppDataSource } from './src/db/data-source';
import { TenantUser } from './src/db/entities/TenantUser';
import bcrypt from 'bcryptjs';

async function verifyPassword() {
  try {
    await AppDataSource.initialize();
    console.log('✓ Connexion database OK\n');

    const userRepo = AppDataSource.getRepository(TenantUser);
    const user = await userRepo.findOne({
      where: { email: 'moi@blabla.fr' },
      relations: ['tenant']
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      await AppDataSource.destroy();
      return;
    }

    console.log('=== UTILISATEUR TROUVÉ ===');
    console.log(`Email: ${user.email}`);
    console.log(`Tenant: ${user.tenant?.slug || user.tenant_id}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.is_active}`);
    console.log('\n--- Test du mot de passe ---');

    // Tester le mot de passe
    const isValid = await bcrypt.compare('password123', user.password_hash);

    if (isValid) {
      console.log('✓ Le mot de passe "password123" est CORRECT');
    } else {
      console.log('❌ Le mot de passe "password123" est INCORRECT');
      console.log('\nVoulez-vous réinitialiser le mot de passe à "password123" ? (ce script ne le fait pas automatiquement)');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

verifyPassword();
