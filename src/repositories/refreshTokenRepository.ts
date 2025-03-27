import { PrismaClient, type RefreshToken } from '@prisma/client';

const prisma = new PrismaClient();

const refreshTokenRepository = {
  create: async (
    userId: number,
    token: string,
    expiresAt: Date
  ): Promise<RefreshToken> => {
    return prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  },

  findByToken: async (token: string): Promise<RefreshToken | null> => {
    return prisma.refreshToken.findUnique({
      where: { token },
    });
  },

  delete: async (id: number): Promise<void> => {
    await prisma.refreshToken.delete({
      where: { id },
    });
  },

  deleteAllForUser: async (userId: number): Promise<void> => {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  },
};

export default refreshTokenRepository;
