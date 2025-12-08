import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      accessCode,
      totalScore,
      category,
      attachmentStyle,
      dimensions,
      answers
    } = req.body;

    if (!accessCode) {
      return res.status(400).json({ error: 'Access code is required' });
    }

    // Find and validate access code
    const codeRecord = await prisma.accessCode.findUnique({
      where: { code: accessCode }
    });

    if (!codeRecord) {
      return res.status(404).json({ error: 'Access code not found' });
    }

    if (codeRecord.isUsed) {
      return res.status(400).json({ error: 'Access code already used' });
    }

    // Get IP and User Agent
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                     (req.headers['x-real-ip'] as string) || 
                     'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        accessCodeId: codeRecord.id,
        totalScore,
        category,
        attachmentStyle,
        dimensions: JSON.stringify(dimensions),
        answers: JSON.stringify(answers),
        ipAddress,
        userAgent
      }
    });

    // Mark access code as used
    await prisma.accessCode.update({
      where: { id: codeRecord.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedByIp: ipAddress
      }
    });

    // Generate AI analysis (simplified for now)
    const aiAnalysis = `您的恋爱健康指数为${totalScore}分，属于${category}水平。您的依恋类型倾向于${attachmentStyle}型。`;

    // Update assessment with AI analysis
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { aiAnalysis }
    });

    return res.status(200).json({
      id: assessment.id,
      totalScore,
      category,
      attachmentStyle,
      dimensions,
      aiAnalysis
    });
  } catch (error: any) {
    console.error('Submit assessment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
