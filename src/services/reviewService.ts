import type {
  CreateCourseReviewDTO,
  CreateGeneralReviewDTO,
  UpdateCourseReviewDTO,
  UpdateGeneralReviewDTO,
} from '@/types/review';
import reviewRepository from '@/repositories/reviewRepository';

const reviewService = {
  // Методи для загальних відгуків
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

  createGeneralReview: async (data: CreateGeneralReviewDTO) => {
    try {
      if (!data.userId && (!data.authorName || !data.authorSurname)) {
        throw new Error(
          'Необхідно вказати автора відгуку (userId або дані анонімного автора)'
        );
      }

      return await reviewRepository.createGeneralReview(data);
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

  // Методи для відгуків до курсів
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

  createCourseReview: async (data: CreateCourseReviewDTO) => {
    try {
      // Валідація даних - має бути або userId, або дані анонімного автора
      if (!data.userId && (!data.authorName || !data.authorSurname)) {
        throw new Error(
          'Необхідно вказати автора відгуку (userId або дані анонімного автора)'
        );
      }

      return await reviewRepository.createCourseReview(data);
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
