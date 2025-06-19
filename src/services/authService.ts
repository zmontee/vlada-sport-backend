import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { User } from '@prisma/client';
import type {
  LoginCredentialsDTO,
  RegisterCredentialsDTO,
  TokenPayload,
  Tokens,
} from '@/types/auth';
import { RegisterSchema } from '@/utils/validation';
import userRepository from '@/repositories/userRepository';
import { UserRole } from '@/types/user';
import createHttpError from 'http-errors';
import { authConfig } from '@/utils/config/auth';
import refreshTokenRepository from '@/repositories/refreshTokenRepository';
import purchaseRepository from '@/repositories/purchaseRepository';

const authService = {
  registerUser: async (
    registerData: RegisterCredentialsDTO
  ): Promise<{
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
  }> => {
    try {
      const validatedData = RegisterSchema.parse(registerData);

      const existingUser = await userRepository.findByEmail(
        validatedData.email
      );
      if (existingUser) {
        throw createHttpError(409, 'User with this email already exists');
      }

      // if (validatedData.phoneNumber) {
      //   const phoneRegex = /^\+?[\d\s-]{10,}$/;
      //   if (!phoneRegex.test(validatedData.phoneNumber)) {
      //     throw createHttpError(400, 'Phone number validation error');
      //   }
      // }

      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      const newUser = await userRepository.create({
        email: validatedData.email,
        passwordHash: hashedPassword,
        name: validatedData.name,
        surname: validatedData.surname,
        sex: validatedData.sex,
        birthDate: validatedData.birthDate,
        experience: validatedData.experience,
        role: UserRole.USER,
      });

      // Generate tokens for the newly registered user
      const tokens = await authService.generateTokens({
        userId: newUser.id,
        role: newUser.role,
      });

      // Store refresh token in the database
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await refreshTokenRepository.create(
        newUser.id,
        tokens.refreshToken,
        expiresAt
      );

      // Remove sensitive data before returning
      const { passwordHash, ...userInfo } = newUser;

      return {
        user: userInfo,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  loginUser: async (
    credentials: LoginCredentialsDTO
  ): Promise<{ user: User; tokens: Tokens }> => {
    const user = await userRepository.findByEmail(credentials.email);

    if (!user) {
      throw createHttpError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw createHttpError(401, 'Invalid email or password');
    }

    const tokens = await authService.generateTokens({
      userId: user.id,
      role: user.role,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.create(
      user.id,
      tokens.refreshToken,
      expiresAt
    );

    return { user, tokens };
  },

  generateTokens: async (payload: TokenPayload) => {
    const accessToken = jwt.sign(payload, authConfig.jwt.accessToken.secret, {
      expiresIn: authConfig.jwt.accessToken
        .expiresIn as SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, authConfig.jwt.refreshToken.secret, {
      expiresIn: authConfig.jwt.refreshToken
        .expiresIn as SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  },

  refreshTokens: async (oldRefreshToken: string): Promise<Tokens> => {
    try {
      const decoded = jwt.verify(
        oldRefreshToken,
        authConfig.jwt.refreshToken.secret
      ) as TokenPayload & { exp: number };

      const tokenDoc =
        await refreshTokenRepository.findByToken(oldRefreshToken);
      if (!tokenDoc) {
        throw createHttpError(401, 'Invalid refresh token');
      }

      if (decoded.exp * 1000 < Date.now()) {
        throw createHttpError(401, 'Refresh token expired');
      }

      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw createHttpError(404, 'User not found');
      }

      const tokens = await authService.generateTokens({
        userId: user.id,
        role: user.role,
      });

      // Оновлюємо refresh token в БД
      await refreshTokenRepository.delete(tokenDoc.id);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await refreshTokenRepository.create(
        user.id,
        tokens.refreshToken,
        expiresAt
      );

      return tokens;
    } catch (error) {
      console.error('Refresh token error:', error);

      if (error instanceof jwt.JsonWebTokenError) {
        throw createHttpError(401, 'Invalid refresh token');
      }

      throw error;
    }
  },

  getSessionInfo: async (accessToken: string) => {
    try {
      const decoded = jwt.verify(
        accessToken,
        authConfig.jwt.accessToken.secret
      ) as TokenPayload;

      const user = await userRepository.findById(decoded.userId);

      return user;
    } catch (error) {
      console.error('Get session info error:', error);

      if (error instanceof jwt.JsonWebTokenError) {
        throw createHttpError(401, 'Invalid access token');
      }

      throw error;
    }
  },

  logout: async (refreshToken: string) => {
    const tokenDoc = await refreshTokenRepository.findByToken(refreshToken);
    if (tokenDoc) {
      await refreshTokenRepository.delete(tokenDoc.id);
    }
  },

  getUserPurchasedCourses: async (userId: number) => {
    return purchaseRepository.findUserPurchasedCourses(userId);
  },

  // verifyToken: async (token: string): Promise<TokenPayload> => {
  //   // TODO: Implement this method
  //   throw new Error('Method not implemented');
  // },
  //
  // revokeRefreshToken: async (refreshToken: string): Promise<void> => {
  //   // TODO: Implement this method
  //   throw new Error('Method not implemented');
  // },
};

export default authService;
