import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ApiError } from './error';

type Source = 'body' | 'query' | 'params';

/** Validates and replaces req[source] with the parsed/typed result. */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      // query/params are read-only getters in Express 5; body is safe to reassign.
      if (source === 'body') req.body = parsed;
      else Object.assign(req[source], parsed);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ApiError(400, 'Validation failed', err.flatten().fieldErrors));
        return;
      }
      next(err);
    }
  };
}
