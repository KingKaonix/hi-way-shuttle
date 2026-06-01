import { Request, Response, NextFunction } from 'express';
import { routeService } from '../services/routeService';

export const routeController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const routes = await routeService.list();
      res.json(routes);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const route = await routeService.getById(id);
      res.json(route);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const route = await routeService.create(req.body);
      res.status(201).json(route);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const route = await routeService.update(id, req.body);
      res.json(route);
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await routeService.remove(id);
      res.json({ deleted: id });
    } catch (err) { next(err); }
  },
};
