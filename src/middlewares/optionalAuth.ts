import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '@/utils/config/auth';

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(
          token,
          authConfig.jwt.accessToken.secret
        ) as any;
        req.user = { userId: decoded.userId };
      } catch (error) {
        req.user = undefined;
      }
    }

    next();
  } catch (error) {
    next();
  }
};
