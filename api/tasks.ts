import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerRoutes } from '../server/routes';

// Create a mini Express app for task routes
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register routes
const server = await registerRoutes(app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Forward the request to our Express app
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}