import { Router } from 'express';
import { getEmployees } from '../controllers/employeesController';

const router = Router();

router.get('/', getEmployees);

export default router;
