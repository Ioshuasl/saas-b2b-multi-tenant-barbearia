function setDefault(name: string, value: string): void {
  if (!process.env[name]) process.env[name] = value;
}

setDefault('NODE_ENV', 'test');
setDefault('PORT', '3333');
setDefault('DATABASE_URL', 'postgresql://app_user:app@localhost:5432/barbearia_dev?schema=public');
setDefault(
  'DATABASE_MIGRATION_URL',
  'postgresql://postgres:postgres@localhost:5432/barbearia_dev?schema=public',
);
setDefault('REDIS_URL', 'redis://localhost:6379');
setDefault('JWT_PRIVATE_KEY', 'dGVzdC1qd3QtcHJpdmF0ZQ==');
setDefault('JWT_PUBLIC_KEY', 'dGVzdC1qd3QtcHVibGlj');
setDefault('STORAGE_ENDPOINT', 'http://localhost:9000');
setDefault('STORAGE_BUCKET', 'barbearia-dev');
setDefault('STORAGE_REGION', 'sa-east-1');
setDefault('STORAGE_ACCESS_KEY', 'minioadmin');
setDefault('STORAGE_SECRET_KEY', 'minioadmin');
setDefault('MESSAGING_PROVIDER', 'fake');
setDefault('MAIL_DSN', 'smtp://localhost:1025');
setDefault('MAIL_FROM', 'noreply@localhost');
setDefault('APP_PUBLIC_URL', 'http://localhost:3000');
setDefault('CORS_ORIGINS', 'http://localhost:3000');
setDefault('WAHA_WEBHOOK_HMAC_KEY', 'test-hmac-secret');
