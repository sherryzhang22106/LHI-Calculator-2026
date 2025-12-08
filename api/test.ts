import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test basic functionality
    const testResult = {
      status: 'ok',
      method: req.method,
      env: {
        hasDatabase: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeVersion: process.version
      },
      body: req.body
    };

    // Try to load Prisma
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      testResult['prismaLoaded'] = true;
      
      // Try a simple query
      const adminCount = await prisma.admin.count();
      testResult['adminCount'] = adminCount;
      
      await prisma.$disconnect();
    } catch (error: any) {
      testResult['prismaError'] = error.message;
    }

    return res.status(200).json(testResult);
  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Test failed', 
      message: error.message,
      stack: error.stack
    });
  }
}
