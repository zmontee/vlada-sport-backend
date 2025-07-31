import generalReviewRepository from '@/repositories/reviewRepository';
import type {
  CreateGeneralReviewDTO,
  UpdateGeneralReviewDTO,
} from '@/types/review';

const reviewService = {
  getAllGeneralReviews: async () => {
    try {
      return await generalReviewRepository.findAll();
    } catch (error) {
      throw new Error(`Не вдалося отримати загальні відгуки: ${error.message}`);
    }
  },

  getGeneralReviewById: async (id: number) => {
    try {
      const review = await generalReviewRepository.findById(id);

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
      return await generalReviewRepository.create(data);
    } catch (error) {
      throw new Error(`Не вдалося створити відгук: ${error.message}`);
    }
  },

  updateGeneralReview: async (id: number, data: UpdateGeneralReviewDTO) => {
    try {
      const review = await generalReviewRepository.findById(id);

      if (!review) {
        throw new Error('Відгук не знайдено');
      }

      return await generalReviewRepository.update(id, data);
    } catch (error) {
      throw new Error(`Не вдалося оновити відгук: ${error.message}`);
    }
  },

  deleteGeneralReview: async (id: number) => {
    try {
      const review = await generalReviewRepository.findById(id);

      if (!review) {
        throw new Error('Відгук не знайдено');
      }

      return await generalReviewRepository.delete(id);
    } catch (error) {
      throw new Error(`Не вдалося видалити відгук: ${error.message}`);
    }
  },
};

export default reviewService;
