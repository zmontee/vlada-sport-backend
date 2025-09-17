import { PrismaClient } from '@prisma/client';
import type {
  CreateCourseReviewDTO,
  CreateGeneralReviewDTO,
  UpdateCourseReviewDTO,
  UpdateGeneralReviewDTO,
} from '@/types/review';

const prisma = new PrismaClient();

const reviewRepository = {
  findAllGeneralReviews: async () => {
    return prisma.generalReview.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
            experience: true,
            sex: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  findGeneralReviewById: async (id: number) => {
    return prisma.generalReview.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
            experience: true,
            sex: true,
          },
        },
      },
    });
  },

  createGeneralReview: async (data: CreateGeneralReviewDTO) => {
    return prisma.generalReview.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
            experience: true,
            sex: true,
          },
        },
      },
    });
  },

  updateGeneralReview: async (id: number, data: UpdateGeneralReviewDTO) => {
    return prisma.generalReview.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
            experience: true,
            sex: true,
          },
        },
      },
    });
  },

  deleteGeneralReview: async (id: number) => {
    return prisma.generalReview.delete({
      where: { id },
    });
  },

  findAllCourseReviews: async () => {
    return prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
            experience: true,
            sex: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  findCourseReviewById: async (id: number) => {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
            experience: true,
            sex: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });
  },

  findCourseReviewsByCourseId: async (courseId: number) => {
    return prisma.review.findMany({
      where: {
        courseId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
            experience: true,
            sex: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  createCourseReview: async (data: CreateCourseReviewDTO) => {
    return prisma.review.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
            experience: true,
            sex: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });
  },

  updateCourseReview: async (id: number, data: UpdateCourseReviewDTO) => {
    return prisma.review.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
            experience: true,
            sex: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });
  },

  deleteCourseReview: async (id: number) => {
    return prisma.review.delete({
      where: { id },
    });
  },

  findUserById: async (id: number) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        surname: true,
        experience: true,
        sex: true,
      },
    });
  },
};

export default reviewRepository;
