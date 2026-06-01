import db from '../db';

export const driverRepo = {
  async findByUserId(userId: number) {
    return db('drivers').where({ user_id: userId }).first();
  },

  async findById(id: number) {
    return db('drivers').where({ id }).first();
  },

  async create(data: any) {
    const [id] = await db('drivers').insert({ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return this.findById(id);
  },

  async update(id: number, data: any) {
    await db('drivers').where({ id }).update({ ...data, updated_at: new Date().toISOString() });
    return this.findById(id);
  },

  async findAvailable(date: string, time: string) {
    const dayOfWeek = new Date(date).getDay();
    return db('drivers')
      .join('driver_availability', 'drivers.id', 'driver_availability.driver_id')
      .join('users', 'drivers.user_id', 'users.id')
      .where('drivers.is_online', true)
      .where('driver_availability.day_of_week', dayOfWeek)
      .where('driver_availability.start_time', '<=', time)
      .where('driver_availability.end_time', '>=', time)
      .where('driver_availability.is_active', true)
      .select('drivers.*', 'users.name');
  },

  // Vehicles
  async findVehicles(driverId: number) {
    return db('vehicles').where({ driver_id: driverId, is_active: true });
  },

  async addVehicle(data: any) {
    const [id] = await db('vehicles').insert({ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return db('vehicles').where({ id }).first();
  },

  // Availability
  async setAvailability(driverId: number, slots: { day_of_week: number; start_time: string; end_time: string }[]) {
    await db('driver_availability').where({ driver_id: driverId }).del();
    if (slots.length > 0) {
      const now = new Date().toISOString();
      await db('driver_availability').insert(slots.map(s => ({ ...s, driver_id: driverId, created_at: now, updated_at: now })));
    }
    return db('driver_availability').where({ driver_id: driverId });
  },

  async getAvailability(driverId: number) {
    return db('driver_availability').where({ driver_id: driverId, is_active: true });
  },
};
