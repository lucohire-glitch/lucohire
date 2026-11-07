import pg from 'pg';
import { env } from './env.js';

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 8,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 10000,
});

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile TEXT,
      password_hash TEXT NOT NULL,
      title TEXT,
      city TEXT,
      state TEXT,
      profile JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS recruiters (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mobile TEXT,
      password_hash TEXT NOT NULL,
      role_title TEXT,
      company TEXT,
      city TEXT,
      state TEXT,
      profile JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      user_email TEXT,
      user_role TEXT,
      plan_id TEXT,
      plan_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'INR',
      razorpay_order_id TEXT UNIQUE NOT NULL,
      razorpay_payment_id TEXT,
      razorpay_signature TEXT,
      status TEXT DEFAULT 'created',
      receipt TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_mobile ON candidates(mobile) WHERE mobile IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_recruiters_mobile ON recruiters(mobile) WHERE mobile IS NOT NULL;

    -- Subscription, Expiry & Auto-Renew columns
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS plan TEXT;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMPTZ;

    ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
    ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS plan TEXT;
    ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
    ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
    ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMPTZ;

    ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_auto_renew BOOLEAN DEFAULT FALSE;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

    -- Ensure all existing paid users have auto_renew active (unless explicitly disabled) and a valid plan_expires_at
    UPDATE candidates 
    SET auto_renew = TRUE 
    WHERE is_paid = TRUE AND auto_renew IS NULL;

    UPDATE candidates 
    SET plan_expires_at = NOW() + INTERVAL '30 days' 
    WHERE is_paid = TRUE AND plan_expires_at IS NULL;

    UPDATE recruiters 
    SET auto_renew = TRUE 
    WHERE is_paid = TRUE AND auto_renew IS NULL;

    UPDATE recruiters 
    SET plan_expires_at = NOW() + INTERVAL '30 days' 
    WHERE is_paid = TRUE AND plan_expires_at IS NULL;
  `);
}
