import type { NextFunction, Request, Response } from 'express';
import purchaseService from '@/services/purchaseService';
import createHttpError from 'http-errors';

interface CreatePaymentRequest {
  courseIds: number[];
}

const paymentController = {
  createPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      const { courseIds } = req.body as CreatePaymentRequest;

      if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
        throw createHttpError(400, 'Valid course IDs array is required');
      }

      const payment = await purchaseService.createPayment({
        userId,
        courseIds,
      });

      res.status(201).json({
        status: 'success',
        message: 'Payment created successfully',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  getPaymentStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const { invoiceId } = req.params;

      if (!userId) {
        throw createHttpError(401, 'User not authenticated');
      }

      if (!invoiceId) {
        throw createHttpError(400, 'Invoice ID is required');
      }

      const paymentStatus = await purchaseService.getPaymentStatus(
        invoiceId,
        userId
      );

      res.status(200).json({
        status: 'success',
        message: 'Payment status retrieved successfully',
        data: paymentStatus,
      });
    } catch (error) {
      next(error);
    }
  },

  webhook: async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('=== Monobank Webhook Received ===');
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('Raw body:', req.rawBody);

      const { invoiceId, status } = req.body;

      if (!invoiceId) {
        throw createHttpError(400, 'Missing invoiceId in webhook data');
      }

      const result = await purchaseService.processWebhook(req.body);

      console.log(
        `Webhook processed successfully for invoice ${invoiceId}, status: ${status}`
      );

      res.status(200).json({
        status: 'success',
        message: 'Webhook processed successfully',
        data: result,
      });
    } catch (error) {
      console.error('Webhook processing error:', error);

      res.status(200).json({
        status: 'error',
        message: 'Webhook processing failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};

export default paymentController;
