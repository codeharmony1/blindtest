import { AppDataSource } from './src/db/data-source';
import { RoundSong } from './src/db/entities/RoundSong';

async function testDelete() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to database\n');

    const songRepo = AppDataSource.getRepository(RoundSong);

    // Test 1: Find song with ID 27
    console.log('=== Test 1: Recherche chanson ID 27 ===');
    const song1 = await songRepo.findOne({
      where: { id: String(27) },
      relations: ["round", "round.event"],
    });
    console.log('Résultat avec String(27):', song1 ? `Trouvée: ${song1.title_official}` : 'NON TROUVÉE');

    // Test 2: Find song with ID 27 as number
    console.log('\n=== Test 2: Recherche chanson ID 27 (number) ===');
    const song2 = await songRepo.findOne({
      where: { id: 27 as any },
      relations: ["round", "round.event"],
    });
    console.log('Résultat avec number 27:', song2 ? `Trouvée: ${song2.title_official}` : 'NON TROUVÉE');

    // Test 3: Find song without relations
    console.log('\n=== Test 3: Recherche chanson ID 27 (sans relations) ===');
    const song3 = await songRepo.findOne({
      where: { id: String(27) },
    });
    console.log('Résultat sans relations:', song3 ? `Trouvée: ${song3.title_official}` : 'NON TROUVÉE');

    // Test 4: Raw query
    console.log('\n=== Test 4: Raw query ===');
    const rawResult = await AppDataSource.query('SELECT * FROM round_songs WHERE id = ?', [27]);
    console.log('Résultat raw query:', rawResult.length > 0 ? `Trouvée: ${rawResult[0].title_official}` : 'NON TROUVÉE');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDelete();
