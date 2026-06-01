import db from '../db';

export const routeRepo = {
  async findAll(activeOnly = true) {
    let query = db('routes').select('*').orderBy('created_at');
    if (activeOnly) query = query.where({ is_active: true });
    const rows = await query;
    return rows.map(r => ({ ...r, stops: JSON.parse(r.stops) }));
  },

  async findById(id: string) {
    const route = await db('routes').where({ id }).first();
    if (!route) return undefined;
    return { ...route, stops: JSON.parse(route.stops) };
  },

  async create(data: { id: string; name: string; description: string; stops: string }) {
    await db('routes').insert({ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return this.findById(data.id);
  },

  async update(id: string, data: any) {
    const stops = data.stops ? JSON.stringify(data.stops) : undefined;
    await db('routes').where({ id }).update({ ...data, stops, updated_at: new Date().toISOString() });
    return this.findById(id);
  },

  async remove(id: string) {
    await db('routes').where({ id }).del();
  },
};
