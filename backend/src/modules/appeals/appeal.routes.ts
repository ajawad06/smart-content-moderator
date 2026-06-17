import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { create, mine, queue, resolve } from './appeal.controller';
import {
  createAppealSchema,
  listAppealsQuerySchema,
  resolveAppealSchema,
} from './appeal.schemas';

const router = Router();

router.use(requireAuth);

// User: file an appeal and track their own appeals.
router.post('/', validate(createAppealSchema), asyncHandler(create));
router.get('/mine', validate(listAppealsQuerySchema, 'query'), asyncHandler(mine));

// Admin: review queue (status=pending) and resolve.
router.get('/', requireAdmin, validate(listAppealsQuerySchema, 'query'), asyncHandler(queue));
router.patch('/:id', requireAdmin, validate(resolveAppealSchema), asyncHandler(resolve));

export default router;
