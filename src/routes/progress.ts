import { Router } from 'express';
import progressController from '@/controllers/progressController';
import { authenticateJWT } from '@/middlewares/auth';

const progressRouter = Router();

progressRouter.patch(
  '/lessons/:lessonId/position',
  authenticateJWT,
  progressController.updateLessonProgress
);

progressRouter.patch(
  '/lessons/:lessonId/complete',
  authenticateJWT,
  progressController.completeLesson
);

export default progressRouter;
