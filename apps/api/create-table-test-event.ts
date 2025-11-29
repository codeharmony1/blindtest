import { AppDataSource } from './src/db/data-source';
import { Event } from './src/db/entities/Event';
import { Tenant } from './src/db/entities/Tenant';

async function createTestEvent() {
  try {
    console.log('🔌 Connexion à la base de données...');
    await AppDataSource.initialize();

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const eventRepo = AppDataSource.getRepository(Event);

    // Trouver ou créer un tenant de test
    let tenant = await tenantRepo.findOne({ where: { id: 'test-tenant-001' } });
    if (!tenant) {
      console.log('📦 Création d\'un tenant de test...');
      tenant = new Tenant();
      tenant.id = 'test-tenant-001';
      tenant.name = 'Test Tenant';
      tenant.plan = 'PRO';
      await tenantRepo.save(tenant);
      console.log('   ✓ Tenant créé');
    } else {
      console.log('   ✓ Tenant existant trouvé');
    }

    // Vérifier si l'événement existe déjà
    let event = await eventRepo.findOne({ where: { code: 'TABLETEST' } });
    if (event) {
      console.log('📋 Événement TABLETEST existe déjà');
      console.log('   Mise à jour: table_mode = true');
      event.table_mode = true;
      event.status = 'ACTIVE';
      await eventRepo.save(event);
    } else {
      console.log('📋 Création de l\'événement TABLETEST...');
      event = new Event();
      event.code = 'TABLETEST';
      event.name = 'Test Mode Table';
      event.game_mode = 'TEAM';
      event.table_mode = true;
      event.status = 'ACTIVE';
      event.tenant_id = tenant.id;
      await eventRepo.save(event);
      console.log('   ✓ Événement créé');
    }

    console.log('\n✅ Événement de test créé avec succès!');
    console.log(`   Code: ${event.code}`);
    console.log(`   Nom: ${event.name}`);
    console.log(`   Table Mode: ${event.table_mode}`);
    console.log(`   Status: ${event.status}`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createTestEvent();
