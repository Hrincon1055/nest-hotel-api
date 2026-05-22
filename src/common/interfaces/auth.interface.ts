import { Employee } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user: Employee;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
