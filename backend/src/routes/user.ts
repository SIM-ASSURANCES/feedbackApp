import { Router } from 'express';
import { authGuardUser } from '../middleware/auth';
import { getUserFeedbacks, getMe } from '../controllers/userController';

const router = Router();

router.get('/me/feedbacks', authGuardUser, getUserFeedbacks);
router.get('/me', authGuardUser, getMe);

export default router;
