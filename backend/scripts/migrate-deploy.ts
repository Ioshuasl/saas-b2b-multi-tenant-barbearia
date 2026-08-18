import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

const migrationUrl = process.env.DATABASE_MIGRATION_URL;
if (!migrationUrl) {
  console.error('DATABASE_MIGRATION_URL é obrigatório para migrar.');
  process.exit(1);
}

execSync('prisma migrate deploy', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: migrationUrl },
});

execSync('prisma generate', {
  stdio: 'inherit',
  env: process.env,
});
