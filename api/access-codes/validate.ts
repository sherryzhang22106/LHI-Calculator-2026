import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Access code is required' });
    }

    const accessCode = await prisma.accessCode.findUnique({
      where: { code: code.trim() }
    });

    if (!accessCode) {
      return res.status(404).json({ 
        valid: false, 
        message: '兑换码不存在' 
      });
    }

    if (accessCode.isUsed) {
      return res.status(400).json({ 
        valid: false, 
        message: '兑换码已被使用' 
      });
    }

    return res.status(200).json({
      valid: true,
      accessCodeId: accessCode.id
    });
  } catch (error: any) {
    console.error('Validate access code error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
