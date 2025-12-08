import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../server/src/routes/auth';
import assessmentRoutes from '../server/src/routes/assessments';
import accessCodeRoutes from '../server/src/routes/accessCodes';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Remove /api prefix from routes since Vercel already routes /api/* to this handler
app.use('/auth', authRoutes);
app.use('/assessments', assessmentRoutes);
app.use('/access-codes', accessCodeRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'LHI Calculator API', version: '1.0.0' });
});

// Export handler for Vercel serverless
export default (req: VercelRequest, res: VercelResponse) => {
  // Remove /api prefix from URL for Express routing
  const url = req.url?.replace(/^\/api/, '') || '/';
  req.url = url;
  return app(req as any, res as any);
};
