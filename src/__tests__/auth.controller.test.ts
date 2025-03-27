import request from 'supertest';
import express from 'express';
import authRouter from '@/routes/auth';
import authService from '@/services/authService';
import { jest } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

jest.mock('@/services/authService');

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
      };
      (authService.registerUser as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
      });

      const response = await request(app)
        .post('/auth/register')
        .send(registerData);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 1, email: 'test@example.com' });
    });

    it('should return 400 if registration data is invalid', async () => {
      const registerData = { email: 'invalid-email', password: 'short' };

      const response = await request(app)
        .post('/auth/register')
        .send(registerData);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid registration data');
    });
  });

  describe('POST /auth/login', () => {
    it('should login a user with valid credentials', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      (authService.loginUser as jest.Mock).mockResolvedValue({
        token: 'valid_token',
      });

      const response = await request(app).post('/auth/login').send(loginData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ token: 'valid_token' });
    });

    it('should return 401 if credentials are invalid', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      (authService.loginUser as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      const response = await request(app).post('/auth/login').send(loginData);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  // describe('POST /auth/google', () => {
  //   it('should authenticate a user with Google', async () => {
  //     const googleData = { token: 'google_token' };
  //     (authService.googleAuth as jest.Mock).mockResolvedValue({
  //       token: 'valid_token',
  //     });
  //
  //     const response = await request(app).post('/auth/google').send(googleData);
  //     expect(response.status).toBe(200);
  //     expect(response.body).toEqual({ token: 'valid_token' });
  //   });
  //
  //   it('should return 401 if Google authentication fails', async () => {
  //     const googleData = { token: 'invalid_token' };
  //     (authService.googleAuth as jest.Mock).mockRejectedValue(
  //       new Error('Invalid Google token')
  //     );
  //
  //     const response = await request(app).post('/auth/google').send(googleData);
  //     expect(response.status).toBe(401);
  //     expect(response.body.message).toBe('Invalid Google token');
  //   });
  // });
  //
  // describe('POST /auth/facebook', () => {
  //   it('should authenticate a user with Facebook', async () => {
  //     const facebookData = { token: 'facebook_token' };
  //     (authService.facebookAuth as jest.Mock).mockResolvedValue({
  //       token: 'valid_token',
  //     });
  //
  //     const response = await request(app)
  //       .post('/auth/facebook')
  //       .send(facebookData);
  //     expect(response.status).toBe(200);
  //     expect(response.body).toEqual({ token: 'valid_token' });
  //   });
  //
  //   it('should return 401 if Facebook authentication fails', async () => {
  //     const facebookData = { token: 'invalid_token' };
  //     (authService.facebookAuth as jest.Mock).mockRejectedValue(
  //       new Error('Invalid Facebook token')
  //     );
  //
  //     const response = await request(app)
  //       .post('/auth/facebook')
  //       .send(facebookData);
  //     expect(response.status).toBe(401);
  //     expect(response.body.message).toBe('Invalid Facebook token');
  //   });
  // });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens', async () => {
      const refreshData = { token: 'refresh_token' };
      (authService.refreshTokens as jest.Mock).mockResolvedValue({
        token: 'new_token',
      });

      const response = await request(app)
        .post('/auth/refresh')
        .send(refreshData);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ token: 'new_token' });
    });

    it('should return 401 if refresh token is invalid', async () => {
      const refreshData = { token: 'invalid_token' };
      (authService.refreshTokens as jest.Mock).mockRejectedValue(
        new Error('Invalid refresh token')
      );

      const response = await request(app)
        .post('/auth/refresh')
        .send(refreshData);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid refresh token');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout a user', async () => {
      const response = await request(app).post('/auth/logout');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});
