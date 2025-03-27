import type { Request, Response, NextFunction } from 'express';
import type { TokenPayload } from '@/types/auth';
import { authConfig } from '@/utils/config/auth';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(createHttpError(401, 'Authorization header is missing'));
  }

  const authHeaderParts = authHeader.split(' ');
  if (authHeaderParts.length !== 2 || authHeaderParts[0] !== 'Bearer') {
    return next(createHttpError(401, 'Authorization header is invalid'));
  }

  const token = authHeaderParts[1];

  try {
    const user = jwt.verify(
      token,
      authConfig.jwt.accessToken.secret
    ) as TokenPayload;

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(createHttpError(401, 'Token expired'));
    }
    return next(createHttpError(401, 'Token invalid'));
  }
};
