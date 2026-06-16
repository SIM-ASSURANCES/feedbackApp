import { Router } from 'express';
import { authGuardAdmin } from '../middleware/auth';
import { getAllFeedbacks, deleteFeedback, getStats, moderateFeedback, getEmployeeStats, deleteEmployee } from '../controllers/adminController';
import { getAllFormQuestionsAdmin, updateFormQuestion } from '../controllers/formQuestionsController';

const router = Router();

router.get('/feedbacks', authGuardAdmin, getAllFeedbacks);
router.put('/feedbacks/:id/moderate', authGuardAdmin, moderateFeedback);
router.delete('/feedbacks/:id', authGuardAdmin, deleteFeedback);
router.get('/stats', authGuardAdmin, getStats);
router.get('/employee-stats', authGuardAdmin, getEmployeeStats);
router.delete('/employees/:id', authGuardAdmin, deleteEmployee);
router.get('/form-questions', authGuardAdmin, getAllFormQuestionsAdmin);
router.put('/form-questions/:id', authGuardAdmin, updateFormQuestion);

export default router;
