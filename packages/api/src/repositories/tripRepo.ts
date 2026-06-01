import db from '../db';

export const tripRepo = {
  async findByRouteAndDate(routeId: string, date: string) {
    return db('trips').where({ route_id: routeId, date }).orderBy('departure_time');
  },

  async findByDate(date: string) {
    return db('trips')
      .select('trips.*', 'routes.name as route_name')
      .join('routes', 'trips.route_id', 'routes.id')
      .where('trips.date', date)
      .orderBy('trips.departure_time');
  },

  async findById(id: number) {
    return db('trips').where({ id }).first();
  },

  async create(data: any) {
    const [id] = await db('trips').insert({ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return this.findById(id);
  },

  async updateCapacity(tripId: number, delta: number) {
    const trip = await this.findById(tripId);
    if (!trip) throw new Error('Trip not found');
    const available = trip.capacity_available - delta;
    if (available < 0) throw new Error('No capacity available');
    await db('trips').where({ id: tripId }).update({ capacity_available: available, updated_at: new Date().toISOString() });
    return { ...trip, capacity_available: available };
  },

  async generateFromSchedule(date: string) {
    const dayOfWeek = new Date(date).getDay();
    const schedules = await db('schedules').where(function () {
      this.where({ day_of_week: dayOfWeek }).orWhere({ day_of_week: -1 });
    }).where({ is_active: true });

    const routes = await db('routes').select('id').where({ is_active: true });
    const vehicleCap = 20; // default capacity

    for (const sched of schedules) {
      const existing = await db('trips')
        .where({ route_id: sched.route_id, date, departure_time: sched.departure })
        .first();
      if (!existing) {
        await db('trips').insert({
          route_id: sched.route_id,
          date,
          departure_time: sched.departure,
          arrival_time: sched.arrival,
          capacity_total: vehicleCap,
          capacity_available: vehicleCap,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  },
};
