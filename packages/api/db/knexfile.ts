import path from 'path';

const API_DIR = process.cwd();

const config = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.join(API_DIR, 'data', 'hi-way.db'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(API_DIR, 'db', 'migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(API_DIR, 'db', 'seeds'),
      extension: 'ts',
    },
  },
  production: {
    client: process.env.DB_CLIENT || 'better-sqlite3',
    connection: {
      filename: path.join(API_DIR, 'data', 'hi-way.db'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(API_DIR, 'db', 'migrations'),
    },
    seeds: {
      directory: path.join(API_DIR, 'db', 'seeds'),
    },
  },
};

export default config;
module.exports = config;
