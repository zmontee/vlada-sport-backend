import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import reviewService from '@/services/reviewService';
import type {
  CreateGeneralReviewDTO,
  UpdateGeneralReviewDTO,
} from '@/types/review';
import createHttpError from 'http-errors';

const createGeneralReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3),
  beforePhotoUrl: z.string().url().optional(),
  afterPhotoUrl: z.string().url().optional(),
  userId: z.number().int().positive().optional(),
});

const updateGeneralReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(3).optional(),
  beforePhotoUrl: z.string().url().nullish(),
  afterPhotoUrl: z.string().url().nullish(),
  userId: z.number().int().positive().nullish(),
});

const reviewController = {
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

      const reviewData: CreateGeneralReviewDTO = validationResult.data;
      const newReview = await reviewService.createGeneralReview(reviewData);

      res.status(201).json(newReview);
    } catch (error) {
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

      const validationResult = updateGeneralReviewSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw createHttpError(400, 'Неправильні дані відгуку', {
          details: validationResult.error.format(),
        });
      }

      const reviewData: UpdateGeneralReviewDTO = validationResult.data;
      const updatedReview = await reviewService.updateGeneralReview(
        id,
        reviewData
      );

      res.json(updatedReview);
    } catch (error) {
      if (error instanceof Error && error.message === 'Відгук не знайдено') {
        next(createHttpError(404, 'Відгук не знайдено'));
      } else {
        next(error);
      }
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

      await reviewService.deleteGeneralReview(id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message === 'Відгук не знайдено') {
        next(createHttpError(404, 'Відгук не знайдено'));
      } else {
        next(error);
      }
    }
  },
};

export default reviewController;
