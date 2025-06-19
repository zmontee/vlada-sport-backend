// src/repositories/courseRepository.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const courseRepository = {
  findAll: async () => {
    return prisma.course.findMany({
      // include: {
      //   modules: {
      //     select: {
      //       id: true,
      //       title: true,
      //     },
      //   },
      // },
    });
  },

  findById: async (id: number) => {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: {
            orderIndex: 'asc',
          },
          include: {
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
        equipment: {
          include: {
            equipment: true,
          },
        },
        benefits: {
          include: {
            benefit: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                imageUrl: true,
                experience: true,
              },
            },
          },
        },
      },
    });

    if (course) {
      // Transform benefits to just an array of benefit objects
      const transformedBenefits = course.benefits.map(item => item.benefit);
      const transformedEquipment = course.equipment.map(item => item.equipment);

      return {
        ...course,
        benefits: transformedBenefits,
        equipment: transformedEquipment,
      };
    }

    return course;
  },

  findManyByIds: async (courseIds: number[]) => {
    return prisma.course.findMany({
      where: {
        id: {
          in: courseIds,
        },
      },
    });
  },

  findPurchasedByUserId: async (userId: number) => {
    return prisma.course.findMany({
      where: {
        purchases: {
          some: {
            userId,
          },
        },
      },
      include: {
        modules: {
          select: {
            id: true,
            title: true,
          },
        },
        progress: {
          where: {
            userId,
          },
          select: {
            progressPercent: true,
            isCompleted: true,
          },
        },
      },
    });
  },

  findUserCourseById: async (courseId: number, userId: number) => {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: {
            orderIndex: 'asc',
          },
          include: {
            lessons: {
              orderBy: {
                orderIndex: 'asc',
              },
              include: {
                lessonProgress: {
                  where: {
                    userId: userId,
                  },
                },
              },
            },
            moduleProgress: {
              where: {
                userId: userId,
              },
            },
          },
        },
        progress: {
          where: {
            userId: userId,
          },
          include: {
            currentModule: true,
          },
        },
        purchases: {
          where: {
            userId: userId,
          },
        },
        equipment: {
          include: {
            equipment: true,
          },
        },
        benefits: {
          include: {
            benefit: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                surname: true,
                imageUrl: true,
                experience: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    // Check if user has purchased this course
    const hasPurchased = course.purchases.length > 0;

    // Transform arrays to single objects where appropriate
    const transformedCourse = {
      ...course,
      hasPurchased,
      // Convert progress from array to object
      progress: course.progress[0]
        ? {
            ...course.progress[0],
            currentModule: course.progress[0].currentModule,
          }
        : null,
      // Transform modules to include transformed progress
      modules: course.modules.map(module => ({
        ...module,
        // Convert moduleProgress from array to object
        progress: module.moduleProgress[0] || null,
        // Remove the original array
        moduleProgress: undefined,
        // Transform lessons to include transformed progress
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          // Convert lessonProgress from array to object
          progress: lesson.lessonProgress[0] || null,
          // Remove the original array
          lessonProgress: undefined,
        })),
      })),
      // Transform benefits and equipment
      benefits: course.benefits.map(item => item.benefit),
      equipment: course.equipment.map(item => item.equipment),
      // Keep reviews data but don't modify it
      // We don't need purchases data in the response
      purchases: undefined,
    };

    return transformedCourse;
  },

  findUserModuleById: async (moduleId: number, userId: number) => {
    // First check if this module belongs to a course purchased by the user
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          include: {
            purchases: {
              where: { userId },
            },
          },
        },
        lessons: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessonProgress: {
              where: { userId },
            },
          },
        },
        moduleProgress: {
          where: { userId },
        },
        equipment: {
          include: {
            equipment: true,
          },
        },
      },
    });

    if (!module) {
      return null;
    }

    // Check if user has purchased the course containing this module
    const hasPurchased = module.course.purchases.length > 0;

    // Transform the data for the response
    const transformedModule = {
      ...module,
      hasPurchased,
      // Remove course purchases from response
      course: {
        ...module.course,
        purchases: undefined,
      },
      // Transform progress from array to object
      progress: module.moduleProgress[0] || null,
      // Remove the original array
      moduleProgress: undefined,
      equipment: module.equipment.map(item => item.equipment),
      // Transform lessons to include progress
      lessons: module.lessons.map(lesson => ({
        ...lesson,
        // Convert lessonProgress from array to object
        progress: lesson.lessonProgress[0] || null,
        // Remove the original array
        lessonProgress: undefined,
      })),
    };

    return transformedModule;
  },

  findUserLessonById: async (lessonId: number, userId: number) => {
    // Отримуємо урок разом з даними про модуль та курс
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                purchases: {
                  where: { userId },
                  select: { id: true },
                },
              },
            },
          },
        },
        lessonProgress: {
          where: { userId },
        },
        equipment: {
          include: {
            equipment: true,
          },
        },
      },
    });

    if (!lesson) {
      return null;
    }

    const hasPurchased = lesson.module.course.purchases.length > 0;

    const nextLesson = await prisma.lesson.findFirst({
      where: {
        moduleId: lesson.moduleId,
        orderIndex: {
          gt: lesson.orderIndex,
        },
      },
      orderBy: {
        orderIndex: 'asc',
      },
      select: {
        id: true,
      },
    });

    const prevLesson = await prisma.lesson.findFirst({
      where: {
        moduleId: lesson.moduleId,
        orderIndex: {
          lt: lesson.orderIndex,
        },
      },
      orderBy: {
        orderIndex: 'desc',
      },
      select: {
        id: true,
      },
    });

    const transformedLesson = {
      ...lesson,
      hasPurchased,
      nextLessonId: nextLesson?.id || null,
      prevLessonId: prevLesson?.id || null,
      module: {
        id: lesson.module.id,
        title: lesson.module.title,
        orderIndex: lesson.module.orderIndex,
        courseId: lesson.module.course.id,
      },
      progress: lesson.lessonProgress[0] || null,
      lessonProgress: undefined,
      equipment: lesson.equipment.map(item => item.equipment),
    };

    return transformedLesson;
  },

  findModuleOrderIndex: async (moduleId: number) => {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { orderIndex: true },
    });

    return module;
  },
};

export default courseRepository;
