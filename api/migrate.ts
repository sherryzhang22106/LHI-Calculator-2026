import type { VercelRequest, VercelResponse } from '@vercel/node';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async (req: VercelRequest, res: VercelResponse) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple authentication - you should use a proper secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET || 'run-migration-secret'}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Run Prisma migrate deploy
    const { stdout, stderr } = await execAsync(
      'cd server && npx prisma migrate deploy',
      { env: { ...process.env } }
    );

    return res.status(200).json({
      success: true,
      message: 'Migration completed successfully',
      stdout,
      stderr
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    });
  }
};
