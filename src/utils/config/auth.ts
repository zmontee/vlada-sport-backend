export const authConfig = {
  jwt: {
    accessToken: {
      secret: process.env.JWT_ACCESS_SECRET || 'your-access-secret',
      expiresIn: '3h',
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
        // secure: process.env.NODE_ENV === 'production',
        secure: true,
        sameSite: 'none' as const,
        path: '/',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    },
  },
};
