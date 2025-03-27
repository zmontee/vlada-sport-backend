import type {
  ErrorRequestHandler,
  Request,
  Response,
  NextFunction,
} from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { type HttpError, isHttpError } from 'http-errors';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  res.set('Content-Type', 'application/json');

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach(error => {
      const path = error.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(error.message);
    });

    res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors,
    });
    return;
  }

  // Обробка помилок Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])[0];

      console.log('why response in html?');

      res.status(409).json({
        status: 'error',
        message: `${field} is already taken`,
      });

      return;
    }

    res.status(500).json({
      status: 'error',
      message: 'Database error',
    });
    return;
  }

  // HTTP errors
  if (isHttpError(err)) {
    res.status(err.status).json({
      status: 'error',
      message: err.message,
      errors: (err as HttpError & { errors?: Record<string, string[]> }).errors,
    });
    return;
  }

  // Other internal server errors
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};
