import { AppDataSource } from './src/db/data-source';
import { Organizer } from './src/db/entities/Organizer';
import { Event } from './src/db/entities/Event';

async function checkOrganizers() {
  await AppDataSource.initialize();

  const orgRepo = AppDataSource.getRepository(Organizer);
  const eventRepo = AppDataSource.getRepository(Event);

  console.log('=== ORGANIZERS IN DATABASE ===\n');
  const orgs = await orgRepo.find();

  for (const org of orgs) {
    console.log(`ID: ${org.id}`);
    console.log(`Email: ${org.email}`);
    console.log(`Display Name: ${org.display_name}`);
    console.log(`Password Hash (first 50 chars): ${org.password_hash.substring(0, 50)}...`);
    console.log(`Created: ${org.created_at}`);
    console.log('---');
  }

  console.log('\n=== EVENTS IN DATABASE ===\n');
  const events = await eventRepo.find({ relations: ['organizer'] });

  for (const event of events) {
    console.log(`Code: ${event.code}`);
    console.log(`Name: ${event.name}`);
    console.log(`Organizer: ${event.organizer?.email || 'N/A'}`);
    console.log('---');
  }

  await AppDataSource.destroy();
}

checkOrganizers().catch(console.error);
