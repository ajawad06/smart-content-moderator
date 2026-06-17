import type { Request, Response } from 'express';
import {
  createAppeal,
  listAllAppeals,
  listMyAppeals,
  resolveAppeal,
} from './appeal.service';
import type { ListAppealsQuery } from './appeal.schemas';

export async function create(req: Request, res: Response): Promise<void> {
  const appeal = await createAppeal(req.user!.sub, req.body);
  res.status(201).json({ appeal: appeal.toJSON() });
}

export async function mine(req: Request, res: Response): Promise<void> {
  const result = await listMyAppeals(req.user!.sub, req.query as unknown as ListAppealsQuery);
  res.json(serializeList(result));
}

export async function queue(req: Request, res: Response): Promise<void> {
  const result = await listAllAppeals(req.query as unknown as ListAppealsQuery);
  res.json(serializeList(result));
}

export async function resolve(req: Request, res: Response): Promise<void> {
  const appeal = await resolveAppeal(req.user!.sub, req.params.id, req.body);
  res.json({ appeal: appeal.toJSON() });
}

function serializeList(result: {
  appeals: { toJSON(): unknown }[];
  page: number;
  limit: number;
  total: number;
}) {
  return {
    appeals: result.appeals.map((a) => a.toJSON()),
    pagination: { page: result.page, limit: result.limit, total: result.total },
  };
}
