export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  passwordHash?: string; // Optional because OAuth users don't have passwords
  phone_number?: string;
  sex: string;
  birthDate: string;
  experience?: string;
  weight?: number;
  imageUrl?: string;
}

export interface CreateUserDTO {
  email: string;
  passwordHash: string; // Optional because OAuth users don't have passwords
  name?: string;
  surname?: string;
  phoneNumber?: string;
  sex: string;
  birthDate?: string;
  experience?: string;
  weight?: number;
  role: UserRole;
  imageUrl?: string;
}
