import type { NextFunction, Request, Response } from 'express';
import userService from '@/services/userService';

const usersController = {
  getProfile: async (req: Request, res: Response) => {
    // TODO: Implement
    console.log('not implemented');
    throw new Error('Not implemented');
  },

  getUsersList: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const usersList = await userService.getUsers();

      res.status(200).json(usersList);
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    // TODO: Implement
    throw new Error('Not implemented');
  },
};

export default usersController;
