import express from 'express';
// import { authenticateJWT } from '@/middlewares/auth';
import userController from '@/controllers/userController';
import { authenticateJWT } from '@/middlewares/auth';

const userRouter = express.Router();

userRouter.get('/list', authenticateJWT, userController.getUsersList);
// Отримання профілю користувача
userRouter.get('/profile', authenticateJWT, userController.getProfile);

// Оновлення профілю користувача
userRouter.put('/profile', authenticateJWT, userController.updateProfile);

// Оновлення зображення профілю користувача
userRouter.put(
  '/profile/image',
  authenticateJWT,
  userController.updateProfileImage
);

export default userRouter;
