import { Router } from 'express';
import { authGuardUser, authGuardAny } from '../middleware/auth';
import { getUserFeedbackSynthesis, getMe } from '../controllers/userController';

const router = Router();

router.get('/me/feedbacks/synthesis', authGuardUser, getUserFeedbackSynthesis);
router.get('/me', authGuardAny, getMe);

export default router;
