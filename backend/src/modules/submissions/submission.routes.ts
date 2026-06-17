import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { create, detail, image, list } from './submission.controller';
import { listSubmissionsQuerySchema } from './submission.schemas';
import { uploadImages } from './upload';

const router = Router();

router.use(requireAuth);

router.post('/', uploadImages, asyncHandler(create));
router.get('/', validate(listSubmissionsQuerySchema, 'query'), asyncHandler(list));
router.get('/:id', asyncHandler(detail));
router.get('/:id/verdicts/:verdictId/image', asyncHandler(image));

export default router;
