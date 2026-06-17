import { env } from '../config/env';
import { User, hashPassword } from '../models/User';
import { logger } from '../utils/logger';

/**
 * Ensures an admin account exists. Runs on startup so the platform is usable
 * out of the box. Existing accounts are never modified.
 */
export async function seedAdmin(): Promise<void> {
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
