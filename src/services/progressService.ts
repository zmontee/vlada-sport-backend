import progressRepository from '@/repositories/progressRepository';
import courseRepository from '@/repositories/courseRepository';
import type {
  CompleteLessonResult,
  CompleteModuleResult,
} from '@/types/progress';

const progressService = {
  updateLessonProgress: async (
    userId: number,
    lessonId: number,
    position: number
  ) => {
    const purchaseCheck = await progressRepository.checkUserHasPurchasedCourse(
      userId,
      lessonId
    );

    if (!purchaseCheck) {
      throw new Error('Lesson not found');
    }

    if (!purchaseCheck.hasPurchased) {
      throw new Error(
        'User has not purchased the course containing this lesson'
      );
    }

    const updatedLessonProgress = await progressRepository.updateLessonProgress(
      userId,
      lessonId,
      { position }
    );

    return {
      lessonProgress: updatedLessonProgress,
    };
  },

  completeLesson: async (userId: number, lessonId: number) => {
    const purchaseCheck = await progressRepository.checkUserHasPurchasedCourse(
      userId,
      lessonId
    );

    if (!purchaseCheck) {
      throw new Error('Lesson not found');
    }

    if (!purchaseCheck.hasPurchased) {
      throw new Error(
        'User has not purchased the course containing this lesson'
      );
    }

    const courseId = purchaseCheck.courseId;

    const lesson = await progressRepository.getLessonWithModule(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const moduleId = lesson.module.id;
    const moduleOrderIndex = lesson.module.orderIndex;

    // Позначаємо урок як завершений і скидаємо позицію перегляду
    const updatedLessonProgress = await progressRepository.updateLessonProgress(
      userId,
      lessonId,
      { isCompleted: true, position: 0 }
    );

    const result: CompleteLessonResult = {
      lessonProgress: updatedLessonProgress,
      moduleCompleted: false,
      courseCompleted: false,
    };

    // Спроба розблокувати наступний урок
    const unlockedLesson = await progressRepository.unlockNextLesson(
      userId,
      lessonId
    );

    if (unlockedLesson) {
      result.nextLessonUnlocked = unlockedLesson.lessonId;
    }

    // Перевірка, чи всі уроки в модулі завершені
    const allLessonsCompleted =
      await progressRepository.checkAllLessonsInModuleCompleted(
        userId,
        moduleId
      );

    if (allLessonsCompleted) {
      // Якщо всі уроки пройдені, позначаємо модуль як пройдений
      const moduleProgressPercent = 100;
      const updatedModuleProgress =
        await progressRepository.updateModuleProgress(
          userId,
          moduleId,
          true,
          moduleProgressPercent
        );

      result.moduleCompleted = true;
      result.moduleProgress = updatedModuleProgress;

      // Розблоковуємо наступний модуль, якщо він існує
      const unlockedModule = await progressRepository.unlockNextModule(
        userId,
        courseId,
        moduleOrderIndex
      );

      if (unlockedModule) {
        result.nextModuleUnlocked = unlockedModule.nextModuleId;

        // Оновлюємо прогрес курсу, щоб відображати поточний модуль
        await progressRepository.updateCourseProgress(
          userId,
          courseId,
          false,
          undefined,
          unlockedModule.nextModuleId
        );
      }

      // Перевіряємо, чи всі модулі в курсі пройдені
      const allModulesCompleted =
        await progressRepository.checkAllModulesInCourseCompleted(
          userId,
          courseId
        );

      if (allModulesCompleted) {
        // Якщо всі модулі пройдені, позначаємо курс як пройдений
        const updatedCourseProgress =
          await progressRepository.updateCourseProgress(
            userId,
            courseId,
            true,
            100
          );

        result.courseCompleted = true;
        result.courseProgress = updatedCourseProgress;
      } else {
        // Якщо не всі модулі пройдені, оновлюємо відсоток прогресу курсу
        const courseProgressPercent =
          await progressRepository.calculateCourseProgress(userId, courseId);

        const updatedCourseProgress =
          await progressRepository.updateCourseProgress(
            userId,
            courseId,
            false,
            courseProgressPercent
          );

        result.courseProgress = updatedCourseProgress;
      }
    } else {
      // Якщо не всі уроки пройдені, оновлюємо відсоток прогресу модуля
      const moduleProgressPercent =
        await progressRepository.calculateModuleProgress(userId, moduleId);

      const updatedModuleProgress =
        await progressRepository.updateModuleProgress(
          userId,
          moduleId,
          false,
          moduleProgressPercent
        );

      result.moduleProgress = updatedModuleProgress;

      // Оновлюємо відсоток прогресу курсу
      const courseProgressPercent =
        await progressRepository.calculateCourseProgress(userId, courseId);

      const updatedCourseProgress =
        await progressRepository.updateCourseProgress(
          userId,
          courseId,
          false,
          courseProgressPercent
        );

      result.courseProgress = updatedCourseProgress;
    }

    return result;
  },

  completeModule: async (userId: number, moduleId: number) => {
    const purchaseCheck = await progressRepository.checkUserHasPurchasedModule(
      userId,
      moduleId
    );

    if (!purchaseCheck) {
      throw new Error('Module not found');
    }

    if (!purchaseCheck.hasPurchased) {
      throw new Error(
        'User has not purchased the course containing this module'
      );
    }

    const courseId = purchaseCheck.courseId;

    const lessons = await progressRepository.getAllModuleLessons(moduleId);
    if (lessons.length === 0) {
      throw new Error('No lessons found in this module');
    }

    const module = await courseRepository.findModuleOrderIndex(moduleId);

    if (!module) {
      throw new Error('Module not found');
    }

    const moduleOrderIndex = module.orderIndex;

    const lessonProgressUpdates = await Promise.all(
      lessons.map(lesson =>
        progressRepository.updateLessonProgress(userId, lesson.id, {
          isCompleted: true,
          position: 0,
        })
      )
    );

    const updatedModuleProgress = await progressRepository.updateModuleProgress(
      userId,
      moduleId,
      true,
      100
    );

    const result: CompleteModuleResult = {
      moduleCompleted: true,
      moduleProgress: updatedModuleProgress,
      lessonsCompleted: lessonProgressUpdates.length,
    };

    const unlockedModule = await progressRepository.unlockNextModule(
      userId,
      courseId,
      moduleOrderIndex
    );

    if (unlockedModule) {
      result.nextModuleUnlocked = unlockedModule.nextModuleId;

      await progressRepository.updateCourseProgress(
        userId,
        courseId,
        false,
        undefined,
        unlockedModule.nextModuleId
      );
    }

    const allModulesCompleted =
      await progressRepository.checkAllModulesInCourseCompleted(
        userId,
        courseId
      );

    if (allModulesCompleted) {
      const updatedCourseProgress =
        await progressRepository.updateCourseProgress(
          userId,
          courseId,
          true,
          100
        );

      result.courseCompleted = true;
      result.courseProgress = updatedCourseProgress;
    } else {
      const courseProgressPercent =
        await progressRepository.calculateCourseProgress(userId, courseId);

      const updatedCourseProgress =
        await progressRepository.updateCourseProgress(
          userId,
          courseId,
          false,
          courseProgressPercent
        );

      result.courseProgress = updatedCourseProgress;
    }

    return result;
  },
};

export default progressService;
