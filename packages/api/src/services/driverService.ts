import { driverRepo } from '../repositories/driverRepo';
import { userRepo } from '../repositories/userRepo';
import { AppError } from '../middleware/errorHandler';

export const driverService = {
  async register(userId: number, data: { license_number: string }) {
    const existing = await driverRepo.findByUserId(userId);
    if (existing) throw new AppError(409, 'Already registered as driver');
    return driverRepo.create({ user_id: userId, license_number: data.license_number });
  },

  async getProfile(userId: number) {
    const driver = await driverRepo.findByUserId(userId);
    if (!driver) throw new AppError(404, 'Driver profile not found');
    const vehicles = await driverRepo.findVehicles(driver.id);
    const availability = await driverRepo.getAvailability(driver.id);
    return { ...driver, vehicles, availability };
  },

  async updateLocation(driverId: number, lat: number, lng: number) {
    return driverRepo.update(driverId, { current_location_lat: lat, current_location_lng: lng });
  },

  async toggleOnline(driverId: number, online: boolean) {
    return driverRepo.update(driverId, { is_online: online });
  },

  async addVehicle(userId: number, data: any) {
    const driver = await driverRepo.findByUserId(userId);
    if (!driver) throw new AppError(404, 'Register as driver first');
    return driverRepo.addVehicle({ ...data, driver_id: driver.id });
  },

  async setAvailability(userId: number, slots: any[]) {
    const driver = await driverRepo.findByUserId(userId);
    if (!driver) throw new AppError(404, 'Register as driver first');
    return driverRepo.setAvailability(driver.id, slots);
  },

  async findAvailable(date: string, time: string) {
    return driverRepo.findAvailable(date, time);
  },
};
