import prisma from '../config/database';
import { AccessCodeService, ProductType } from './accessCodeService';
import { DeepSeekService } from './deepseekService';

export interface AssessmentData {
  accessCode: string;
  productType?: ProductType;
  totalScore: number;
  category: string;
  attachmentStyle?: string;  // Optional for LCI
  dimensions: any[];
  answers: Record<number, number>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AssessmentService {
  static async createAssessment(data: AssessmentData) {
    const productType = data.productType || 'LHI';
    const validation = await AccessCodeService.validateCode(data.accessCode, productType);
    
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
        productType,
        totalScore: data.totalScore,
        category: data.category,
        attachmentStyle: data.attachmentStyle || null,
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

  static async getStatistics(productType?: string) {
    const whereClause = productType ? { productType } : {};

    const total = await prisma.assessment.count({ where: whereClause });

    const categoryStats = await prisma.assessment.groupBy({
      by: ['category'],
      where: whereClause,
      _count: true,
    });

    const attachmentStats = await prisma.assessment.groupBy({
      by: ['attachmentStyle'],
      where: whereClause,
      _count: true,
    });

    const avgScore = await prisma.assessment.aggregate({
      where: whereClause,
      _avg: { totalScore: true },
      _min: { totalScore: true },
      _max: { totalScore: true },
    });

    const recentAssessments = await prisma.assessment.findMany({
      where: whereClause,
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalScore: true,
        category: true,
        attachmentStyle: true,
        productType: true,
        createdAt: true,
      },
    });

    // Use different query based on whether productType filter is applied
    let dailyStats: Array<{ date: string; count: number }>;
    if (productType) {
      dailyStats = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "assessments"
        WHERE "createdAt" >= datetime('now', '-30 days')
        AND "productType" = ${productType}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;
    } else {
      dailyStats = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "assessments"
        WHERE "createdAt" >= datetime('now', '-30 days')
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;
    }

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

  static async listAssessments(page: number = 1, limit: number = 20, productType?: string) {
    const skip = (page - 1) * limit;
    const whereClause = productType ? { productType } : {};

    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where: whereClause,
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
      prisma.assessment.count({ where: whereClause }),
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
