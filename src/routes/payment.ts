import express, { Router } from 'express';
import paymentController from '@/controllers/paymentController';
import { authenticateJWT } from '@/middlewares/auth';
import { verifyMonobankWebhookSimple } from '@/middlewares/webhook';

const paymentRouter = Router();

paymentRouter.post(
  '/create',
  express.json(),
  authenticateJWT,
  paymentController.createPayment
);

paymentRouter.post(
  '/test-assign',
  express.json(),
  authenticateJWT,
  paymentController.assignCoursesTest
);

paymentRouter.get(
  '/status/:invoiceId',
  express.json(),
  authenticateJWT,
  paymentController.getPaymentStatus
);

paymentRouter.post(
  '/webhook',
  // express.raw({ type: 'application/json' }),
  express.text({ type: 'application/json' }),
  verifyMonobankWebhookSimple,
  paymentController.webhook
);

export default paymentRouter;
