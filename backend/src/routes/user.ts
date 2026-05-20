import { Router } from 'express';
import { authGuardUser, authGuardAny } from '../middleware/auth';
import { getUserFeedbacks, getMe } from '../controllers/userController';

const router = Router();

router.get('/me/feedbacks', authGuardUser, getUserFeedbacks);
router.get('/me', authGuardAny, getMe);

export default router;
