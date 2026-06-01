import { tripRepo } from '../repositories/tripRepo';
import { AppError } from '../middleware/errorHandler';

export const tripService = {
  async listByDate(date: string) {
    return tripRepo.findByDate(date);
  },

  async listByRouteAndDate(routeId: string, date: string) {
    return tripRepo.findByRouteAndDate(routeId, date);
  },

  async getById(id: number) {
    const trip = await tripRepo.findById(id);
    if (!trip) throw new AppError(404, 'Trip not found');
    return trip;
  },

  async generateForDate(date: string) {
    await tripRepo.generateFromSchedule(date);
    return this.listByDate(date);
  },
};
