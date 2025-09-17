import type {
  CreateCourseReviewDTO,
  CreateGeneralReviewDTO,
  UpdateCourseReviewDTO,
  UpdateGeneralReviewDTO,
} from '@/types/review';
import reviewRepository from '@/repositories/reviewRepository';

const reviewService = {
  getAllGeneralReviews: async () => {
    try {
      return await reviewRepository.findAllGeneralReviews();
    } catch (error) {
      throw new Error(`Не вдалося отримати загальні відгуки: ${error.message}`);
    }
  },

  getGeneralReviewById: async (id: number) => {
    try {
      const review = await reviewRepository.findGeneralReviewById(id);

      if (!review) {
        throw new Error('Відгук не знайдено');
      }

      return review;
    } catch (error) {
      throw new Error(`Не вдалося отримати відгук: ${error.message}`);
    }
  },

  createGeneralReview: async (
    data: CreateGeneralReviewDTO,
    authenticatedUserId?: number
  ) => {
    try {
      let reviewData = { ...data };

      if (authenticatedUserId) {
        const user = await reviewRepository.findUserById(authenticatedUserId);
        if (user) {
          reviewData = {
            rating: data.rating,
            comment: data.comment,
            beforePhotoUrl: data.beforePhotoUrl,
            afterPhotoUrl: data.afterPhotoUrl,
            userId: user.id,

            authorName: undefined,
            authorSurname: undefined,
            authorExperience: undefined,
            authorSex: undefined,
          };
        }
      } else {
        if (!data.authorName || !data.authorSurname) {
          throw new Error(
            "Для анонімного відгуку необхідно вказати ім'я та прізвище автора"
          );
        }
      }

      return await reviewRepository.createGeneralReview(reviewData);
    } catch (error) {
      throw new Error(`Не вдалося створити відгук: ${error.message}`);
    }
  },

  updateGeneralReview: async (id: number, data: UpdateGeneralReviewDTO) => {
    try {
      const review = await reviewRepository.findGeneralReviewById(id);

      if (!review) {
        throw new Error('Відгук не знайдено');
      }

      return await reviewRepository.updateGeneralReview(id, data);
    } catch (error) {
      throw new Error(`Не вдалося оновити відгук: ${error.message}`);
    }
  },

  deleteGeneralReview: async (id: number) => {
    try {
      const review = await reviewRepository.findGeneralReviewById(id);

      if (!review) {
        throw new Error('Відгук не знайдено');
      }

      return await reviewRepository.deleteGeneralReview(id);
    } catch (error) {
      throw new Error(`Не вдалося видалити відгук: ${error.message}`);
    }
  },

  getAllCourseReviews: async () => {
    try {
      return await reviewRepository.findAllCourseReviews();
    } catch (error) {
      throw new Error(
        `Не вдалося отримати відгуки до курсів: ${error.message}`
      );
    }
  },

  getCourseReviewById: async (id: number) => {
    try {
      const review = await reviewRepository.findCourseReviewById(id);

      if (!review) {
        throw new Error('Відгук не знайдено');
      }

      return review;
    } catch (error) {
      throw new Error(`Не вдалося отримати відгук: ${error.message}`);
    }
  },

  getCourseReviewsByCourseId: async (courseId: number) => {
    try {
      return await reviewRepository.findCourseReviewsByCourseId(courseId);
    } catch (error) {
      throw new Error(
        `Не вдалося отримати відгуки для курсу: ${error.message}`
      );
    }
  },

  createCourseReview: async (
    data: CreateCourseReviewDTO,
    authenticatedUserId?: number
  ) => {
    try {
      let reviewData = { ...data };

      if (authenticatedUserId) {
        const user = await reviewRepository.findUserById(authenticatedUserId);
        if (user) {
          reviewData = {
            rating: data.rating,
            comment: data.comment,
            beforePhotoUrl: data.beforePhotoUrl,
            afterPhotoUrl: data.afterPhotoUrl,
            courseId: data.courseId,
            userId: user.id,

            authorName: undefined,
            authorSurname: undefined,
            authorExperience: undefined,
            authorSex: undefined,
          };
        }
      } else {
        if (!data.authorName || !data.authorSurname) {
          throw new Error(
            "Для анонімного відгуку необхідно вказати ім'я та прізвище автора"
          );
        }
      }

      return await reviewRepository.createCourseReview(reviewData);
    } catch (error) {
      throw new Error(`Не вдалося створити відгук: ${error.message}`);
    }
  },

  updateCourseReview: async (id: number, data: UpdateCourseReviewDTO) => {
    try {
      const review = await reviewRepository.findCourseReviewById(id);

      if (!review) {
        throw new Error('Відгук не знайдено');
      }

      return await reviewRepository.updateCourseReview(id, data);
    } catch (error) {
      throw new Error(`Не вдалося оновити відгук: ${error.message}`);
    }
  },

  deleteCourseReview: async (id: number) => {
    try {
      const review = await reviewRepository.findCourseReviewById(id);

      if (!review) {
        throw new Error('Відгук не знайдено');
      }

      return await reviewRepository.deleteCourseReview(id);
    } catch (error) {
      throw new Error(`Не вдалося видалити відгук: ${error.message}`);
    }
  },
};

export default reviewService;
