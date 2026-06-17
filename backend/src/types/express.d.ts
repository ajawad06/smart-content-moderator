import type { JwtPayload } from '../utils/jwt';

// Attach the authenticated user's token payload to the request.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};
