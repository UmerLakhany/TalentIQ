import 'dotenv/config';

export function getDatabaseUrl(): string {
  const url = process.env.DB_URL;
  if (!url) {
    throw new Error('DB_URL environment variable is not set');
  }
  return url;
}
