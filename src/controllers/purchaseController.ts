import type { NextFunction, Request, Response } from 'express';
import purchaseService from '@/services/purchaseService';
import createHttpError from 'http-errors';

interface PurchaseCoursesRequest {
  courseIds: number[];
  paymentMethod?: string;
  paymentId?: string;
}

const purchaseController = {
  purchaseCourses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      const { courseIds, paymentMethod, paymentId } =
        req.body as PurchaseCoursesRequest;

      if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
        throw createHttpError(400, 'Valid course IDs array is required');
      }

      const purchases = await purchaseService.purchaseCourses({
        userId,
        courseIds,
        paymentMethod,
        paymentId,
      });

      res.status(201).json({
        status: 'success',
        message: 'Courses purchased successfully',
        data: purchases,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default purchaseController;
