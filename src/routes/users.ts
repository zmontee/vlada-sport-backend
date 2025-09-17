import express from 'express';
import userController from '@/controllers/userController';
import { authenticateJWT } from '@/middlewares/auth';
import { userImageUpload } from '@/utils/fileUpload';

const userRouter = express.Router();

userRouter.get('/list', authenticateJWT, userController.getUsersList);
userRouter.get('/profile', authenticateJWT, userController.getProfile);

userRouter.put('/profile', authenticateJWT, userController.updateProfile);

userRouter.put(
  '/profile/image',
  authenticateJWT,
  userImageUpload.single('image'),
  userController.updateProfileImage
);

export default userRouter;
