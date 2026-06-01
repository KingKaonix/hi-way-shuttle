import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'hi-way-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbClient: process.env.DB_CLIENT || 'better-sqlite3',
  dbFilename: path.join(__dirname, '..', 'data', 'hi-way.db'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  messengerVerifyToken: process.env.MESSENGER_VERIFY_TOKEN || '',
  messengerPageToken: process.env.MESSENGER_PAGE_TOKEN || '',
  adminApiKey: process.env.ADMIN_API_KEY || '',
  isProduction: process.env.NODE_ENV === 'production',
};
