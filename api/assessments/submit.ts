import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { generateAIAnalysis } from '../services/deepseek.js';

let prisma: PrismaClient | null = null;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== SUBMIT ASSESSMENT START ===');
    const {
      accessCode,
      totalScore,
      category,
      attachmentStyle,
      dimensions,
      answers
    } = req.body;
    
    console.log('Request body:', { accessCode, totalScore, category, attachmentStyle });

    if (!accessCode) {
      return res.status(400).json({ error: 'Access code is required' });
    }

    const db = getPrisma();

    // Find and validate access code
    const codeRecord = await db.accessCode.findUnique({
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

    // Generate AI analysis first (async call to DeepSeek)
    console.log('Generating AI analysis...');
    let aiAnalysisObject;
    try {
      aiAnalysisObject = await generateAIAnalysis(totalScore, category, attachmentStyle, dimensions);
      console.log('AI analysis generated successfully');
    } catch (aiError: any) {
      console.error('AI analysis generation failed:', aiError.message);
      // Use fallback but continue with data saving
      aiAnalysisObject = {
        resultInterpretation: '分析生成失败，请稍后重试',
        strengths: '',
        areasToWatch: '',
        personalizedAdvice: '',
        professionalAdvice: ''
      };
    }
    
    // Store as JSON string in database
    const aiAnalysis = JSON.stringify(aiAnalysisObject);

    console.log('Creating assessment record...');
    // Create assessment with AI analysis
    const assessment = await db.assessment.create({
      data: {
        accessCodeId: codeRecord.id,
        totalScore,
        category,
        attachmentStyle,
        dimensions: JSON.stringify(dimensions),
        answers: JSON.stringify(answers),
        aiAnalysis,
        ipAddress,
        userAgent
      }
    });
    console.log('Assessment created with ID:', assessment.id);

    console.log('Updating access code status...');
    // Mark access code as used
    await db.accessCode.update({
      where: { id: codeRecord.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedByIp: ipAddress
      }
    });
    console.log('Access code marked as used:', codeRecord.code);

    console.log('=== SUBMIT ASSESSMENT SUCCESS ===');
    console.log('Assessment ID:', assessment.id);
    
    return res.status(200).json({
      id: assessment.id,
      totalScore,
      category,
      attachmentStyle,
      dimensions,
      aiAnalysis: aiAnalysisObject
    });
  } catch (error: any) {
    console.error('=== SUBMIT ASSESSMENT ERROR ===');
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
