import db from '../db';

export const scheduleRepo = {
  async findByRoute(routeId: string) {
    return db('schedules').where({ route_id: routeId, is_active: true }).orderBy('departure');
  },

  async findByDay(dayOfWeek: number) {
    return db('schedules').where(function () {
      this.where({ day_of_week: dayOfWeek }).orWhere({ day_of_week: -1 });
    }).where({ is_active: true }).orderBy('departure');
  },

  async bulkSet(routeId: string, slots: { departure: string; arrival: string; day_of_week?: number }[]) {
    await db('schedules').where({ route_id: routeId }).del();
    if (slots.length > 0) {
      const now = new Date().toISOString();
      await db('schedules').insert(slots.map(s => ({
        route_id: routeId,
        day_of_week: s.day_of_week ?? -1,
        departure: s.departure,
        arrival: s.arrival,
        created_at: now,
        updated_at: now,
      })));
    }
    return this.findByRoute(routeId);
  },
};
