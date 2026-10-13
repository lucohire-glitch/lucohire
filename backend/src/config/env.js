import 'dotenv/config';

function getDatabaseUrl() {
  const envUrl = (process.env.DATABASE_URL || '').trim();
  const fallback = 'postgresql://postgres.mmwirkaraakfmazqgagy:5lOBEPh0zxDn4rsM@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';
  if (!envUrl) return fallback;
  try {
    const parsed = new URL(envUrl);
    if (
      !parsed.hostname ||
      parsed.hostname === 'base' ||
      !parsed.hostname.includes('.') ||
      (parsed.hostname.startsWith('db.') && parsed.hostname.endsWith('.supabase.co'))
    ) {
      console.warn(`[DB CONFIG] Invalid or IPv6 DATABASE_URL hostname "${parsed.hostname}". Using verified Supabase IPv4 pooler.`);
      return fallback;
    }
    return envUrl;
  } catch {
    return fallback;
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
  databaseUrl: getDatabaseUrl(),
  jwt: {
    secret: process.env.JWT_SECRET || 'lucohire-super-secret-change-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'lucohire',
  },
};
