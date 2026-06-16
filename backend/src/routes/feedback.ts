import { Router } from 'express';
import { submitFeedback, getPublicFeedbacks } from '../controllers/feedbackController';
import { getFormQuestions } from '../controllers/formQuestionsController';

const router = Router();

router.get('/public', getPublicFeedbacks);
router.post('/submit', submitFeedback);
router.get('/form-questions', getFormQuestions);

export default router;
