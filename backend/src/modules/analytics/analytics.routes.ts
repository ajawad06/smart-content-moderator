import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { overview } from './analytics.controller';

const router = Router();

// Platform-wide analytics — admin only.
router.get('/', requireAuth, requireAdmin, asyncHandler(overview));

export default router;
