import { Request, Response, NextFunction } from 'express';
import { tripService } from '../services/tripService';

export const tripController = {
  async listByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const trips = await tripService.listByDate(date);
      res.json(trips);
    } catch (err) { next(err); }
  },

  async listByRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const routeId = req.params.routeId as string;
      const trips = await tripService.listByRouteAndDate(routeId, date);
      res.json(trips);
    } catch (err) { next(err); }
  },

  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.body.date || new Date().toISOString().split('T')[0];
      const trips = await tripService.generateForDate(date);
      res.json(trips);
    } catch (err) { next(err); }
  },
};
