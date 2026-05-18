import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import feedbackRoutes from './routes/feedback';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import employeesRoutes from './routes/employees';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW ?? 15) * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeesRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

export default app;
