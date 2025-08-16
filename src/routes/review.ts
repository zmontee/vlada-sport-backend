import { Router } from 'express';
import reviewController from '@/controllers/reviewController';
import { authenticateJWT } from '@/middlewares/auth';

const router = Router();

// Маршрути для загальних відгуків
router.get('/general', reviewController.getAllGeneralReviews);
router.get('/general/:id', reviewController.getGeneralReviewById);
router.post(
  '/general',
  reviewController.uploadReviewImages,
  reviewController.createGeneralReview
);
router.put(
  '/general/:id',
  authenticateJWT, // Вимагаємо авторизацію для редагування
  reviewController.uploadReviewImages,
  reviewController.updateGeneralReview
);
router.delete(
  '/general/:id',
  authenticateJWT, // Вимагаємо авторизацію для видалення
  reviewController.deleteGeneralReview
);

// Маршрути для відгуків до курсів
router.get('/course', reviewController.getAllCourseReviews);
router.get('/course/:id', reviewController.getCourseReviewById);
router.get(
  '/course/by-course/:courseId',
  reviewController.getCourseReviewsByCourseId
);
router.post(
  '/course',
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
