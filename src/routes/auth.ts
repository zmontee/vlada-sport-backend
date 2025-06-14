import { Router } from 'express';
// import { validateLogin } from '@/middlewares/validation';
import authController from '@/controllers/authController';
import { authenticateJWT } from '@/middlewares/auth';

const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/refresh', authController.refreshTokens);
authRouter.post('/logout', authController.logout);
authRouter.get('/session', authenticateJWT, authController.getSessionInfo);
// authRouter.post('/google', authController.googleAuth);
// authRouter.post('/facebook', authController.facebookAuth);

export default authRouter;
