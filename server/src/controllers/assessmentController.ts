import { Response } from 'express';
import { AssessmentService } from '../services/assessmentService';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createAssessmentSchema = z.object({
  accessCode: z.string(),
  totalScore: z.number().min(0).max(100),
  category: z.string(),
  attachmentStyle: z.string(),
  dimensions: z.array(z.any()),
  answers: z.record(z.number()),
});

export class AssessmentController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const data = createAssessmentSchema.parse(req.body);
      
      const assessment = await AssessmentService.createAssessment({
        ...data,
        userId: req.user?.id,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json(assessment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const assessment = await AssessmentService.getAssessmentById(id);

      if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      res.json(assessment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getUserAssessments(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const assessments = await AssessmentService.getUserAssessments(req.user.id);
      res.json(assessments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStatistics(req: AuthRequest, res: Response) {
    try {
      const productType = req.query.productType as string | undefined;
      const stats = await AssessmentService.getStatistics(productType);
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const productType = req.query.productType as string | undefined;

      const result = await AssessmentService.listAssessments(page, limit, productType);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
