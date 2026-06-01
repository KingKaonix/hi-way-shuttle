import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userRepo } from '../repositories/userRepo';
import { AppError } from '../middleware/errorHandler';

export const authService = {
  async register(data: { email: string; name: string; password: string; phone?: string }) {
    const existing = await userRepo.findByEmail(data.email);
    if (existing) throw new AppError(409, 'Email already registered');

    const password_hash = await bcrypt.hash(data.password, 10);
    const user = await userRepo.create({
      email: data.email,
      name: data.name,
      password_hash,
      phone: data.phone,
    });
    const token = this.generateToken(user);
    return { user, token };
  },

  async login(email: string, password: string) {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new AppError(401, 'Invalid email or password');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new AppError(401, 'Invalid email or password');

    const { password_hash, ...safe } = user;
    const token = this.generateToken(safe);
    return { user: safe, token };
  },

  generateToken(user: { id: number; role: string }) {
    return jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as any);
  },

  async getProfile(userId: number) {
    const user = await userRepo.findById(userId);
    if (!user) throw new AppError(404, 'User not found');
    return user;
  },
};
