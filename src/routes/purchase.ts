import { Router } from 'express';
import purchaseController from '@/controllers/purchaseController';
import { authenticateJWT } from '@/middlewares/auth';

const purchaseRouter = Router();

// Protected route (requires authentication)
purchaseRouter.post('/', authenticateJWT, purchaseController.purchaseCourses);

export default purchaseRouter;
