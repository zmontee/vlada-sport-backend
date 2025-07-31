import { Router } from 'express';
import reviewController from '@/controllers/reviewController';
import { authenticateJWT } from '@/middlewares/auth';

const reviewRouter = Router();

// Публічні маршрути
reviewRouter.get('/', reviewController.getAllGeneralReviews);
reviewRouter.get('/:id', reviewController.getGeneralReviewById);

// Захищені маршрути (потрібна автентифікація та авторизація)
reviewRouter.post('/', authenticateJWT, reviewController.createGeneralReview);
reviewRouter.put('/:id', authenticateJWT, reviewController.updateGeneralReview);
reviewRouter.delete(
  '/:id',
  authenticateJWT,
  reviewController.deleteGeneralReview
);

export default reviewRouter;
