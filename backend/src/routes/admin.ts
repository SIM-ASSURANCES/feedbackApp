import { Router } from 'express';
import { authGuardAdmin } from '../middleware/auth';
import { getAllFeedbacks, deleteFeedback, getStats, moderateFeedback, getEmployeeStats } from '../controllers/adminController';

const router = Router();

router.get('/feedbacks', authGuardAdmin, getAllFeedbacks);
router.put('/feedbacks/:id/moderate', authGuardAdmin, moderateFeedback);
router.delete('/feedbacks/:id', authGuardAdmin, deleteFeedback);
router.get('/stats', authGuardAdmin, getStats);
router.get('/employee-stats', authGuardAdmin, getEmployeeStats);

export default router;
