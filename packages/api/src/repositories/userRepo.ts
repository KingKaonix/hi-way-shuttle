import db from '../db';
import type { User, UserPublic } from '@hi-way/shared';

export const userRepo = {
  async findByEmail(email: string): Promise<User | undefined> {
    return db('users').where({ email }).first();
  },

  async findById(id: number): Promise<UserPublic | undefined> {
    return db('users')
      .select('id', 'email', 'name', 'role', 'phone', 'avatar_url', 'created_at')
      .where({ id })
      .first();
  },

  async create(data: { email: string; name: string; password_hash: string; role?: string; phone?: string }): Promise<UserPublic> {
    const [id] = await db('users').insert(data);
    return this.findById(id) as Promise<UserPublic>;
  },

  async update(id: number, data: Partial<User>): Promise<void> {
    await db('users').where({ id }).update({ ...data, updated_at: new Date().toISOString() });
  },

  async list(): Promise<UserPublic[]> {
    return db('users').select('id', 'email', 'name', 'role', 'phone', 'avatar_url', 'created_at');
  },
};
