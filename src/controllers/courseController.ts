import type { NextFunction, Request, Response } from 'express';
import courseService from '@/services/courseService';
import createHttpError from 'http-errors';

const courseController = {
  getAllCourses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await courseService.getAllCourses();

      res.json(courses);
    } catch (error) {
      next(error);
    }
  },

  getCourseById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = Number(req.params.id);

      if (isNaN(courseId)) {
        throw createHttpError(400, 'Invalid course ID');
      }

      const course = await courseService.getCourseById(courseId);

      if (!course) {
        throw createHttpError(404, 'Course not found');
      }

      res.json(course);
    } catch (error) {
      next(error);
    }
  },

  getUserPurchasedCourses: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      const purchasedCourses =
        await courseService.getUserPurchasedCourses(userId);

      res.json(purchasedCourses);
    } catch (error) {
      next(error);
    }
  },

  getUserCourseById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const courseId = Number(req.params.id);
      const userId = req.user?.userId;

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      if (isNaN(courseId)) {
        throw createHttpError(400, 'Invalid course ID');
      }

      const course = await courseService.getUserCourseById(courseId, userId);

      if (!course) {
        throw createHttpError(404, 'Course not found');
      }

      res.json(course);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'User has not purchased this course'
      ) {
        next(createHttpError(403, 'User has not purchased this course'));
      } else {
        next(error);
      }
    }
  },

  getUserModuleById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const moduleId = Number(req.params.id);
      const userId = req.user?.userId;

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      if (isNaN(moduleId)) {
        throw createHttpError(400, 'Invalid module ID');
      }

      const module = await courseService.getUserModuleById(moduleId, userId);

      if (!module) {
        throw createHttpError(404, 'Module not found');
      }

      res.json(module);
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

  getUserLessonById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const lessonId = Number(req.params.id);
      const userId = req.user?.userId;

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      if (isNaN(lessonId)) {
        throw createHttpError(400, 'Invalid lesson ID');
      }

      const lesson = await courseService.getUserLessonById(lessonId, userId);

      if (!lesson) {
        throw createHttpError(404, 'Lesson not found');
      }

      res.json(lesson);
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
};

export default courseController;
