import { env } from '../config/env';
import { User, hashPassword } from '../models/User';
import { logger } from '../utils/logger';

const DEFAULT_ADMIN_PASSWORD = 'admin12345';

/**
 * Ensures an admin account exists. Runs on startup so the platform is usable
 * out of the box. Existing accounts are never modified (the seed is create-only,
 * so changing ADMIN_PASSWORD later does NOT update an already-created admin).
 */
export async function seedAdmin(): Promise<void> {
  // Loud guard so a deploy can't silently ship the default admin password.
  if (env.NODE_ENV === 'production' && env.ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD) {
    logger.warn(
      'SECURITY: ADMIN_PASSWORD is still the default — set a strong ADMIN_PASSWORD env var before exposing this deployment.',
    );
  }

  const existing = await User.findOne({ email: env.ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== 'admin') {
      logger.warn(`Seed: ${env.ADMIN_EMAIL} exists but is not an admin; leaving as-is`);
    }
    return;
  }
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  await User.create({ email: env.ADMIN_EMAIL, passwordHash, role: 'admin' });
  logger.info(`Seed: created admin account ${env.ADMIN_EMAIL}`);
}
