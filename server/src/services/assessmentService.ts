import prisma from '../config/database';
import { AccessCodeService } from './accessCodeService';
import { DeepSeekService } from './deepseekService';

export interface AssessmentData {
  accessCode: string;
  totalScore: number;
  category: string;
  attachmentStyle: string;
  dimensions: any[];
  answers: Record<number, number>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AssessmentService {
  static async createAssessment(data: AssessmentData) {
    const validation = await AccessCodeService.validateCode(data.accessCode);
    
    if (!validation.valid || !validation.accessCodeId) {
      throw new Error(validation.message || 'Invalid access code');
    }

    // Get AI analysis from DeepSeek
    let aiAnalysis = null;
    try {
      const analysis = await DeepSeekService.analyzeAssessment(
        data.totalScore,
        data.category,
        data.attachmentStyle,
        data.dimensions
      );
      aiAnalysis = JSON.stringify(analysis);
    } catch (error) {
      console.error('Failed to get AI analysis:', error);
    }

    const assessment = await prisma.assessment.create({
      data: {
        accessCodeId: validation.accessCodeId,
        userId: data.userId,
        totalScore: data.totalScore,
        category: data.category,
        attachmentStyle: data.attachmentStyle,
        dimensions: JSON.stringify(data.dimensions),
        answers: JSON.stringify(data.answers),
        aiAnalysis,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    await AccessCodeService.markCodeAsUsed(validation.accessCodeId, data.ipAddress);

    // Return with parsed JSON fields
    return {
      ...assessment,
      dimensions: JSON.parse(assessment.dimensions),
      answers: JSON.parse(assessment.answers),
      aiAnalysis: assessment.aiAnalysis ? JSON.parse(assessment.aiAnalysis) : null,
    };
  }

  static async getAssessmentById(id: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        accessCode: {
          select: {
            code: true,
            batchId: true,
          },
        },
      },
    });

    if (!assessment) return null;

    return {
      ...assessment,
      dimensions: JSON.parse(assessment.dimensions),
      answers: JSON.parse(assessment.answers),
      aiAnalysis: assessment.aiAnalysis ? JSON.parse(assessment.aiAnalysis) : null,
    };
  }

  static async getUserAssessments(userId: string) {
    const assessments = await prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        accessCode: {
          select: { code: true },
        },
      },
    });

    return assessments.map(a => ({
      ...a,
      dimensions: JSON.parse(a.dimensions),
      answers: JSON.parse(a.answers),
    }));
  }

  static async getStatistics() {
    const total = await prisma.assessment.count();
    
    const categoryStats = await prisma.assessment.groupBy({
      by: ['category'],
      _count: true,
    });

    const attachmentStats = await prisma.assessment.groupBy({
      by: ['attachmentStyle'],
      _count: true,
    });

    const avgScore = await prisma.assessment.aggregate({
      _avg: { totalScore: true },
      _min: { totalScore: true },
      _max: { totalScore: true },
    });

    const recentAssessments = await prisma.assessment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalScore: true,
        category: true,
        attachmentStyle: true,
        createdAt: true,
      },
    });

    const dailyStats = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM assessments
      WHERE createdAt >= DATE('now', '-30 days')
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    return {
      total,
      avgScore: Math.round(avgScore._avg.totalScore || 0),
      minScore: avgScore._min.totalScore || 0,
      maxScore: avgScore._max.totalScore || 0,
      categoryDistribution: categoryStats.map(c => ({ category: c.category, count: c._count })),
      attachmentDistribution: attachmentStats.map(a => ({ style: a.attachmentStyle, count: a._count })),
      recentAssessments,
      dailyStats,
    };
  }

  static async listAssessments(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              username: true,
            },
          },
          accessCode: {
            select: { code: true },
          },
        },
      }),
      prisma.assessment.count(),
    ]);

    return {
      assessments: assessments.map(a => ({
        ...a,
        dimensions: JSON.parse(a.dimensions),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
