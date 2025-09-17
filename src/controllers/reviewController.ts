import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import reviewService from '@/services/reviewService';
import type {
  CreateGeneralReviewDTO,
  UpdateGeneralReviewDTO,
  CreateCourseReviewDTO,
  UpdateCourseReviewDTO,
} from '@/types/review';
import createHttpError from 'http-errors';
import {
  getFilenameFromUrl,
  getFileUrl,
  reviewUpload,
} from '@/utils/fileUpload';
import fs from 'fs';
import path from 'path';

const createGeneralReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(3),
  // userId: z.coerce.number().int().positive().optional(),
  authorName: z.string().min(2).optional(),
  authorSurname: z.string().min(2).optional(),
  authorExperience: z.string().optional(),
  authorSex: z.enum(['MALE', 'FEMALE']).optional(),
});

const updateGeneralReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().min(3).optional(),
  userId: z.coerce.number().int().positive().nullish(),
  authorName: z.string().min(2).nullish(),
  authorSurname: z.string().min(2).nullish(),
  authorExperience: z.string().nullish(),
  authorSex: z.enum(['MALE', 'FEMALE']).nullish(),
});

const createCourseReviewSchema = createGeneralReviewSchema.extend({
  courseId: z.coerce.number().int().positive(),
});

const updateCourseReviewSchema = updateGeneralReviewSchema.extend({
  courseId: z.coerce.number().int().positive().optional(),
});

const reviewController = {
  uploadReviewImages: reviewUpload.fields([
    { name: 'beforePhoto', maxCount: 1 },
    { name: 'afterPhoto', maxCount: 1 },
  ]),

  getAllGeneralReviews: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const reviews = await reviewService.getAllGeneralReviews();
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  },

  getGeneralReviewById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw createHttpError(400, 'Недійсний ID відгуку');
      }

      const review = await reviewService.getGeneralReviewById(id);

      if (!review) {
        throw createHttpError(404, 'Відгук не знайдено');
      }

      res.json(review);
    } catch (error) {
      if (error instanceof Error && error.message === 'Відгук не знайдено') {
        next(createHttpError(404, 'Відгук не знайдено'));
      } else {
        next(error);
      }
    }
  },

  createGeneralReview: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const validationResult = createGeneralReviewSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw createHttpError(400, 'Неправильні дані відгуку', {
          details: validationResult.error.format(),
        });
      }

      const data = validationResult.data;
      const authenticatedUserId = req.user?.userId;

      if (!authenticatedUserId && (!data.authorName || !data.authorSurname)) {
        throw createHttpError(
          400,
          "Для анонімного відгуку необхідно вказати ім'я та прізвище автора"
        );
      }

      // Файли доступні через req.files (завдяки multer)
      const files = req.files as
        | {
            beforePhoto?: Express.Multer.File[];
            afterPhoto?: Express.Multer.File[];
          }
        | undefined;

      const reviewData: CreateGeneralReviewDTO = {
        ...validationResult.data,
        beforePhotoUrl: files?.beforePhoto?.[0]
          ? getFileUrl(files.beforePhoto[0].filename)
          : undefined,
        afterPhotoUrl: files?.afterPhoto?.[0]
          ? getFileUrl(files.afterPhoto[0].filename)
          : undefined,
      };

      const newReview = await reviewService.createGeneralReview(
        reviewData,
        authenticatedUserId
      );

      res.status(201).json(newReview);
    } catch (error) {
      const files = req.files as
        | {
            beforePhoto?: Express.Multer.File[];
            afterPhoto?: Express.Multer.File[];
          }
        | undefined;

      if (files?.beforePhoto?.[0]) {
        fs.unlinkSync(files.beforePhoto[0].path);
      }

      if (files?.afterPhoto?.[0]) {
        fs.unlinkSync(files.afterPhoto[0].path);
      }

      next(error);
    }
  },

  updateGeneralReview: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw createHttpError(400, 'Недійсний ID відгуку');
      }

      const existingReview = await reviewService.getGeneralReviewById(id);
      if (!existingReview) {
        throw createHttpError(404, 'Відгук не знайдено');
      }

      const validationResult = updateGeneralReviewSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw createHttpError(400, 'Неправильні дані відгуку', {
          details: validationResult.error.format(),
        });
      }

      const files = req.files as
        | {
            beforePhoto?: Express.Multer.File[];
            afterPhoto?: Express.Multer.File[];
          }
        | undefined;

      const oldBeforePhotoFilename = getFilenameFromUrl(
        existingReview.beforePhotoUrl
      );
      const oldAfterPhotoFilename = getFilenameFromUrl(
        existingReview.afterPhotoUrl
      );

      const updateData: UpdateGeneralReviewDTO = {
        ...validationResult.data,
      };

      if (files?.beforePhoto?.[0]) {
        updateData.beforePhotoUrl = getFileUrl(files.beforePhoto[0].filename);
      } else if (req.body.removeBeforePhoto === 'true') {
        updateData.beforePhotoUrl = null;
      }

      if (files?.afterPhoto?.[0]) {
        updateData.afterPhotoUrl = getFileUrl(files.afterPhoto[0].filename);
      } else if (req.body.removeAfterPhoto === 'true') {
        updateData.afterPhotoUrl = null;
      }

      const updatedReview = await reviewService.updateGeneralReview(
        id,
        updateData
      );

      if (
        (files?.beforePhoto?.[0] || req.body.removeBeforePhoto === 'true') &&
        oldBeforePhotoFilename
      ) {
        const oldFilePath = path.join(
          process.cwd(),
          'cdn',
          'reviews',
          oldBeforePhotoFilename
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      if (
        (files?.afterPhoto?.[0] || req.body.removeAfterPhoto === 'true') &&
        oldAfterPhotoFilename
      ) {
        const oldFilePath = path.join(
          process.cwd(),
          'cdn',
          'reviews',
          oldAfterPhotoFilename
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      res.json(updatedReview);
    } catch (error) {
      const files = req.files as
        | {
            beforePhoto?: Express.Multer.File[];
            afterPhoto?: Express.Multer.File[];
          }
        | undefined;

      if (files?.beforePhoto?.[0]) {
        fs.unlinkSync(files.beforePhoto[0].path);
      }

      if (files?.afterPhoto?.[0]) {
        fs.unlinkSync(files.afterPhoto[0].path);
      }

      next(error);
    }
  },

  deleteGeneralReview: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw createHttpError(400, 'Недійсний ID відгуку');
      }

      const review = await reviewService.getGeneralReviewById(id);
      if (!review) {
        throw createHttpError(404, 'Відгук не знайдено');
      }

      await reviewService.deleteGeneralReview(id);

      const beforePhotoFilename = getFilenameFromUrl(review.beforePhotoUrl);
      const afterPhotoFilename = getFilenameFromUrl(review.afterPhotoUrl);

      if (beforePhotoFilename) {
        const filePath = path.join(
          process.cwd(),
          'cdn',
          'reviews',
          beforePhotoFilename
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      if (afterPhotoFilename) {
        const filePath = path.join(
          process.cwd(),
          'cdn',
          'reviews',
          afterPhotoFilename
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // Методи для відгуків до курсів
  getAllCourseReviews: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const reviews = await reviewService.getAllCourseReviews();
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  },

  getCourseReviewById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw createHttpError(400, 'Недійсний ID відгуку');
      }

      const review = await reviewService.getCourseReviewById(id);

      if (!review) {
        throw createHttpError(404, 'Відгук не знайдено');
      }

      res.json(review);
    } catch (error) {
      if (error instanceof Error && error.message === 'Відгук не знайдено') {
        next(createHttpError(404, 'Відгук не знайдено'));
      } else {
        next(error);
      }
    }
  },

  getCourseReviewsByCourseId: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const courseId = parseInt(req.params.courseId);

      if (isNaN(courseId)) {
        throw createHttpError(400, 'Недійсний ID курсу');
      }

      const reviews = await reviewService.getCourseReviewsByCourseId(courseId);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  },

  createCourseReview: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const validationResult = createCourseReviewSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw createHttpError(400, 'Неправильні дані відгуку', {
          details: validationResult.error.format(),
        });
      }

      const data = validationResult.data;
      const authenticatedUserId = req.user?.userId;

      if (!authenticatedUserId && (!data.authorName || !data.authorSurname)) {
        throw createHttpError(
          400,
          "Для анонімного відгуку необхідно вказати ім'я та прізвище автора"
        );
      }

      const files = req.files as
        | {
            beforePhoto?: Express.Multer.File[];
            afterPhoto?: Express.Multer.File[];
          }
        | undefined;

      const reviewData: CreateCourseReviewDTO = {
        ...data,
        beforePhotoUrl: files?.beforePhoto?.[0]
          ? getFileUrl(files.beforePhoto[0].filename)
          : undefined,
        afterPhotoUrl: files?.afterPhoto?.[0]
          ? getFileUrl(files.afterPhoto[0].filename)
          : undefined,
      };

      const newReview = await reviewService.createCourseReview(
        reviewData,
        authenticatedUserId
      );

      res.status(201).json(newReview);
    } catch (error) {
      const files = req.files as
        | {
            beforePhoto?: Express.Multer.File[];
            afterPhoto?: Express.Multer.File[];
          }
        | undefined;

      if (files?.beforePhoto?.[0]) {
        fs.unlinkSync(files.beforePhoto[0].path);
      }

      if (files?.afterPhoto?.[0]) {
        fs.unlinkSync(files.afterPhoto[0].path);
      }

      next(error);
    }
  },

  updateCourseReview: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw createHttpError(400, 'Недійсний ID відгуку');
      }

      const existingReview = await reviewService.getCourseReviewById(id);
      if (!existingReview) {
        throw createHttpError(404, 'Відгук не знайдено');
      }

      const validationResult = updateCourseReviewSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw createHttpError(400, 'Неправильні дані відгуку', {
          details: validationResult.error.format(),
        });
      }

      const files = req.files as
        | {
            beforePhoto?: Express.Multer.File[];
            afterPhoto?: Express.Multer.File[];
          }
        | undefined;

      const oldBeforePhotoFilename = getFilenameFromUrl(
        existingReview.beforePhotoUrl
      );
      const oldAfterPhotoFilename = getFilenameFromUrl(
        existingReview.afterPhotoUrl
      );

      const updateData: UpdateCourseReviewDTO = {
        ...validationResult.data,
      };

      if (files?.beforePhoto?.[0]) {
        updateData.beforePhotoUrl = getFileUrl(files.beforePhoto[0].filename);
      } else if (req.body.removeBeforePhoto === 'true') {
        updateData.beforePhotoUrl = null;
      }

      if (files?.afterPhoto?.[0]) {
        updateData.afterPhotoUrl = getFileUrl(files.afterPhoto[0].filename);
      } else if (req.body.removeAfterPhoto === 'true') {
        updateData.afterPhotoUrl = null;
      }

      const updatedReview = await reviewService.updateCourseReview(
        id,
        updateData
      );

      if (
        (files?.beforePhoto?.[0] || req.body.removeBeforePhoto === 'true') &&
        oldBeforePhotoFilename
      ) {
        const oldFilePath = path.join(
          process.cwd(),
          'cdn',
          'reviews',
          oldBeforePhotoFilename
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      if (
        (files?.afterPhoto?.[0] || req.body.removeAfterPhoto === 'true') &&
        oldAfterPhotoFilename
      ) {
        const oldFilePath = path.join(
          process.cwd(),
          'cdn',
          'reviews',
          oldAfterPhotoFilename
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      res.json(updatedReview);
    } catch (error) {
      const files = req.files as
        | {
            beforePhoto?: Express.Multer.File[];
            afterPhoto?: Express.Multer.File[];
          }
        | undefined;

      if (files?.beforePhoto?.[0]) {
        fs.unlinkSync(files.beforePhoto[0].path);
      }

      if (files?.afterPhoto?.[0]) {
        fs.unlinkSync(files.afterPhoto[0].path);
      }

      next(error);
    }
  },

  deleteCourseReview: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw createHttpError(400, 'Недійсний ID відгуку');
      }

      const review = await reviewService.getCourseReviewById(id);
      if (!review) {
        throw createHttpError(404, 'Відгук не знайдено');
      }

      await reviewService.deleteCourseReview(id);

      const beforePhotoFilename = getFilenameFromUrl(review.beforePhotoUrl);
      const afterPhotoFilename = getFilenameFromUrl(review.afterPhotoUrl);

      if (beforePhotoFilename) {
        const filePath = path.join(
          process.cwd(),
          'cdn',
          'reviews',
          beforePhotoFilename
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      if (afterPhotoFilename) {
        const filePath = path.join(
          process.cwd(),
          'cdn',
          'reviews',
          afterPhotoFilename
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

export default reviewController;
