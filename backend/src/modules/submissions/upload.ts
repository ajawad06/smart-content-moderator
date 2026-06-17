import type { NextFunction, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { ApiError } from '../../middleware/error';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per image
const MAX_FILES = 10;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new ApiError(400, `Unsupported image type: ${file.mimetype}`));
  },
});

/** Accepts up to MAX_FILES images under the "images" field; normalizes multer errors. */
export function uploadImages(req: Request, res: Response, next: NextFunction): void {
  upload.array('images', MAX_FILES)(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Each image must be 5 MB or smaller'
          : err.code === 'LIMIT_FILE_COUNT'
            ? `At most ${MAX_FILES} images per submission`
            : `Upload error: ${err.message}`;
      next(new ApiError(400, message));
      return;
    }
    next(err);
  });
}
