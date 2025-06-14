// export enum UserRole {
//   ADMIN = 'ADMIN',
//   USER = 'USER',
// }

import type { UserRole } from '@prisma/client';

export interface TokenPayload {
  userId: number;
  role: UserRole;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  name?: string;
  image_url?: string;
}

export interface LoginCredentialsDTO {
  email: string;
  password: string;
}

export interface RegisterCredentialsDTO extends LoginCredentialsDTO {
  name: string;
  surname: string;
  phoneNumber?: string;
  sex: string;
  birthDate: string;
  experience: string;
}
