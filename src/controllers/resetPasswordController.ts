import type { NextFunction, Request, Response } from 'express';
import passwordResetService from '@/services/resetPasswordService';
import createHttpError from 'http-errors';
import { z, ZodError } from 'zod';

const requestResetSchema = z.object({
  email: z.string().email('Невірний формат email'),
  clientUrl: z.string().url('Невірний формат URL клієнта'),
});

const verifyTokenSchema = z.object({
  token: z.string().min(1, "Токен обов'язковий"),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Токен обов'язковий"),
    password: z.string().min(6, 'Пароль має містити мінімум 6 символів'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  });

const passwordResetController = {
  requestReset: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = requestResetSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw createHttpError(400, 'Неправильні дані запиту', {
          details: validationResult.error.format(),
        });
      }

      const { email, clientUrl } = validationResult.data;

      const result = await passwordResetService.requestPasswordReset(
        email,
        clientUrl
      );

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          createHttpError(400, 'Невірні дані запиту', {
            details: error.format(),
          })
        );
      } else {
        next(error);
      }
    }
  },

  verifyToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = verifyTokenSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw createHttpError(400, "Токен обов'язковий");
      }

      const { token } = validationResult.data;

      const result = await passwordResetService.verifyResetToken(token);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        next(createHttpError(400, 'Невірні параметри запиту'));
      } else {
        next(error);
      }
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = resetPasswordSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw createHttpError(400, 'Неправильні дані для зміни паролю', {
          details: validationResult.error.format(),
        });
      }

      const { token, password } = validationResult.data;

      const result = await passwordResetService.resetPassword(token, password);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          createHttpError(400, 'Невірні дані для зміни паролю', {
            details: error.format(),
          })
        );
      } else {
        next(error);
      }
    }
  },
};

export default passwordResetController;
