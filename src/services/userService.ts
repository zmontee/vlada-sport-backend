import type { User } from '@prisma/client';
import type { UpdateUserDTO, UpdateUserImageDTO } from '@/types/user';
import userRepository from '@/repositories/userRepository';
import createHttpError from 'http-errors';

const userService = {
  getUsers: async (): Promise<User[]> => {
    const usersList = await userRepository.findAll();

    if (!usersList) {
      throw createHttpError(404, 'No users found');
    }

    return usersList;
  },

  getUserById: async (id: number): Promise<User | null> => {
    try {
      const user = await userRepository.findById(id);

      if (!user) {
        throw createHttpError(404, 'User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (id: number, userData: UpdateUserDTO): Promise<User> => {
    try {
      const existingUser = await userRepository.findById(id);

      if (!existingUser) {
        throw createHttpError(404, 'User not found');
      }

      // Оновимо дані користувача
      const updatedUser = await userRepository.update(id, userData);

      return updatedUser;
    } catch (error) {
      throw error;
    }
  },

  updateUserImage: async (
    id: number,
    imageData: UpdateUserImageDTO
  ): Promise<User> => {
    try {
      // Перевіримо чи існує користувач
      const existingUser = await userRepository.findById(id);

      if (!existingUser) {
        throw createHttpError(404, 'User not found');
      }

      // Оновимо зображення користувача
      const updatedUser = await userRepository.updateImage(
        id,
        imageData.imageUrl
      );

      return updatedUser;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    // TODO: Implement
    throw new Error('Not implemented');
  },
};

export default userService;
