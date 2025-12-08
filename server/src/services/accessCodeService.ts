import prisma from '../config/database';
import crypto from 'crypto';

export class AccessCodeService {
  static async generateCodes(count: number, batchId?: string): Promise<string[]> {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        const randomIndex = crypto.randomInt(0, chars.length);
        code += chars[randomIndex];
      }
      codes.push(code);
    }

    // SQLite doesn't support skipDuplicates in createMany
    // Use individual creates instead
    const batchIdValue = batchId || `BATCH_${Date.now()}`;
    for (const code of codes) {
      try {
        await prisma.accessCode.create({
          data: {
            code,
            batchId: batchIdValue,
          },
        });
      } catch (error: any) {
        // Skip if duplicate
        if (error.code === 'P2002') {
          console.log(`Skipping duplicate code: ${code}`);
        } else {
          throw error;
        }
      }
    }

    return codes;
  }

  static async validateCode(code: string): Promise<{ valid: boolean; accessCodeId?: string; message?: string }> {
    const accessCode = await prisma.accessCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!accessCode) {
      return { valid: false, message: 'Invalid access code' };
    }

    // Master code can be reused
    if (accessCode.code === 'LHI159951') {
      return { valid: true, accessCodeId: accessCode.id };
    }

    if (accessCode.isUsed) {
      return { valid: false, message: 'Access code already used' };
    }

    return { valid: true, accessCodeId: accessCode.id };
  }

  static async markCodeAsUsed(accessCodeId: string, ipAddress?: string): Promise<void> {
    const code = await prisma.accessCode.findUnique({
      where: { id: accessCodeId },
    });

    // Don't mark master code as used
    if (code?.code === 'LHI159951') {
      return;
    }

    await prisma.accessCode.update({
      where: { id: accessCodeId },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedByIp: ipAddress,
      },
    });
  }

  static async getCodeStats() {
    const total = await prisma.accessCode.count();
    const used = await prisma.accessCode.count({ where: { isUsed: true } });
    const available = total - used;

    return { total, used, available };
  }

  static async listCodes(page: number = 1, limit: number = 50, filter?: 'all' | 'used' | 'available') {
    const skip = (page - 1) * limit;
    const where = filter === 'used' ? { isUsed: true } : filter === 'available' ? { isUsed: false } : {};

    const [codes, total] = await Promise.all([
      prisma.accessCode.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          isUsed: true,
          usedAt: true,
          usedByIp: true,
          batchId: true,
          createdAt: true,
        },
      }),
      prisma.accessCode.count({ where }),
    ]);

    return {
      codes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
