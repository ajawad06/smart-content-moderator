import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error';
import analyticsRoutes from './modules/analytics/analytics.routes';
import appealRoutes from './modules/appeals/appeal.routes';
import authRoutes from './modules/auth/auth.routes';
import policyRoutes from './modules/policies/policy.routes';
import submissionRoutes from './modules/submissions/submission.routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  // Health check — reports process and DB connection state.
  app.get('/api/health', (_req, res) => {
    const dbStates: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized',
    };
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      db: dbStates[mongoose.connection.readyState] ?? 'unknown',
      provider: env.MODERATION_PROVIDER,
      timestamp: new Date().toISOString(),
    });
  });

  // Feature routers.
  app.use('/api/auth', authRoutes);
  app.use('/api/policies', policyRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/appeals', appealRoutes);
  app.use('/api/analytics', analyticsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
