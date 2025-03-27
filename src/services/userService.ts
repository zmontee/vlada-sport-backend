import type { User } from '@prisma/client';
import type { CreateUserDTO } from '@/types/user';
import userRepository from '@/repositories/userRepository';
import createHttpError from 'http-errors';

const userService = {
  getUsers: async (): Promise<User[]> => {
    try {
      const usersList = await userRepository.findAll();

      if (!usersList) {
        throw createHttpError(404, 'No users found');
      }

      return usersList;
    } catch (error) {
      throw error;
    }
  },

  getUserById: async (id: string): Promise<User | null> => {
    // TODO: Implement this method
    throw new Error('Method not implemented');
  },

  updateUser: async (
    id: string,
    userData: Partial<CreateUserDTO>
  ): Promise<User> => {
    // TODO: Implement this method
    throw new Error('Method not implemented');
  },

  deleteUser: async (id: string): Promise<void> => {
    // TODO: Implement
    throw new Error('Not implemented');
  },
};

export default userService;
