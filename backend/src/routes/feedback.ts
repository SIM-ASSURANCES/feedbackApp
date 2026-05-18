import { Router } from 'express';
import { submitFeedback, getPublicFeedbacks } from '../controllers/feedbackController';

const router = Router();

router.get('/public', getPublicFeedbacks);
router.post('/submit', submitFeedback);

export default router;
