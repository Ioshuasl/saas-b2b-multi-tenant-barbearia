import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

execSync('prisma generate', { stdio: 'inherit', env: process.env });
