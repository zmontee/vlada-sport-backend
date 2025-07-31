import { type User, type Prisma, PrismaClient } from '@prisma/client';
import type { CreateUserDTO } from '@/types/user';

const prisma = new PrismaClient();

const userRepository = {
  findAll: async (): Promise<User[]> => {
    return prisma.user.findMany();
  },

  findById: async (id: number): Promise<User | null> => {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail: async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({ where: { email } });
  },

  create: async (data: CreateUserDTO): Promise<User> => {
    return prisma.user.create({ data });
  },

  update: async (id: number, data: Prisma.UserUpdateInput): Promise<User> => {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  updateImage: async (id: number, imageUrl: string): Promise<User> => {
    return prisma.user.update({
      where: { id },
      data: { imageUrl },
    });
  },

  delete: async (id: number): Promise<void> => {
    // TODO: Implement
    throw new Error('Not implemented');
  },

  deleteAll: async (): Promise<void> => {
    // TODO: Implement
    throw new Error('Not implemented');
  },
};

export default userRepository;
