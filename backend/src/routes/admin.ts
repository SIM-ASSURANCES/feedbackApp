import { Router } from 'express';
import { authGuardAdmin, authGuardSuperAdmin } from '../middleware/auth';
import { getAllFeedbacks, deleteFeedback, getStats, moderateFeedback, getEmployeeStats, deleteEmployee, revealFeedbackAuthor } from '../controllers/adminController';
import { getAllFormQuestionsAdmin, updateFormQuestion, createFormQuestion } from '../controllers/formQuestionsController';

const router = Router();

router.get('/feedbacks', authGuardAdmin, getAllFeedbacks);
router.put('/feedbacks/:id/moderate', authGuardAdmin, moderateFeedback);
router.delete('/feedbacks/:id', authGuardAdmin, deleteFeedback);
router.post('/feedbacks/:id/reveal', authGuardSuperAdmin, revealFeedbackAuthor);
router.get('/stats', authGuardAdmin, getStats);
router.get('/employee-stats', authGuardAdmin, getEmployeeStats);
router.delete('/employees/:id', authGuardAdmin, deleteEmployee);
router.get('/form-questions', authGuardAdmin, getAllFormQuestionsAdmin);
router.post('/form-questions', authGuardAdmin, createFormQuestion);
router.put('/form-questions/:id', authGuardAdmin, updateFormQuestion);

export default router;
