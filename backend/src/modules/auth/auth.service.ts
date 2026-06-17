import { ApiError } from '../../middleware/error';
import { User, type UserDocument, hashPassword } from '../../models/User';
import { signToken } from '../../utils/jwt';
import type { LoginInput, RegisterInput } from './auth.schemas';

interface AuthResult {
  token: string;
  user: ReturnType<UserDocument['toJSON']>;
}

function issue(user: UserDocument): AuthResult {
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  return { token, user: user.toJSON() };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }
  const passwordHash = await hashPassword(input.password);
  const user = await User.create({ email: input.email, passwordHash, role: 'user' });
  return issue(user);
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: input.email });
  if (!user || !(await user.comparePassword(input.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  return issue(user);
}
