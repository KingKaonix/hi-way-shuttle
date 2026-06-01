import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Users
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).unique().notNullable();
    table.string('name', 100).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('role', 20).notNullable().defaultTo('rider');
    table.string('phone', 30);
    table.string('avatar_url', 500);
    table.timestamps(true, true);
  });

  // Drivers
  await knex.schema.createTable('drivers', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('license_number', 100);
    table.decimal('rating', 3, 2).defaultTo(0);
    table.integer('total_trips').defaultTo(0);
    table.boolean('is_online').defaultTo(false);
    table.decimal('current_location_lat', 10, 7);
    table.decimal('current_location_lng', 10, 7);
    table.timestamps(true, true);
  });

  // Vehicles
  await knex.schema.createTable('vehicles', (table) => {
    table.increments('id').primary();
    table.integer('driver_id').unsigned().references('id').inTable('drivers').onDelete('CASCADE');
    table.string('make', 100).notNullable();
    table.string('model', 100).notNullable();
    table.integer('year').notNullable();
    table.string('color', 50).notNullable();
    table.string('license_plate', 30).notNullable();
    table.integer('capacity').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Driver availability windows
  await knex.schema.createTable('driver_availability', (table) => {
    table.increments('id').primary();
    table.integer('driver_id').unsigned().references('id').inTable('drivers').onDelete('CASCADE');
    table.integer('day_of_week').notNullable(); // 0-6
    table.string('start_time', 5).notNullable();
    table.string('end_time', 5).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Routes
  await knex.schema.createTable('routes', (table) => {
    table.string('id', 20).primary();
    table.string('name', 100).notNullable();
    table.text('description').notNullable();
    table.text('stops').notNullable(); // JSON array of stops
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Fares
  await knex.schema.createTable('fares', (table) => {
    table.increments('id').primary();
    table.string('route_id', 20).references('id').inTable('routes').onDelete('CASCADE');
    table.decimal('flat_fare', 10, 2).notNullable();
    table.decimal('per_stop_fare', 10, 2).defaultTo(0);
    table.string('currency', 3).defaultTo('USD');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Schedules (recurring)
  await knex.schema.createTable('schedules', (table) => {
    table.increments('id').primary();
    table.string('route_id', 20).references('id').inTable('routes').onDelete('CASCADE');
    table.integer('day_of_week').defaultTo(-1); // -1 = daily, 0-6 = specific day
    table.string('departure', 5).notNullable();
    table.string('arrival', 5).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Trips (instances of routes on specific dates)
  await knex.schema.createTable('trips', (table) => {
    table.increments('id').primary();
    table.string('route_id', 20).references('id').inTable('routes');
    table.integer('driver_id').unsigned().references('id').inTable('drivers');
    table.integer('vehicle_id').unsigned().references('id').inTable('vehicles');
    table.string('date', 10).notNullable();
    table.string('departure_time', 5).notNullable();
    table.string('arrival_time', 5).notNullable();
    table.integer('capacity_total').notNullable();
    table.integer('capacity_available').notNullable();
    table.string('status', 20).defaultTo('scheduled');
    table.text('notes');
    table.timestamps(true, true);
  });

  // Bookings
  await knex.schema.createTable('bookings', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('trip_id').unsigned().references('id').inTable('trips');
    table.string('route_id', 20);
    table.string('route_name', 100);
    table.string('departure', 100);
    table.string('arrival', 100);
    table.integer('seats').defaultTo(1);
    table.decimal('fare_amount', 10, 2);
    table.string('currency', 3).defaultTo('USD');
    table.string('status', 20).defaultTo('confirmed');
    table.timestamps(true, true);
  });

  // Plugins registry
  await knex.schema.createTable('plugins', (table) => {
    table.increments('id').primary();
    table.string('name', 100).unique().notNullable();
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.string('version', 20);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('plugins');
  await knex.schema.dropTableIfExists('bookings');
  await knex.schema.dropTableIfExists('trips');
  await knex.schema.dropTableIfExists('schedules');
  await knex.schema.dropTableIfExists('fares');
  await knex.schema.dropTableIfExists('routes');
  await knex.schema.dropTableIfExists('driver_availability');
  await knex.schema.dropTableIfExists('vehicles');
  await knex.schema.dropTableIfExists('drivers');
  await knex.schema.dropTableIfExists('users');
}
