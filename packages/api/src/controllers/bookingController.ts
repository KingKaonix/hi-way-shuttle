import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { bookingService } from '../services/bookingService';

export const bookingController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const booking = await bookingService.create(req.userId!, req.body);
      res.status(201).json(booking);
    } catch (err) { next(err); }
  },

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const booking = await bookingService.cancel(req.userId!, id);
      res.json(booking);
    } catch (err) { next(err); }
  },

  async myBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const bookings = await bookingService.listByUser(req.userId!);
      res.json(bookings);
    } catch (err) { next(err); }
  },

  async allBookings(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const bookings = await bookingService.listAll();
      res.json(bookings);
    } catch (err) { next(err); }
  },
};
