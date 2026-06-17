import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { catalog, getActive, getByVersion, listVersions, update } from './policy.controller';
import { updatePolicySchema, versionParamSchema } from './policy.schemas';

const router = Router();

// Any authenticated user can read the active policy and the category catalog
// (e.g. to render the policy snapshot referenced by their verdicts).
router.get('/active', requireAuth, asyncHandler(getActive));
router.get('/catalog', requireAuth, catalog);

// Admin-only: full version history, specific versions, and applying changes.
router.get('/', requireAuth, requireAdmin, asyncHandler(listVersions));
router.get('/:version', requireAuth, validate(versionParamSchema, 'params'), asyncHandler(getByVersion));
router.patch('/', requireAuth, requireAdmin, validate(updatePolicySchema), asyncHandler(update));

export default router;
