import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
    const total = await prisma.assessment.count();

    const assessments = await prisma.assessment.findMany();

    // Calculate scores
    const scores = assessments.map(a => a.totalScore);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

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
    const recentAssessments = await prisma.assessment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalScore: true,
        category: true,
        attachmentStyle: true,
        createdAt: true,
      }
    });

    return res.status(200).json({
      total,
      avgScore,
      minScore,
      maxScore,
      categoryDistribution,
      attachmentDistribution,
      recentAssessments,
      dailyStats: []
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
