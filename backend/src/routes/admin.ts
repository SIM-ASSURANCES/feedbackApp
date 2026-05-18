import { Router } from 'express';
import { authGuardAdmin } from '../middleware/auth';
import { getAllFeedbacks, deleteFeedback, getStats, moderateFeedback } from '../controllers/adminController';

const router = Router();

router.get('/feedbacks', authGuardAdmin, getAllFeedbacks);
router.put('/feedbacks/:id/moderate', authGuardAdmin, moderateFeedback);
router.delete('/feedbacks/:id', authGuardAdmin, deleteFeedback);
router.get('/stats', authGuardAdmin, getStats);

export default router;
