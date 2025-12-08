import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    
    try {
      jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get statistics
    const totalCodes = await prisma.accessCode.count();
    const usedCodes = await prisma.accessCode.count({
      where: { isUsed: true }
    });
    const totalAssessments = await prisma.assessment.count();

    // Get recent assessments
    const recentAssessments = await prisma.assessment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        accessCode: {
          select: { code: true }
        }
      }
    });

    return res.status(200).json({
      totalCodes,
      usedCodes,
      availableCodes: totalCodes - usedCodes,
      totalAssessments,
      recentAssessments: recentAssessments.map(a => ({
        id: a.id,
        code: a.accessCode.code,
        totalScore: a.totalScore,
        category: a.category,
        createdAt: a.createdAt
      }))
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
