import type { NextFunction, Request, Response } from 'express';
import progressService from '@/services/progressService';
import createHttpError from 'http-errors';

const progressController = {
  updateLessonProgress: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user?.userId;
      const lessonId = Number(req.params.lessonId);
      const { position } = req.body;

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      if (isNaN(lessonId)) {
        throw createHttpError(400, 'Invalid lesson ID');
      }

      if (position === undefined) {
        throw createHttpError(400, 'Position parameter is required');
      }

      const result = await progressService.updateLessonProgress(
        userId,
        lessonId,
        Number(position)
      );

      res.json(result);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          'User has not purchased the course containing this lesson'
      ) {
        next(
          createHttpError(
            403,
            'User has not purchased the course containing this lesson'
          )
        );
      } else {
        next(error);
      }
    }
  },

  completeLesson: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const lessonId = Number(req.params.lessonId);

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      if (isNaN(lessonId)) {
        throw createHttpError(400, 'Invalid lesson ID');
      }

      const result = await progressService.completeLesson(userId, lessonId);

      res.json(result);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          'User has not purchased the course containing this lesson'
      ) {
        next(
          createHttpError(
            403,
            'User has not purchased the course containing this lesson'
          )
        );
      } else {
        next(error);
      }
    }
  },

  completeModule: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const moduleId = Number(req.params.moduleId);

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      if (isNaN(moduleId)) {
        throw createHttpError(400, 'Invalid module ID');
      }

      const result = await progressService.completeModule(userId, moduleId);

      res.json(result);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          'User has not purchased the course containing this module'
      ) {
        next(
          createHttpError(
            403,
            'User has not purchased the course containing this module'
          )
        );
      } else {
        next(error);
      }
    }
  },
};

export default progressController;
