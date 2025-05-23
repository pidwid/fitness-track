import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find the .env file in the project root
const envPath = path.resolve(__dirname, '.env');

// Check if .env file exists
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  config({ path: envPath });
} else {
  console.warn('No .env file found at', envPath);
}

// Validate required environment variables
const requiredEnvVars = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.warn(`Warning: Required environment variable ${varName} is not set!`);
  }
}

// Export environment variables for use in other modules
export const env = {
  TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3200
};