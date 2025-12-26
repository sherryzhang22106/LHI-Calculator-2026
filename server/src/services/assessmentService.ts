import prisma from '../config/database';
import { AccessCodeService, ProductType } from './accessCodeService';
import { DeepSeekService } from './deepseekService';

// 异步生成AI报告的函数（不阻塞主流程）
async function generateAIReportAsync(
  assessmentId: string,
  scores: any,
  answers: any,
  primaryType: string,
  answerSummary: string,
  ipAddress?: string
): Promise<void> {
  try {
    console.log(`[AI Report] Starting async generation for assessment ${assessmentId}`);
    
    // 更新状态为 generating
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { aiStatus: 'generating' }
    });

    // 调用 DeepSeek API 生成报告
    const result = await DeepSeekService.generateASAReport({
      scores,
      primaryType,
      answerSummary,
      ipAddress
      // 不传 accessCodeId，避免重复保存到数据库
    });

    if (result.success && result.report) {
      // 保存报告并更新状态为 completed
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          aiAnalysis: result.report,
          aiStatus: 'completed',
          aiGeneratedAt: new Date()
        }
      });
      console.log(`[AI Report] Successfully generated for assessment ${assessmentId}, length: ${result.report.length}`);
    } else {
      // 生成失败
      await prisma.assessment.update({
        where: { id: assessmentId },
        data: { aiStatus: 'failed' }
      });
      console.error(`[AI Report] Failed for assessment ${assessmentId}:`, result.error);
    }
  } catch (error) {
    console.error(`[AI Report] Error for assessment ${assessmentId}:`, error);
    // 更新状态为 failed
    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { aiStatus: 'failed' }
    }).catch(err => console.error('Failed to update status to failed:', err));
  }
}

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

    // Parse dimensions
    let parsedDimensions;
    try {
      parsedDimensions = JSON.parse(assessment.dimensions);
    } catch (e) {
      parsedDimensions = assessment.dimensions;
    }

    // Parse answers
    let parsedAnswers;
    try {
      parsedAnswers = JSON.parse(assessment.answers);
    } catch (e) {
      parsedAnswers = assessment.answers;
    }

    // Handle aiAnalysis - for ASA, it's a string; for LHI, it might be JSON
    let aiAnalysisResult = assessment.aiAnalysis;
    if (assessment.productType === 'LHI' && assessment.aiAnalysis) {
      try {
        aiAnalysisResult = JSON.parse(assessment.aiAnalysis);
      } catch (e) {
        // If parse fails, keep as string
      }
    }

    return {
      ...assessment,
      dimensions: parsedDimensions,
      answers: parsedAnswers,
      aiAnalysis: aiAnalysisResult,
      aiStatus: assessment.aiStatus || 'pending',
      aiGeneratedAt: assessment.aiGeneratedAt || null,
    };
  }

  // 新增：ASA专用的提交方法（异步生成AI报告）
  static async submitASAAssessment(data: {
    accessCode: string;
    scores: any;
    answers: any;
    primaryType: string;
    dimensions: any[];
    answerSummary: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // 验证兑换码
    const validation = await AccessCodeService.validateCode(data.accessCode, 'ASA');
    
    if (!validation.valid || !validation.accessCodeId) {
      throw new Error(validation.message || 'Invalid access code');
    }

    // 计算总分
    const totalScore = (data.scores.secure || 0) + (data.scores.anxious || 0) +
                      (data.scores.avoidant || 0) + (data.scores.fearful || 0);

    // 创建测评记录（不包含AI报告）
    const assessment = await prisma.assessment.create({
      data: {
        accessCodeId: validation.accessCodeId,
        productType: 'ASA',
        totalScore,
        category: data.primaryType,
        attachmentStyle: data.primaryType,
        dimensions: JSON.stringify(data.dimensions),
        answers: JSON.stringify(data.answers),
        scores: JSON.stringify({ scores: data.scores }),
        aiAnalysis: null,  // 初始为空
        aiStatus: 'pending',  // 初始状态
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    // 标记兑换码为已使用
    await AccessCodeService.markCodeAsUsed(validation.accessCodeId, data.ipAddress);

    // 异步生成AI报告（不阻塞响应）
    generateAIReportAsync(
      assessment.id,
      data.scores,
      data.answers,
      data.primaryType,
      data.answerSummary,
      data.ipAddress
    ).catch(err => console.error('[submitASAAssessment] Async AI generation error:', err));

    console.log(`[submitASAAssessment] Assessment created: ${assessment.id}, AI generation started in background`);

    // 立即返回（不等待AI报告）
    return {
      id: assessment.id,
      message: 'Assessment submitted successfully. AI report is being generated.',
      aiStatus: 'pending'
    };
  }

  // 新增：查询AI报告状态
  static async getAIReportStatus(assessmentId: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        aiStatus: true,
        aiAnalysis: true,
        aiGeneratedAt: true,
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    return {
      status: assessment.aiStatus,
      report: assessment.aiStatus === 'completed' ? assessment.aiAnalysis : null,
      generatedAt: assessment.aiGeneratedAt,
    };
  }

  static async getAssessmentByAccessCodeId(accessCodeId: string) {
    const assessment = await prisma.assessment.findFirst({
      where: { accessCodeId },
      orderBy: { createdAt: 'desc' },
    });

    if (!assessment) return null;

    return {
      ...assessment,
      dimensions: JSON.parse(assessment.dimensions),
      answers: JSON.parse(assessment.answers),
      aiAnalysis: assessment.aiAnalysis ? (typeof assessment.aiAnalysis === 'string' ? assessment.aiAnalysis : JSON.stringify(assessment.aiAnalysis)) : null,
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

    // 获取所有评估数据用于计算
    const allAssessments = await prisma.assessment.findMany({ where: whereClause });

    // LHI Category distribution - 只统计LHI的类别
    const lhiAssessments = allAssessments.filter(a => a.productType === 'LHI');
    const lhiCategoryCount: Record<string, number> = {};
    lhiAssessments.forEach(a => {
      if (a.category) {
        lhiCategoryCount[a.category] = (lhiCategoryCount[a.category] || 0) + 1;
      }
    });
    const lhiCategoryDistribution = Object.entries(lhiCategoryCount).map(([category, count]) => ({
      category,
      count
    }));

    // LCI Category distribution - 只统计LCI的类别
    const lciAssessments = allAssessments.filter(a => a.productType === 'LCI');
    const lciCategoryCount: Record<string, number> = {};
    lciAssessments.forEach(a => {
      if (a.category) {
        lciCategoryCount[a.category] = (lciCategoryCount[a.category] || 0) + 1;
      }
    });
    const lciCategoryDistribution = Object.entries(lciCategoryCount).map(([category, count]) => ({
      category,
      count
    }));

    // Attachment style distribution - 只统计ASA的依恋风格
    const asaAssessments = allAssessments.filter(a => a.productType === 'ASA');
    const attachmentCount: Record<string, number> = {};
    asaAssessments.forEach(a => {
      if (a.attachmentStyle) {
        attachmentCount[a.attachmentStyle] = (attachmentCount[a.attachmentStyle] || 0) + 1;
      }
    });
    const attachmentDistribution = Object.entries(attachmentCount).map(([style, count]) => ({
      style,
      count
    }));

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
        aiAnalysis: true,
        createdAt: true,
      },
    });

    // Calculate daily stats for the last 30 days (compatible with SQLite)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentForTrend = await prisma.assessment.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true,
        productType: true
      }
    });

    // Group by date
    const dailyStatsMap: Record<string, { date: string; count: number; lhi: number; lci: number; asa: number }> = {};

    // Initialize last 30 days with 0 counts
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStatsMap[dateStr] = { date: dateStr, count: 0, lhi: 0, lci: 0, asa: 0 };
    }

    // Count assessments per day
    recentForTrend.forEach(a => {
      const dateStr = a.createdAt.toISOString().split('T')[0];
      if (dailyStatsMap[dateStr]) {
        dailyStatsMap[dateStr].count++;
        if (a.productType === 'LHI') dailyStatsMap[dateStr].lhi++;
        else if (a.productType === 'LCI') dailyStatsMap[dateStr].lci++;
        else if (a.productType === 'ASA') dailyStatsMap[dateStr].asa++;
      }
    });

    const dailyStats = Object.values(dailyStatsMap).sort((a, b) => a.date.localeCompare(b.date));

    return {
      total,
      avgScore: Math.round(avgScore._avg.totalScore || 0),
      minScore: avgScore._min.totalScore || 0,
      maxScore: avgScore._max.totalScore || 0,
      lhiCategoryDistribution,
      lciCategoryDistribution,
      attachmentDistribution,
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
