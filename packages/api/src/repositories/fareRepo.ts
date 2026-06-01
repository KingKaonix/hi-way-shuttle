import db from '../db';

export const fareRepo = {
  async findAll(routeId?: string) {
    let query = db('fares').select('*');
    if (routeId) query = query.where({ route_id: routeId });
    return query;
  },

  async findByRoute(routeId: string) {
    return db('fares').where({ route_id: routeId, is_active: true }).first();
  },

  async upsert(routeId: string, data: { flat_fare: number; per_stop_fare?: number; currency?: string }) {
    const existing = await db('fares').where({ route_id: routeId }).first();
    if (existing) {
      await db('fares').where({ route_id: routeId }).update({ ...data, updated_at: new Date().toISOString() });
    } else {
      await db('fares').insert({ route_id: routeId, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    return this.findByRoute(routeId);
  },
};
