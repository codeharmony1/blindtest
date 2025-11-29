import { AppDataSource } from './src/db/data-source';
import { SuperAdmin } from './src/db/entities/SuperAdmin';
import * as bcrypt from 'bcryptjs';

(async () => {
  try {
    await AppDataSource.initialize();
    console.log('DB connected');

    const repo = AppDataSource.getRepository(SuperAdmin);

    let admin = await repo.findOne({
      where: { email: 'admin@blindtest.local' }
    });

    if (!admin) {
      console.log('Creating new admin...');
      admin = repo.create({
        email: 'admin@blindtest.local',
        password_hash: await bcrypt.hash('admin123456', 10),
        name: 'Admin Test',
        is_active: true
      });
    } else {
      console.log('Updating existing admin...');
      admin.password_hash = await bcrypt.hash('admin123456', 10);
      admin.is_active = true;
      admin.name = 'Admin Test';
    }

    const saved = await repo.save(admin);

    console.log('✅ Admin ready:');
    console.log('   Email:', saved.email);
    console.log('   Password: admin123456');
    console.log('   Active:', saved.is_active);
    console.log('   ID:', saved.id);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
