export const authConfig = {
  jwt: {
    accessToken: {
      secret: process.env.JWT_ACCESS_SECRET || 'your-access-secret',
      expiresIn: '1m',
    },
    refreshToken: {
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      expiresIn: '7d',
    },
  },
  cookies: {
    refreshToken: {
      name: 'refreshToken',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/api/auth/refresh',
      },
    },
  },
};
