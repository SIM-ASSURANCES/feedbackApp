import { Router } from 'express';
import { authGuardUser, authGuardAny } from '../middleware/auth';
import { getUserFeedbackSynthesis, getMe, changePassword } from '../controllers/userController';

const router = Router();

router.get('/me/feedbacks/synthesis', authGuardUser, getUserFeedbackSynthesis);
router.get('/me', authGuardAny, getMe);
router.put('/me/password', authGuardAny, changePassword);

export default router;
