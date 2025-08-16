import { Router } from 'express';
import paymentController from '@/controllers/paymentController';
import { authenticateJWT } from '@/middlewares/auth';
import { verifyMonobankWebhook } from '@/middlewares/webhook';

const paymentRouter = Router();

// Створення платежу (потребує аутентифікації)
paymentRouter.post('/create', authenticateJWT, paymentController.createPayment);

paymentRouter.get(
  '/status/:invoiceId',
  authenticateJWT,
  paymentController.getPaymentStatus
);

// Webhook від Monobank (без аутентифікації)
paymentRouter.post(
  '/webhook',
  verifyMonobankWebhook,
  paymentController.webhook
);

export default paymentRouter;
