import type { NextFunction, Request, Response } from 'express';
import path from 'path';
import userService from '@/services/userService';
import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  deleteFile,
  getFilenameFromUrl,
  getUserImageUrl,
} from '@/utils/fileUpload';

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

      if (!req.file) {
        throw createHttpError(400, 'Зображення не завантажено');
      }

      const currentUser = await userService.getUserById(userId);

      const newImageUrl = getUserImageUrl(req.file.filename);

      if (!newImageUrl) {
        throw createHttpError(500, 'Помилка при створенні URL зображення');
      }

      const updatedUser = await userService.updateUserImage(userId, {
        imageUrl: newImageUrl,
      });

      if (currentUser && currentUser.imageUrl) {
        const oldFilename = getFilenameFromUrl(currentUser.imageUrl);
        if (oldFilename) {
          const oldFilePath = path.join(
            process.cwd(),
            'cdn',
            'users',
            oldFilename
          );
          deleteFile(oldFilePath);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Зображення профілю успішно оновлено',
        user: updatedUser,
        imageUrl: newImageUrl,
      });
    } catch (error) {
      // Якщо сталася помилка, видаляємо завантажений файл
      if (req.file) {
        const filePath = path.join(
          process.cwd(),
          'cdn',
          'users',
          req.file.filename
        );
        deleteFile(filePath);
      }
      next(error);
    }
  },
};

export default usersController;
