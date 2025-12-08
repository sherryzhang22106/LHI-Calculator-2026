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
    const total = await db.assessment.count();
    
    const assessments = await db.assessment.findMany();
    
    // Calculate average score
    const avgScore = assessments.length > 0
      ? Math.round(assessments.reduce((sum, a) => sum + a.totalScore, 0) / assessments.length)
      : 0;

    // Category distribution
    const categoryCount: Record<string, number> = {};
    assessments.forEach(a => {
      categoryCount[a.category] = (categoryCount[a.category] || 0) + 1;
    });
    const categoryDistribution = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count
    }));

    // Attachment style distribution
    const attachmentCount: Record<string, number> = {};
    assessments.forEach(a => {
      attachmentCount[a.attachmentStyle] = (attachmentCount[a.attachmentStyle] || 0) + 1;
    });
    const attachmentDistribution = Object.entries(attachmentCount).map(([style, count]) => ({
      style,
      count
    }));

    // Get recent assessments
    const recentAssessments = await db.assessment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      total,
      avgScore,
      categoryDistribution,
      attachmentDistribution,
      recentAssessments
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
