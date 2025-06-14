import type { NextFunction, Request, Response } from 'express';
import authService from '@/services/authService';
import { authConfig } from '@/utils/config/auth';
import createHttpError from 'http-errors';

const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData = req.body;
      const { user, accessToken, refreshToken } =
        await authService.registerUser(userData);

      // Set refresh token in cookies
      res.cookie(
        authConfig.cookies.refreshToken.name,
        refreshToken,
        authConfig.cookies.refreshToken.options
      );

      res.status(201).json({
        user,
        accessToken,
      });
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
        user: userInfo,
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      next(error);
    }
  },

  getSessionInfo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.headers.authorization) {
        const sessionInfo = await authService.getSessionInfo(
          req.headers.authorization.split(' ')[1]
        );

        res.json(sessionInfo);
      } else {
        throw createHttpError(401, 'Authorization header is missing');
      }
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
      const refreshToken = req.cookies[authConfig.cookies.refreshToken.name];

      if (!refreshToken) {
        throw createHttpError(401, 'Refresh token is missing');
      }

      const updatedTokens = await authService.refreshTokens(refreshToken);

      res.cookie(
        authConfig.cookies.refreshToken.name,
        updatedTokens.refreshToken,
        authConfig.cookies.refreshToken.options
      );

      res.json({ accessToken: updatedTokens.accessToken });
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
