import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const progressRepository = {
  checkUserHasPurchasedCourse: async (userId: number, lessonId: number) => {
    const result = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        module: {
          select: {
            course: {
              select: {
                id: true,
                purchases: {
                  where: { userId },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!result) return null;

    const courseId = result.module.course.id;
    const hasPurchased = result.module.course.purchases.length > 0;

    return { courseId, hasPurchased };
  },

  checkUserHasPurchasedModule: async (userId: number, moduleId: number) => {
    const result = await prisma.module.findUnique({
      where: { id: moduleId },
      select: {
        course: {
          select: {
            id: true,
            purchases: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!result) return null;

    const courseId = result.course.id;
    const hasPurchased = result.course.purchases.length > 0;

    return { courseId, hasPurchased };
  },

  getLessonWithModule: async (lessonId: number) => {
    return prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            id: true,
            courseId: true,
            orderIndex: true,
          },
        },
      },
    });
  },

  getAllModuleLessons: async (moduleId: number) => {
    return prisma.lesson.findMany({
      where: { moduleId },
      orderBy: {
        orderIndex: 'asc',
      },
    });
  },

  updateLessonProgress: async (
    userId: number,
    lessonId: number,
    data: {
      position?: number;
      isCompleted?: boolean;
    }
  ) => {
    const updateData: any = { ...data };

    if (data.isCompleted) {
      updateData.completedAt = new Date();
    }

    return prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: updateData,
      create: {
        userId,
        lessonId,
        isLocked: false,
        position: data.position || 0,
        isCompleted: data.isCompleted || false,
        ...(data.isCompleted ? { completedAt: new Date() } : {}),
      },
    });
  },

  getNextLesson: async (moduleId: number, currentLessonOrderIndex: number) => {
    return prisma.lesson.findFirst({
      where: {
        moduleId,
        orderIndex: currentLessonOrderIndex + 1,
      },
    });
  },

  unlockNextLesson: async (userId: number, lessonId: number) => {
    // Отримати поточний урок з його orderIndex
    const currentLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        moduleId: true,
        orderIndex: true,
      },
    });

    if (!currentLesson) return null;

    // Знайти наступний урок у тому ж модулі
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        moduleId: currentLesson.moduleId,
        orderIndex: currentLesson.orderIndex + 1,
      },
    });

    if (!nextLesson) return null; // Немає наступного уроку

    // Перевірити чи існує вже запис прогресу для наступного уроку
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId: nextLesson.id,
        },
      },
    });

    // Якщо запис існує - оновлюємо його, якщо ні - створюємо
    if (existingProgress) {
      return prisma.lessonProgress.update({
        where: {
          userId_lessonId: {
            userId,
            lessonId: nextLesson.id,
          },
        },
        data: {
          isLocked: false,
        },
      });
    } else {
      return prisma.lessonProgress.create({
        data: {
          userId,
          lessonId: nextLesson.id,
          isLocked: false,
          position: 0,
          isCompleted: false,
        },
      });
    }
  },

  // Перевірити, чи всі уроки модуля завершені
  checkAllLessonsInModuleCompleted: async (
    userId: number,
    moduleId: number
  ) => {
    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      include: {
        lessonProgress: {
          where: {
            userId,
            isCompleted: true,
          },
        },
      },
    });

    if (lessons.length === 0) return false;

    // Перевіряємо, чи для всіх уроків є запис про прогрес і він позначений як завершений
    return lessons.every(lesson => lesson.lessonProgress.length > 0);
  },

  // Оновити прогрес модуля
  updateModuleProgress: async (
    userId: number,
    moduleId: number,
    isCompleted: boolean,
    progressPercent?: number
  ) => {
    const updateData: any = {
      isCompleted,
    };

    if (progressPercent !== undefined) {
      updateData.progressPercent = progressPercent;
    }

    if (isCompleted) {
      updateData.completedAt = new Date();
    }

    return prisma.moduleProgress.update({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
      data: updateData,
    });
  },

  // Розблокувати наступний модуль
  unlockNextModule: async (
    userId: number,
    courseId: number,
    currentModuleOrderIndex: number
  ) => {
    // Знаходимо наступний модуль
    const nextModule = await prisma.module.findFirst({
      where: {
        courseId,
        orderIndex: currentModuleOrderIndex + 1,
      },
    });

    if (!nextModule) return null; // Немає наступного модуля

    // Розблоковуємо модуль
    const updatedModuleProgress = await prisma.moduleProgress.update({
      where: {
        userId_moduleId: {
          userId,
          moduleId: nextModule.id,
        },
      },
      data: {
        isLocked: false,
      },
    });

    // Розблоковуємо перший урок цього модуля
    const firstLesson = await prisma.lesson.findFirst({
      where: {
        moduleId: nextModule.id,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    if (firstLesson) {
      await prisma.lessonProgress.update({
        where: {
          userId_lessonId: {
            userId,
            lessonId: firstLesson.id,
          },
        },
        data: {
          isLocked: false,
        },
      });
    }

    return {
      moduleProgress: updatedModuleProgress,
      nextModuleId: nextModule.id,
    };
  },

  // Перевірити, чи всі модулі курсу завершені
  checkAllModulesInCourseCompleted: async (
    userId: number,
    courseId: number
  ) => {
    const modules = await prisma.module.findMany({
      where: { courseId },
      include: {
        moduleProgress: {
          where: {
            userId,
            isCompleted: true,
          },
        },
      },
    });

    if (modules.length === 0) return false;

    // Перевіряємо, чи для всіх модулів є запис про прогрес і він позначений як завершений
    return modules.every(module => module.moduleProgress.length > 0);
  },

  // Оновити прогрес курсу
  updateCourseProgress: async (
    userId: number,
    courseId: number,
    isCompleted: boolean,
    progressPercent?: number,
    currentModuleId?: number
  ) => {
    const updateData: any = {
      isCompleted,
    };

    if (progressPercent !== undefined) {
      updateData.progressPercent = progressPercent;
    }

    if (currentModuleId !== undefined) {
      updateData.currentModuleId = currentModuleId;
    }

    if (isCompleted) {
      updateData.completedAt = new Date();
    }

    return prisma.courseProgress.update({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      data: updateData,
    });
  },

  // Розрахувати відсоток прогресу модуля
  calculateModuleProgress: async (userId: number, moduleId: number) => {
    // Спочатку перевіримо, чи модуль вже позначений як завершений
    const moduleProgress = await prisma.moduleProgress.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
      select: {
        isCompleted: true,
      },
    });

    // Якщо модуль завершений, повертаємо 100%
    if (moduleProgress?.isCompleted) {
      return 100;
    }

    // Якщо модуль не завершений, розраховуємо відсоток на основі завершених уроків
    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      include: {
        lessonProgress: {
          where: { userId },
        },
      },
    });

    if (lessons.length === 0) return 0;

    const completedLessons = lessons.filter(
      lesson =>
        lesson.lessonProgress.length > 0 && lesson.lessonProgress[0].isCompleted
    ).length;

    // Заокруглюємо до цілого числа
    return Math.round((completedLessons / lessons.length) * 100);
  },

  // Розрахувати відсоток прогресу курсу
  calculateCourseProgress: async (userId: number, courseId: number) => {
    // Спочатку перевіримо, чи курс вже позначений як завершений
    const courseProgress = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: {
        isCompleted: true,
      },
    });

    // Якщо курс завершений, повертаємо 100%
    if (courseProgress?.isCompleted) {
      return 100;
    }

    // Якщо курс не завершений, розраховуємо відсоток на основі прогресу модулів
    const modules = await prisma.module.findMany({
      where: { courseId },
    });

    if (modules.length === 0) return 0;

    // Отримуємо відсоток прогресу для кожного модуля
    const moduleProgressValues = await Promise.all(
      modules.map(module =>
        progressRepository.calculateModuleProgress(userId, module.id)
      )
    );

    const totalProgress = moduleProgressValues.reduce(
      (sum, progress) => sum + progress,
      0
    );
    return Math.round(totalProgress / modules.length);
  },
};

export default progressRepository;
