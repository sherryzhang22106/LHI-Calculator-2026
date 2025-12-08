import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Assessment ID is required' });
    }

    const db = getPrisma();

    const assessment = await db.assessment.findUnique({
      where: { id }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Parse JSON fields
    const dimensions = JSON.parse(assessment.dimensions);
    const answers = JSON.parse(assessment.answers);

    // Parse AI analysis
    let parsedAnalysis = null;
    try {
      // Try to parse as JSON first (new format)
      parsedAnalysis = JSON.parse(assessment.aiAnalysis || '{}');
    } catch {
      // Fallback to string parsing for old format
      const aiAnalysis = assessment.aiAnalysis || '';
      if (aiAnalysis.includes('###')) {
        const sections = {
          resultInterpretation: '',
          strengths: '',
          areasToWatch: '',
          personalizedAdvice: '',
          professionalAdvice: ''
        };

        const parts = aiAnalysis.split(/###\s*/);
        
        for (const part of parts) {
          const trimmedPart = part.trim();
          if (!trimmedPart) continue;
          
          if (trimmedPart.startsWith('结果解释')) {
            sections.resultInterpretation = trimmedPart.replace(/^结果解释[：:\s]*/, '').trim();
          } else if (trimmedPart.startsWith('你的优势') || trimmedPart.startsWith('优势')) {
            sections.strengths = trimmedPart.replace(/^(你的)?优势[：:\s]*/, '').trim();
          } else if (trimmedPart.startsWith('需要注意')) {
            sections.areasToWatch = trimmedPart.replace(/^需要注意(的方面)?[：:\s]*/, '').trim();
          } else if (trimmedPart.startsWith('个性化建议')) {
            sections.personalizedAdvice = trimmedPart.replace(/^个性化建议[：:\s]*/, '').trim();
          } else if (trimmedPart.startsWith('专业建议')) {
            sections.professionalAdvice = trimmedPart.replace(/^专业建议[：:\s]*/, '').trim();
          }
        }

        parsedAnalysis = sections;
      }
    }

    return res.status(200).json({
      id: assessment.id,
      totalScore: assessment.totalScore,
      category: assessment.category,
      attachmentStyle: assessment.attachmentStyle,
      dimensions,
      answers,
      aiAnalysis: parsedAnalysis,
      createdAt: assessment.createdAt
    });
  } catch (error: any) {
    console.error('Get assessment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
