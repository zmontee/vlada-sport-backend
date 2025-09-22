import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import userRepository from '@/repositories/userRepository';
import createHttpError from 'http-errors';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'zmontee@gmail.com',
    pass: process.env.EMAIL_PASS || 'rahq shmh opit kpvl',
  },
});

const passwordResetService = {
  requestPasswordReset: async (email: string, clientUrl: string) => {
    try {
      const user = await userRepository.findByEmail(email);

      if (!user) {
        return {
          message:
            'Якщо користувач з такою поштою існує, йому буде відправлено лист для відновлення паролю',
        };
      }

      const resetToken = jwt.sign(
        { userId: user.id, type: 'password-reset' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt,
        },
      });

      const resetUrl = `${clientUrl}/auth/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.EMAIL_USER || 'zabolotnavlada@gmail.com',
        to: user.email,
        subject: 'Відновлення паролю - Vlada Sport',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333; text-align: center;">Відновлення паролю</h2>
            <p>Привіт, ${user.name}!</p>
            <p>Ви запросили відновлення паролю для вашого акаунту.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007B5E; color: white; padding: 12px 25px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Відновити пароль
              </a>
            </div>
            <p><strong>Важливо:</strong> Це посилання дійсне протягом 1 години.</p>
            <p>Якщо ви не запросували відновлення паролю, проігноруйте цей лист.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              З повагою,<br>
              Команда Vlada Sport
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      return {
        message:
          'Якщо користувач з такою поштою існує, йому буде відправлено лист для відновлення паролю',
      };
    } catch (error) {
      console.error('Помилка при запиті відновлення паролю:', error);

      if (error instanceof Error && error.message.includes('SMTP')) {
        throw createHttpError(503, 'Помилка при відправці електронного листа');
      }

      throw createHttpError(
        500,
        'Внутрішня помилка сервера при обробці запиту на відновлення паролю'
      );
    }
  },

  verifyResetToken: async (token: string) => {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { userId: number; type: string };

      if (decoded.type !== 'password-reset') {
        throw createHttpError(400, 'Невірний тип токена');
      }

      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken) {
        throw createHttpError(400, 'Токен не знайдено');
      }

      if (resetToken.used) {
        throw createHttpError(400, 'Токен вже було використано');
      }

      if (new Date() > resetToken.expiresAt) {
        throw createHttpError(400, 'Термін дії токена минув');
      }

      return {
        valid: true,
        userId: resetToken.userId,
        userEmail: resetToken.user.email,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw createHttpError(400, 'Недійсний або пошкоджений токен');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw createHttpError(
          400,
          'Термін дії токена минув. Запросіть новий лист для відновлення паролю'
        );
      }

      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }

      console.error('Помилка при перевірці токена:', error);
      throw createHttpError(500, 'Внутрішня помилка при перевірці токена');
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    try {
      const tokenInfo = await passwordResetService.verifyResetToken(token);

      if (!tokenInfo.valid) {
        throw createHttpError(400, 'Невірний токен');
      }

      if (newPassword.length < 6) {
        throw createHttpError(400, 'Пароль має містити мінімум 6 символів');
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      const updatedUser = await userRepository.update(tokenInfo.userId, {
        passwordHash,
      });

      if (!updatedUser) {
        throw createHttpError(404, 'Користувача не знайдено');
      }

      await prisma.passwordResetToken.update({
        where: { token },
        data: { used: true },
      });

      await prisma.refreshToken.deleteMany({
        where: { userId: tokenInfo.userId },
      });

      return { message: 'Пароль успішно змінено. Увійдіть з новим паролем' };
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }

      console.error('Помилка при скиданні паролю:', error);

      if (error instanceof Error) {
        if (error.message.includes('User not found')) {
          throw createHttpError(404, 'Користувача не знайдено');
        }
        if (error.message.includes('hash')) {
          throw createHttpError(500, 'Помилка при шифруванні паролю');
        }
      }

      throw createHttpError(500, 'Внутрішня помилка сервера при зміні паролю');
    }
  },

  cleanupExpiredTokens: async () => {
    try {
      const deletedTokens = await prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return { deletedCount: deletedTokens.count };
    } catch (error) {
      console.error('Помилка при очистці токенів:', error);
      throw createHttpError(500, 'Помилка при очистці застарілих токенів');
    }
  },
};

export default passwordResetService;
