import { Router } from 'express';
import { AssessmentController } from '../controllers/assessmentController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', AssessmentController.create);
router.get('/stats', authenticate, requireAdmin, AssessmentController.getStatistics);
router.get('/list', authenticate, requireAdmin, AssessmentController.list);
router.get('/my', authenticate, AssessmentController.getUserAssessments);
router.get('/:id', AssessmentController.getById);

export default router;
