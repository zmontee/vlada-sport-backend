import { Router } from 'express';
import reviewController from '@/controllers/reviewController';
import { authenticateJWT } from '@/middlewares/auth';
import { optionalAuth } from '@/middlewares/optionalAuth';

const router = Router();

router.get('/general', reviewController.getAllGeneralReviews);
router.get('/general/:id', reviewController.getGeneralReviewById);
router.post(
  '/general',
  optionalAuth,
  reviewController.uploadReviewImages,
  reviewController.createGeneralReview
);
router.put(
  '/general/:id',
  authenticateJWT,
  reviewController.uploadReviewImages,
  reviewController.updateGeneralReview
);
router.delete(
  '/general/:id',
  authenticateJWT,
  reviewController.deleteGeneralReview
);

router.get('/course', reviewController.getAllCourseReviews);
router.get('/course/:id', reviewController.getCourseReviewById);
router.get(
  '/course/by-course/:courseId',
  reviewController.getCourseReviewsByCourseId
);
router.post(
  '/course',
  optionalAuth,
  reviewController.uploadReviewImages,
  reviewController.createCourseReview
);
router.put(
  '/course/:id',
  authenticateJWT, // Вимагаємо авторизацію для редагування
  reviewController.uploadReviewImages,
  reviewController.updateCourseReview
);
router.delete(
  '/course/:id',
  authenticateJWT, // Вимагаємо авторизацію для видалення
  reviewController.deleteCourseReview
);

export default router;
