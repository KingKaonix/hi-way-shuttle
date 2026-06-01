import db from '../db';

export const bookingRepo = {
  async findByUser(userId: number) {
    return db('bookings').where({ user_id: userId }).orderBy('created_at', 'desc');
  },

  async findById(id: number) {
    return db('bookings').where({ id }).first();
  },

  async create(data: any) {
    const [id] = await db('bookings').insert({ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return this.findById(id);
  },

  async cancel(id: number) {
    await db('bookings').where({ id }).update({ status: 'canceled', updated_at: new Date().toISOString() });
    return this.findById(id);
  },

  async findAll() {
    return db('bookings').orderBy('created_at', 'desc');
  },
};
