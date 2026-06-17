import { createApp } from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './db/connect';
import { seedAdmin } from './db/seed';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  await connectDB();
  await seedAdmin();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Fatal startup error', err);
  process.exit(1);
});
