import { AppDataSource } from './src/db/data-source';
import { TenantUser } from './src/db/entities/TenantUser';
import { Tenant } from './src/db/entities/Tenant';

async function listUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✓ Connexion database OK\n');

    // Lister les tenants
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenants = await tenantRepo.find();
    console.log('=== TENANTS ===');
    tenants.forEach(t => {
      console.log(`ID: ${t.id}`);
      console.log(`Slug: ${t.slug}`);
      console.log(`Name: ${t.name}`);
      console.log(`Plan: ${t.subscription_plan}`);
      console.log('---');
    });

    // Lister les utilisateurs
    const userRepo = AppDataSource.getRepository(TenantUser);
    const users = await userRepo.find({
      relations: ['tenant']
    });

    console.log('\n=== UTILISATEURS ===');
    if (users.length === 0) {
      console.log('Aucun utilisateur trouvé');
    } else {
      users.forEach(u => {
        console.log(`Email: ${u.email}`);
        console.log(`Tenant: ${u.tenant?.slug || u.tenant_id}`);
        console.log(`Role: ${u.role}`);
        console.log(`Active: ${u.is_active}`);
        console.log('---');
      });
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

listUsers();
