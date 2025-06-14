// src/repositories/purchaseRepository.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreatePurchaseParams {
  userId: number;
  courseId: number;
  amount: number;
  paymentMethod?: string;
  paymentId?: string;
}

const purchaseRepository = {
  findUserPurchases: async (userId: number, courseIds: number[]) => {
    return prisma.purchase.findMany({
      where: {
        userId,
        courseId: {
          in: courseIds,
        },
      },
    });
  },

  createPurchase: async (params: CreatePurchaseParams) => {
    const { userId, courseId, amount, paymentMethod, paymentId } = params;

    return prisma.purchase.create({
      data: {
        userId,
        courseId,
        amount,
        paymentMethod,
        paymentId,
        purchaseDate: new Date(),
      },
    });
  },

  initializeCourseProgress: async (userId: number, courseId: number) => {
    // Start a transaction to ensure all progress records are created atomically
    return prisma.$transaction(async tx => {
      // 1. Get all modules for this course, ordered by orderIndex
      const modules = await tx.module.findMany({
        where: { courseId },
        orderBy: { orderIndex: 'asc' },
        include: {
          lessons: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (modules.length === 0) {
        throw new Error('No modules found for this course');
      }

      // Get the first module ID
      const firstModuleId = modules[0].id;

      // 2. Create course progress with the first module as current
      const courseProgress = await tx.courseProgress.create({
        data: {
          userId,
          courseId,
          progressPercent: 0,
          isCompleted: false,
          currentModuleId: firstModuleId, // Set first module as current
        },
      });
      // 3. Create progress for each module (first module unlocked, others locked)
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const isFirstModule = i === 0;

        // Create module progress
        const moduleProgress = await tx.moduleProgress.create({
          data: {
            userId,
            moduleId: module.id,
            progressPercent: 0,
            isCompleted: false,
            isLocked: !isFirstModule, // First module is unlocked, others are locked
          },
        });

        // 4. Create progress for each lesson in the module
        for (let j = 0; j < module.lessons.length; j++) {
          const lesson = module.lessons[j];
          const isFirstLesson = j === 0;

          await tx.lessonProgress.create({
            data: {
              userId,
              lessonId: lesson.id,
              isCompleted: false,
              isLocked: !(isFirstModule && isFirstLesson), // Only the first lesson of the first module is unlocked
              position: 0,
            },
          });
        }
      }

      return courseProgress;
    });
  },
};

export default purchaseRepository;
