import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

const routes = [
  { id: 'rt-dw-01', name: 'Downtown Express', description: 'Express route through the downtown core', stops: JSON.stringify(['Central Station', 'Market Square', 'City Hall', 'Financial District'].map(s => ({ name: s }))) },
  { id: 'rt-ap-02', name: 'Airport Link', description: 'Direct connection between downtown and the airport', stops: JSON.stringify(['Central Station', 'Airport Terminal 1', 'Airport Terminal 2'].map(s => ({ name: s }))) },
  { id: 'rt-uv-03', name: 'University Shuttle', description: 'Scheduled service for university and tech park', stops: JSON.stringify(['Central Station', 'University Campus', 'Student Housing', 'Tech Park'].map(s => ({ name: s }))) },
];

const schedules = [
  { route_id: 'rt-dw-01', day_of_week: -1, departure: '07:00', arrival: '07:25' },
  { route_id: 'rt-dw-01', day_of_week: -1, departure: '08:00', arrival: '08:25' },
  { route_id: 'rt-dw-01', day_of_week: -1, departure: '09:00', arrival: '09:25' },
  { route_id: 'rt-dw-01', day_of_week: -1, departure: '12:00', arrival: '12:25' },
  { route_id: 'rt-dw-01', day_of_week: -1, departure: '14:00', arrival: '14:25' },
  { route_id: 'rt-dw-01', day_of_week: -1, departure: '16:00', arrival: '16:25' },
  { route_id: 'rt-dw-01', day_of_week: -1, departure: '17:30', arrival: '17:55' },
  { route_id: 'rt-dw-01', day_of_week: -1, departure: '19:00', arrival: '19:25' },
  { route_id: 'rt-ap-02', day_of_week: -1, departure: '06:00', arrival: '06:30' },
  { route_id: 'rt-ap-02', day_of_week: -1, departure: '07:30', arrival: '08:00' },
  { route_id: 'rt-ap-02', day_of_week: -1, departure: '09:00', arrival: '09:30' },
  { route_id: 'rt-ap-02', day_of_week: -1, departure: '11:00', arrival: '11:30' },
  { route_id: 'rt-ap-02', day_of_week: -1, departure: '13:00', arrival: '13:30' },
  { route_id: 'rt-ap-02', day_of_week: -1, departure: '15:00', arrival: '15:30' },
  { route_id: 'rt-ap-02', day_of_week: -1, departure: '17:00', arrival: '17:30' },
  { route_id: 'rt-ap-02', day_of_week: -1, departure: '19:00', arrival: '19:30' },
  { route_id: 'rt-ap-02', day_of_week: -1, departure: '21:00', arrival: '21:30' },
  { route_id: 'rt-uv-03', day_of_week: -1, departure: '07:30', arrival: '07:50' },
  { route_id: 'rt-uv-03', day_of_week: -1, departure: '08:30', arrival: '08:50' },
  { route_id: 'rt-uv-03', day_of_week: -1, departure: '10:00', arrival: '10:20' },
  { route_id: 'rt-uv-03', day_of_week: -1, departure: '12:30', arrival: '12:50' },
  { route_id: 'rt-uv-03', day_of_week: -1, departure: '14:30', arrival: '14:50' },
  { route_id: 'rt-uv-03', day_of_week: -1, departure: '16:30', arrival: '16:50' },
  { route_id: 'rt-uv-03', day_of_week: -1, departure: '18:00', arrival: '18:20' },
];

const fares = [
  { route_id: 'rt-dw-01', flat_fare: 5.00, per_stop_fare: 1.50, currency: 'USD' },
  { route_id: 'rt-ap-02', flat_fare: 8.00, per_stop_fare: 2.00, currency: 'USD' },
  { route_id: 'rt-uv-03', flat_fare: 4.00, per_stop_fare: 1.00, currency: 'USD' },
];

export async function seed(knex: Knex): Promise<void> {
  await knex('plugins').del();
  await knex('bookings').del();
  await knex('trips').del();
  await knex('schedules').del();
  await knex('fares').del();
  await knex('routes').del();
  await knex('driver_availability').del();
  await knex('vehicles').del();
  await knex('drivers').del();
  await knex('users').del();

  // Admin user
  const hash = await bcrypt.hash('admin123', 10);
  await knex('users').insert({
    email: 'admin@hiway.shuttle',
    name: 'Admin',
    password_hash: hash,
    role: 'admin',
  });

  await knex('routes').insert(routes.map(r => ({ ...r, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
  await knex('fares').insert(fares.map(f => ({ ...f, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
  await knex('schedules').insert(schedules.map(s => ({ ...s, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
}
