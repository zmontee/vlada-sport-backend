import courseRepository from '@/repositories/courseRepository';
import purchaseRepository from '@/repositories/purchaseRepository';
import createHttpError from 'http-errors';

interface PurchaseCoursesParams {
  userId: number;
  courseIds: number[];
  paymentMethod?: string;
  paymentId?: string;
}

const purchaseService = {
  purchaseCourses: async (params: PurchaseCoursesParams) => {
    const { userId, courseIds, paymentMethod, paymentId } = params;

    // Check if courses exist and get their prices
    const courses = await courseRepository.findManyByIds(courseIds);

    if (courses.length !== courseIds.length) {
      const foundIds = courses.map(course => course.id);
      const notFoundIds = courseIds.filter(id => !foundIds.includes(id));
      throw createHttpError(
        404,
        `Courses not found: ${notFoundIds.join(', ')}`
      );
    }

    // Check if user has already purchased any of these courses
    const existingPurchases = await purchaseRepository.findUserPurchases(
      userId,
      courseIds
    );

    if (existingPurchases.length > 0) {
      const alreadyPurchasedIds = existingPurchases.map(p => p.courseId);
      throw createHttpError(
        400,
        `User has already purchased courses: ${alreadyPurchasedIds.join(', ')}`
      );
    }

    // Create purchase records for each course
    const purchases = await Promise.all(
      courses.map(course => {
        return purchaseRepository.createPurchase({
          userId,
          courseId: course.id,
          amount: course.price,
          paymentMethod,
          paymentId,
        });
      })
    );

    // Initialize course progress for each purchased course
    await Promise.all(
      courses.map(course => {
        return purchaseRepository.initializeCourseProgress(userId, course.id);
      })
    );

    return purchases;
  },
};

export default purchaseService;
