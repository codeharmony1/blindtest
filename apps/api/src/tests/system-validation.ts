// System validation script to test all major functionalities
import { AppDataSource } from "../db/data-source";
import { logger } from "../services/logger.service";

interface ValidationResult {
  component: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
}

class SystemValidator {
  private results: ValidationResult[] = [];

  async runAllValidations(): Promise<ValidationResult[]> {
    logger.info("Starting system validation...");

    await this.validateDatabase();
    await this.validateEntities();
    await this.validateServices();
    await this.validateSecurity();

    logger.info(`System validation completed with ${this.results.length} checks`);
    return this.results;
  }

  private async validateDatabase(): Promise<void> {
    try {
      await AppDataSource.initialize();
      this.addResult('Database', 'OK', 'Database connection successful');

      // Test basic operations
      const organizer = await AppDataSource.getRepository(require('../db/entities/Organizer').Organizer).findOne({ where: { email: 'demo@blindtest.local' } });
      if (organizer) {
        this.addResult('Database', 'OK', 'Demo data exists and is accessible');
      } else {
        this.addResult('Database', 'WARNING', 'No demo data found');
      }

    } catch (error) {
      this.addResult('Database', 'ERROR', 'Database connection failed', error);
    }
  }

  private async validateEntities(): Promise<void> {
    const entities = [
      'Organizer',
      'Event',
      'EventStaff',
      'Team',
      'Player',
      'Round',
      'RoundSong',
      'Answer',
      'Score'
    ];

    for (const entityName of entities) {
      try {
        const entity = require(`../db/entities/${entityName}`)[entityName];
        const repository = AppDataSource.getRepository(entity);

        // Test count operation
        const count = await repository.count();
        this.addResult('Entities', 'OK', `${entityName}: ${count} records`);

      } catch (error) {
        this.addResult('Entities', 'ERROR', `${entityName} entity failed`, error);
      }
    }
  }

  private async validateServices(): Promise<void> {
    // Test matching service
    try {
      const { matchingService } = await import('../services/matching.service');

      // Test normalisation
      const normalized = matchingService.normalize("Billie Jean - Michael Jackson");

      // Test similarité
      const similarity = matchingService.similarity("Billie Jean", "billie jean");

      if (normalized && similarity === 100) {
        this.addResult('Services', 'OK', 'Matching service working correctly (normalization & similarity)');
      } else {
        this.addResult('Services', 'ERROR', 'Matching service not working as expected');
      }
    } catch (error) {
      this.addResult('Services', 'ERROR', 'Matching service failed to load', error);
    }

    // Test scoring service
    try {
      const { computePoints } = await import('../services/scoring.service');
      const points2 = computePoints(true, true);
      const points1 = computePoints(true, false);
      const points0 = computePoints(false, false);

      if (points2 === 2 && points1 === 1 && points0 === 0) {
        this.addResult('Services', 'OK', 'Scoring service working correctly');
      } else {
        this.addResult('Services', 'ERROR', 'Scoring service logic incorrect');
      }
    } catch (error) {
      this.addResult('Services', 'ERROR', 'Scoring service failed to load', error);
    }

    // Test token service
    try {
      const { issuePlayerToken, issueStaffToken } = await import('../services/tokens.service');
      const playerToken = issuePlayerToken("TEST", "123", "456");
      const staffToken = issueStaffToken("DJ", "789", "TEST");

      if (playerToken && staffToken) {
        this.addResult('Services', 'OK', 'Token service working correctly');
      } else {
        this.addResult('Services', 'ERROR', 'Token service not generating tokens');
      }
    } catch (error) {
      this.addResult('Services', 'ERROR', 'Token service failed to load', error);
    }
  }

  private async validateSecurity(): Promise<void> {
    // Test rate limiting
    try {
      const { createRateLimit } = await import('../middlewares/rate-limit');
      this.addResult('Security', 'OK', 'Rate limiting middleware loaded');
    } catch (error) {
      this.addResult('Security', 'ERROR', 'Rate limiting failed to load', error);
    }

    // Test authentication middleware
    try {
      const { requirePlayer, requireStaff } = await import('../middlewares/auth');
      this.addResult('Security', 'OK', 'Authentication middleware loaded');
    } catch (error) {
      this.addResult('Security', 'ERROR', 'Authentication middleware failed to load', error);
    }

    // Test validation middleware
    try {
      const { sanitizeInput, validateEventCode } = await import('../middlewares/validation');
      this.addResult('Security', 'OK', 'Validation middleware loaded');
    } catch (error) {
      this.addResult('Security', 'ERROR', 'Validation middleware failed to load', error);
    }

    // Test temporal security
    try {
      const { requireSongOpen, calculateTimeRemaining } = await import('../middlewares/temporal-security');
      this.addResult('Security', 'OK', 'Temporal security middleware loaded');
    } catch (error) {
      this.addResult('Security', 'ERROR', 'Temporal security failed to load', error);
    }
  }

  private addResult(component: string, status: 'OK' | 'ERROR' | 'WARNING', message: string, details?: any): void {
    this.results.push({ component, status, message, details });

    const logMessage = `[${component}] ${message}`;
    if (status === 'ERROR') {
      logger.error(logMessage, details);
    } else if (status === 'WARNING') {
      logger.warn(logMessage, details);
    } else {
      logger.info(logMessage);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new SystemValidator();

  validator.runAllValidations()
    .then(results => {
      console.log('\n=== SYSTEM VALIDATION REPORT ===');

      const okCount = results.filter(r => r.status === 'OK').length;
      const warningCount = results.filter(r => r.status === 'WARNING').length;
      const errorCount = results.filter(r => r.status === 'ERROR').length;

      console.log(`\nSummary: ${okCount} OK, ${warningCount} Warnings, ${errorCount} Errors\n`);

      results.forEach(result => {
        const icon = result.status === 'OK' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
        console.log(`${icon} [${result.component}] ${result.message}`);
      });

      if (errorCount > 0) {
        console.log('\n❌ System validation FAILED - Please check the errors above');
        process.exit(1);
      } else {
        console.log('\n✅ System validation PASSED');
        process.exit(0);
      }
    })
    .catch(error => {
      logger.error('System validation crashed', error);
      console.log('❌ System validation CRASHED:', error.message);
      process.exit(1);
    })
    .finally(async () => {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
    });
}

export { SystemValidator };