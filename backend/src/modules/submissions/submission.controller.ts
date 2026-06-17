import type { Request, Response } from 'express';
import { ApiError } from '../../middleware/error';
import {
  createSubmission,
  getSubmissionDetail,
  getVerdictImage,
  listSubmissions,
  type UploadedImage,
} from './submission.service';
import type { ListSubmissionsQuery } from './submission.schemas';

export async function create(req: Request, res: Response): Promise<void> {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw new ApiError(400, 'Upload at least one image in the "images" field');

  const images: UploadedImage[] = files.map((f) => ({
    buffer: f.buffer,
    originalname: f.originalname,
    mimetype: f.mimetype,
    size: f.size,
  }));

  const { submission, verdicts } = await createSubmission(req.user!.sub, images);
  res.status(201).json({
    submission: submission.toJSON(),
    verdicts: verdicts.map((v) => v.toJSON()),
  });
}

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListSubmissionsQuery;
  const result = await listSubmissions(req.user!.sub, query);
  res.json({
    submissions: result.submissions.map((s) => s.toJSON()),
    pagination: { page: result.page, limit: result.limit, total: result.total },
  });
}

export async function detail(req: Request, res: Response): Promise<void> {
  const { submission, verdicts } = await getSubmissionDetail(req.params.id, req.user!);
  res.json({ submission: submission.toJSON(), verdicts: verdicts.map((v) => v.toJSON()) });
}

export async function image(req: Request, res: Response): Promise<void> {
  const { data, mimeType, filename } = await getVerdictImage(req.params.verdictId, req.user!);
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${filename.replace(/"/g, '')}"`);
  res.send(data);
}
