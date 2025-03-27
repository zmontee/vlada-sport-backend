import type { NextFunction, Request, Response } from 'express';
import authService from '@/services/authService';
import { authConfig } from '@/utils/config/auth';
import createHttpError from 'http-errors';

const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData = req.body;
      const newUser = await authService.registerUser(userData);

      res.status(201).json({ message: 'Registration is successful', newUser });
    } catch (error) {
      next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, tokens } = await authService.loginUser(req.body);

      res.cookie(
        authConfig.cookies.refreshToken.name,
        tokens.refreshToken,
        authConfig.cookies.refreshToken.options
      );

      const { passwordHash, id, ...userInfo } = user;

      res.json({
        message: 'Login is successful',
        data: {
          user: userInfo,
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  googleAuth: async (req: Request, res: Response) => {
    // TODO: Implement this method
    throw new Error('Method not implemented');
  },

  facebookAuth: async (req: Request, res: Response) => {
    // TODO: Implement this method
    throw new Error('Method not implemented');
  },

  refreshTokens: async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('emmmm');

      const refreshToken = req.cookies[authConfig.cookies.refreshToken.name];

      console.log('refreshToken from cookies', refreshToken);

      if (!refreshToken) {
        throw createHttpError(401, 'Refresh token is missing');
      }

      const updatedTokens = await authService.refreshTokens(refreshToken);

      res.cookie(
        authConfig.cookies.refreshToken.name,
        updatedTokens.refreshToken,
        authConfig.cookies.refreshToken.options
      );

      res.json({
        status: 'success',
        data: { accessToken: updatedTokens.accessToken },
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies[authConfig.cookies.refreshToken.name];

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie(authConfig.cookies.refreshToken.name);

      res.json({ status: 'success', message: 'Logout is successful' });
    } catch (error) {
      next(error);
    }
  },
};

export default authController;
