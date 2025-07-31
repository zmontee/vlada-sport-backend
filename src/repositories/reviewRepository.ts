import { PrismaClient } from '@prisma/client';
import type {
  CreateGeneralReviewDTO,
  UpdateGeneralReviewDTO,
} from '@/types/review';

const prisma = new PrismaClient();

const reviewRepository = {
  findAll: async () => {
    return prisma.generalReview.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  findById: async (id: number) => {
    return prisma.generalReview.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
          },
        },
      },
    });
  },

  create: async (data: CreateGeneralReviewDTO) => {
    return prisma.generalReview.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            imageUrl: true,
          },
        },
      },
    });
  },

  update: async (id: number, data: UpdateGeneralReviewDTO) => {
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
          },
        },
      },
    });
  },

  delete: async (id: number) => {
    return prisma.generalReview.delete({
      where: { id },
    });
  },
};

export default reviewRepository;
