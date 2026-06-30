import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'email' }),
  password: z.string().min(1, { message: 'required' })
});

export const registerSchema = z.object({
  role: z.enum(['dentist', 'lab'], { message: 'selectRole' }),
  full_name: z.string().min(1, { message: 'required' }),
  clinic_name: z.string().min(1, { message: 'required' }),
  email: z.string().email({ message: 'email' }),
  password: z.string().min(8, { message: 'minPassword' }),
  phone: z.string().optional(),
  city: z.string().optional()
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
