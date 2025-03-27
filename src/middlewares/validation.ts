import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  surname: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const validateRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await registerSchema.parseAsync(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid input data' });
  }
};

export const validateLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await loginSchema.parseAsync(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid input data' });
  }
};
