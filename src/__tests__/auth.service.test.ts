import type { NextFunction, Request, Response } from 'express';
import userRepository from '@/repositories/userRepository';
import authService from '@/services/authService';
import { authenticateJWT } from '@/middlewares/auth';

jest.mock('../repositories/userRepository');
jest.mock('../services/authService');

jest.mock('@/services/authService');

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      cookies: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {},
    };
    next = jest.fn();
  });

  it('should return 401 if no token is provided', async () => {
    await authenticateJWT(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Access token required' });
  });

  it('should return 401 if token is invalid', async () => {
    req.cookies['access_token'] = 'invalid_token';
    (authService.verifyToken as jest.Mock).mockRejectedValue(
      new Error('Invalid token')
    );

    await authenticateJWT(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
  });

  it('should call next if token is valid', async () => {
    req.cookies['access_token'] = 'valid_token';
    (authService.verifyToken as jest.Mock).mockResolvedValue({ userId: 1 });

    await authenticateJWT(req as Request, res as Response, next);
    expect(res.locals?.payload).toEqual({ userId: 1 });
    expect(next).toHaveBeenCalled();
  });
});

describe('User Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user', async () => {
    (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (userRepository.create as jest.Mock).mockResolvedValue({
      email: 'newuser@example.com',
      passwordHash: 'strongPassword',
      name: 'John',
      surname: 'Doe',
      sex: 'male',
      birthDate: '1990-01-01',
    });
    (authService.generateTokens as jest.Mock).mockResolvedValue({
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
    });

    const registeredUser = await userRepository.create(userData);

    expect(registeredUser).toBeDefined();
    expect(registeredUser.email).toBe(userData.email);
    expect(registeredUser.name).toBe(userData.name);
  });
});
