// Test de débogage du service de matching
import { matchingService } from './src/services/matching.service';

console.log('=== TEST MATCHING SERVICE ===\n');

// Test normalisation
const normalized = matchingService.normalize("Billie Jean - Michael Jackson");
console.log('Test normalisation:');
console.log('  Input: "Billie Jean - Michael Jackson"');
console.log('  Output:', normalized);
console.log('  Type:', typeof normalized);
console.log('  Truthy:', !!normalized);

// Test similarité
const similarity = matchingService.similarity("Billie Jean", "billie jean");
console.log('\nTest similarité:');
console.log('  Input: "Billie Jean" vs "billie jean"');
console.log('  Output:', similarity);
console.log('  Type:', typeof similarity);
console.log('  Is 100?:', similarity === 100);

// Test condition du validateur
const testCondition = normalized && similarity === 100;
console.log('\nCondition du test (normalized && similarity === 100):');
console.log('  Result:', testCondition);
console.log('  normalized:', normalized);
console.log('  similarity === 100:', similarity === 100);

console.log('\n=== AUTRES TESTS ===\n');

// Tests supplémentaires
const test1 = matchingService.similarity("test", "test");
const test2 = matchingService.similarity("Test", "test");
const test3 = matchingService.similarity("hello", "hallo");

console.log('similarity("test", "test"):', test1);
console.log('similarity("Test", "test"):', test2);
console.log('similarity("hello", "hallo"):', test3);
