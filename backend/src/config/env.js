import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres.mmwirkaraakfmazqgagy:5lOBEPh0zxDn4rsM@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
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
