import { routeRepo } from '../repositories/routeRepo';
import { fareRepo } from '../repositories/fareRepo';
import { scheduleRepo } from '../repositories/scheduleRepo';
import { AppError } from '../middleware/errorHandler';

export const routeService = {
  async list() {
    const routes = await routeRepo.findAll(true);
    const result = [];
    for (const route of routes) {
      const fare = await fareRepo.findByRoute(route.id);
      const schedules = await scheduleRepo.findByRoute(route.id);
      result.push({ ...route, fare, schedules });
    }
    return result;
  },

  async getById(id: string) {
    const route = await routeRepo.findById(id);
    if (!route) throw new AppError(404, 'Route not found');
    const fare = await fareRepo.findByRoute(id);
    const schedules = await scheduleRepo.findByRoute(id);
    return { ...route, fare, schedules };
  },

  async create(data: { id: string; name: string; description: string; stops: any[] }) {
    const existing = await routeRepo.findById(data.id);
    if (existing) throw new AppError(409, 'Route ID already exists');
    return routeRepo.create({ ...data, stops: JSON.stringify(data.stops) });
  },

  async update(id: string, data: any) {
    const existing = await routeRepo.findById(id);
    if (!existing) throw new AppError(404, 'Route not found');
    return routeRepo.update(id, data);
  },

  async remove(id: string) {
    const existing = await routeRepo.findById(id);
    if (!existing) throw new AppError(404, 'Route not found');
    await routeRepo.remove(id);
  },
};
