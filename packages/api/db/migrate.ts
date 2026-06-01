import knexLib from 'knex';
import path from 'path';

const API_DIR = process.cwd();

const config = {
  client: 'better-sqlite3',
  connection: { filename: path.join(API_DIR, 'data', 'hi-way.db') },
  useNullAsDefault: true,
  migrations: { directory: path.join(API_DIR, 'db', 'migrations'), extension: 'ts' },
  seeds: { directory: path.join(API_DIR, 'db', 'seeds'), extension: 'ts' },
};

async function run() {
  const db = knexLib(config);
  const [batch, migrations] = await db.migrate.latest();
  console.log(`Migrations: ${batch} (${migrations.length} files)`);
  const [seedBatch] = await db.seed.run();
  console.log(`Seeds: ${seedBatch} files`);
  await db.destroy();
}

run().catch(e => { console.error(e.message); process.exit(1); });
