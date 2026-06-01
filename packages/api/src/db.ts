import knex from 'knex';
import { knexConfig } from './db/knexfile';

const environment = process.env.NODE_ENV || 'development';
const config = (knexConfig as any)[environment] || (knexConfig as any).development;
const db = knex(config);

export default db;
