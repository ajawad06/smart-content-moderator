import type { Request, Response } from 'express';
import { getAnalytics } from './analytics.service';

export async function overview(_req: Request, res: Response): Promise<void> {
  const analytics = await getAnalytics();
  res.json(analytics);
}
