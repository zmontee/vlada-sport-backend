import type { NextFunction, Request, Response } from 'express';
import monobankService from '@/services/monobankService';
import createHttpError from 'http-errors';

// Middleware для збереження raw body
export const rawBodyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.path === '/api/payments/webhook') {
    let data = '';

    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
    });

    req.on('end', () => {
      req.rawBody = data;

      // Парсимо JSON для req.body
      try {
        req.body = JSON.parse(data);
      } catch (error) {
        console.error('Failed to parse webhook JSON:', error);
        return res.status(400).json({ error: 'Invalid JSON' });
      }

      next();
    });
  } else {
    next();
  }
};

// Middleware для верифікації підпису Monobank webhook
export const verifyMonobankWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const xSign = req.headers['x-sign'] as string;
    const rawBody = req.rawBody;

    if (!xSign) {
      console.error('Missing X-Sign header in webhook');
      throw createHttpError(400, 'Missing X-Sign header');
    }

    if (!rawBody) {
      console.error('Missing raw body for signature verification');
      throw createHttpError(400, 'Missing request body');
    }

    // Логуємо для дебагу
    console.log('Webhook signature verification:');
    console.log('X-Sign header:', xSign);
    console.log('Raw body length:', rawBody.length);

    // Верифікуємо підпис
    const isValidSignature = await monobankService.verifyWebhookSignature(
      rawBody,
      xSign
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      throw createHttpError(401, 'Invalid webhook signature');
    }

    console.log('Webhook signature verified successfully');
    next();
  } catch (error) {
    console.error('Webhook verification error:', error);

    if (error instanceof Error && 'status' in error) {
      res.status((error as any).status || 500).json({
        error: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Webhook verification failed',
      });
    }
  }
};

// Розширюємо типи Express для rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
    }
  }
}
