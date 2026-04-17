import jwt from 'jsonwebtoken';
import { env } from './env';

export interface IJwtPayload {
  userId: string;
  role: 'merchant' | 'client' | 'admin';
  shopId?: string;
}

export function signToken(payload: IJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: IJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET + '_refresh', {
    expiresIn: '30d',
  } as jwt.SignOptions);
}

export function verifyToken(token: string): IJwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as IJwtPayload;
}

export function verifyRefreshToken(token: string): IJwtPayload {
  return jwt.verify(token, env.JWT_SECRET + '_refresh') as IJwtPayload;
}