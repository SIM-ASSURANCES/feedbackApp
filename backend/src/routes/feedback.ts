import { Router } from 'express';
import { authGuardAny } from '../middleware/auth';
import { submitFeedback, getPublicFeedbacks } from '../controllers/feedbackController';
import { getFormQuestions } from '../controllers/formQuestionsController';

const router = Router();

router.get('/public', getPublicFeedbacks);
router.post('/submit', authGuardAny, submitFeedback);
router.get('/form-questions', getFormQuestions);

export default router;
