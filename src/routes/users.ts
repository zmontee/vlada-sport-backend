import express from 'express';
// import { authenticateJWT } from '@/middlewares/auth';
import userController from '@/controllers/userController';
import { authenticateJWT } from '@/middlewares/auth';

const userRouter = express.Router();

userRouter.get('/list', authenticateJWT, userController.getUsersList);
// userRouter.get('/profile', authenticateJWT, userController.getProfile);
// userRouter.put('/profile', authenticateJWT, userController.updateProfile);

export default userRouter;
