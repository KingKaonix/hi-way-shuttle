import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { driverService } from '../services/driverService';

export const driverController = {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const driver = await driverService.register(req.userId!, req.body);
      res.status(201).json(driver);
    } catch (err) { next(err); }
  },

  async profile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await driverService.getProfile(req.userId!);
      res.json(profile);
    } catch (err) { next(err); }
  },

  async updateLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const driver = await driverService.updateLocation(id, req.body.lat, req.body.lng);
      res.json(driver);
    } catch (err) { next(err); }
  },

  async toggleOnline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string, 10);
      const driver = await driverService.toggleOnline(id, req.body.online);
      res.json(driver);
    } catch (err) { next(err); }
  },

  async addVehicle(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await driverService.addVehicle(req.userId!, req.body);
      res.status(201).json(vehicle);
    } catch (err) { next(err); }
  },

  async setAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const availability = await driverService.setAvailability(req.userId!, req.body);
      res.json(availability);
    } catch (err) { next(err); }
  },

  async findAvailable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { date, time } = req.query as { date: string; time: string };
      const drivers = await driverService.findAvailable(date, time);
      res.json(drivers);
    } catch (err) { next(err); }
  },
};
