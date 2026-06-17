import type { Request, Response } from 'express';
import { CATEGORIES } from '../../constants/moderation';
import type { CategoryUpdate } from './policy.schemas';
import {
  getPolicyByVersion,
  listPolicyVersions,
  requireActivePolicy,
  updatePolicy,
} from './policy.service';

/** Static category catalog (keys + presentation metadata). */
export function catalog(_req: Request, res: Response): void {
  res.json({ categories: CATEGORIES });
}

export async function getActive(_req: Request, res: Response): Promise<void> {
  const policy = await requireActivePolicy();
  res.json({ policy: policy.toJSON() });
}

export async function listVersions(_req: Request, res: Response): Promise<void> {
  const policies = await listPolicyVersions();
  res.json({ policies: policies.map((p) => p.toJSON()) });
}

export async function getByVersion(req: Request, res: Response): Promise<void> {
  const policy = await getPolicyByVersion(Number(req.params.version));
  res.json({ policy: policy.toJSON() });
}

export async function update(req: Request, res: Response): Promise<void> {
  const { updates } = req.body as { updates: CategoryUpdate[] };
  const policy = await updatePolicy(req.user!.sub, updates);
  res.status(201).json({ policy: policy.toJSON() });
}
