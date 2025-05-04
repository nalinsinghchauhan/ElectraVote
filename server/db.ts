import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Ensure SSL is enabled in the connection string
const connectionString = process.env.DATABASE_URL.includes('?') 
  ? `${process.env.DATABASE_URL}&sslmode=require`
  : `${process.env.DATABASE_URL}?sslmode=require`;

export const pool = new Pool({ 
  connectionString,
  ssl: {
    rejectUnauthorized: true
  },
  max: 1, // Limit to one connection to avoid connection pool issues
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 30000, // Connection timeout after 30 seconds
});

export const db = drizzle(pool, { schema });
