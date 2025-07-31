import type { NextFunction, Request, Response } from 'express';
import userService from '@/services/userService';
import { z } from 'zod';
import createHttpError from 'http-errors';

const updateUserSchema = z.object({
  name: z.string().optional(),
  surname: z.string().optional(),
  phoneNumber: z.string().optional(),
  sex: z.string().optional(),
  birthDate: z.string().optional(),
  experience: z.string().optional(),
  weight: z.number().optional(),
  imageUrl: z.string().optional(),
});

const updateUserImageSchema = z.object({
  imageUrl: z.string(),
});

const usersController = {
  getProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      const user = await userService.getUserById(userId);

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  getUsersList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usersList = await userService.getUsers();

      res.status(200).json(usersList);
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      // Валідація вхідних даних
      const validationResult = updateUserSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw createHttpError(400, 'Invalid user data');
      }

      const updatedUser = await userService.updateUser(
        userId,
        validationResult.data
      );

      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  },

  updateProfileImage: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      // Валідація вхідних даних
      const validationResult = updateUserImageSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw createHttpError(400, 'Invalid image data');
      }

      const updatedUser = await userService.updateUserImage(
        userId,
        validationResult.data
      );

      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  },
};

export default usersController;
