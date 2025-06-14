import courseRepository from '@/repositories/courseRepository';

const courseService = {
  getAllCourses: async () => {
    return courseRepository.findAll();
  },

  getCourseById: async (courseId: number) => {
    return courseRepository.findById(courseId);
  },

  getUserPurchasedCourses: async (userId: number) => {
    return courseRepository.findPurchasedByUserId(userId);
  },

  getUserCourseById: async (courseId: number, userId: number) => {
    const course = await courseRepository.findUserCourseById(courseId, userId);

    if (!course) {
      return null;
    }

    if (!course.hasPurchased) {
      throw new Error('User has not purchased this course');
    }

    return course;
  },

  getUserModuleById: async (moduleId: number, userId: number) => {
    const module = await courseRepository.findUserModuleById(moduleId, userId);

    if (!module) {
      return null;
    }

    if (!module.hasPurchased) {
      throw new Error(
        'User has not purchased the course containing this module'
      );
    }

    return module;
  },

  getUserLessonById: async (lessonId: number, userId: number) => {
    const lesson = await courseRepository.findUserLessonById(lessonId, userId);

    if (!lesson) {
      return null;
    }

    if (!lesson.hasPurchased) {
      throw new Error(
        'User has not purchased the course containing this lesson'
      );
    }

    return lesson;
  },
};

export default courseService;
