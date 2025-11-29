import { AppDataSource } from './src/db/data-source';
import { Event } from './src/db/entities/Event';
import { Organizer } from './src/db/entities/Organizer';
import { EventStaff } from './src/db/entities/EventStaff';

async function checkDemoEvent() {
  await AppDataSource.initialize();

  const eventRepo = AppDataSource.getRepository(Event);
  const orgRepo = AppDataSource.getRepository(Organizer);
  const staffRepo = AppDataSource.getRepository(EventStaff);

  // Trouver l'événement DEMO
  const event = await eventRepo.findOne({
    where: { code: 'DEMO' },
    relations: ['organizer']
  });

  console.log('=== EVENT DEMO ===');
  if (event) {
    console.log('Event ID:', event.id);
    console.log('Event Code:', event.code);
    console.log('Event Name:', event.name);
    console.log('Organizer ID (from event):', event.organizer?.id);
    console.log('Organizer Email:', event.organizer?.email);
  } else {
    console.log('❌ Event DEMO not found!');
  }

  // Trouver l'organisateur demo
  const org = await orgRepo.findOne({ where: { email: 'demo@blindtest.local' } });
  console.log('\n=== ORGANIZER DEMO ===');
  if (org) {
    console.log('Organizer ID:', org.id);
    console.log('Organizer Email:', org.email);
  } else {
    console.log('❌ Organizer demo not found!');
  }

  // Vérifier l'accès (staff)
  console.log('\n=== EVENT STAFF ===');
  const staff = await staffRepo.find({
    where: { event_id: event?.id },
    relations: ['organizer']
  });
  console.log(`Found ${staff.length} staff members for event DEMO`);
  for (const s of staff) {
    console.log(`- ${s.role}: ${s.organizer?.email} (organizer_id: ${s.organizer_id})`);
  }

  // Vérifier si event.organizer.id === org.id
  if (event && org) {
    console.log('\n=== OWNERSHIP CHECK ===');
    console.log(`Event organizer ID: ${event.organizer?.id} (type: ${typeof event.organizer?.id})`);
    console.log(`Demo organizer ID: ${org.id} (type: ${typeof org.id})`);
    console.log(`Match: ${event.organizer?.id === org.id}`);
    console.log(`String match: ${String(event.organizer?.id) === String(org.id)}`);
  }

  await AppDataSource.destroy();
}

checkDemoEvent().catch(console.error);
