import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Ensure SSL is enabled in the connection string
const connectionString = process.env.DATABASE_URL.includes('?') 
  ? `${process.env.DATABASE_URL}&sslmode=require`
  : `${process.env.DATABASE_URL}?sslmode=require`;

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  driver: "pg",
  dbCredentials: {
    host: process.env.DATABASE_URL.split('@')[1].split(':')[0],
    port: parseInt(process.env.DATABASE_URL.split(':')[3].split('/')[0]),
    user: process.env.DATABASE_URL.split('://')[1].split(':')[0],
    password: process.env.DATABASE_URL.split(':')[2].split('@')[0],
    database: process.env.DATABASE_URL.split('/').pop()?.split('?')[0] || '',
    ssl: {
      rejectUnauthorized: true
    }
  },
});
