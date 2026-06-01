import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { authService } from '../services/authService';

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      res.json(result);
    } catch (err) { next(err); }
  },

  async profile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.userId!);
      res.json(user);
    } catch (err) { next(err); }
  },
};
