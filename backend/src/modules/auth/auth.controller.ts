import type { Request, Response } from 'express';
import { ApiError } from '../../middleware/error';
import { User } from '../../models/User';
import { loginUser, registerUser } from './auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await registerUser(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginUser(req.body);
  res.json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  // req.user is guaranteed by requireAuth.
  const user = await User.findById(req.user!.sub);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user: user.toJSON() });
}
