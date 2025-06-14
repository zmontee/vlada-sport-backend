import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Некоректна електронна пошта'),
  password: z
    .string()
    .min(8, 'Пароль має бути не менше 8 символів')
    .max(64, 'Пароль не може бути більше 64 символів'),
  name: z.string(),
  surname: z.string(),
  // phoneNumber: z.string(),
  sex: z.enum(['MALE', 'FEMALE']),
  birthDate: z.string(),
  experience: z.string(),
});
