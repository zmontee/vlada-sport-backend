import { Router } from 'express';
import courseController from '@/controllers/courseController';
import { authenticateJWT } from '@/middlewares/auth';

const courseRouter = Router();

courseRouter.get('/', courseController.getAllCourses);
courseRouter.get('/:id', courseController.getCourseById);

courseRouter.get(
  '/user/purchased',
  authenticateJWT,
  courseController.getUserPurchasedCourses
);
courseRouter.get(
  '/user/:id',
  authenticateJWT,
  courseController.getUserCourseById
);
courseRouter.get(
  '/user/module/:id',
  authenticateJWT,
  courseController.getUserModuleById
);
courseRouter.get(
  '/user/lesson/:id',
  authenticateJWT,
  courseController.getUserLessonById
);

export default courseRouter;
