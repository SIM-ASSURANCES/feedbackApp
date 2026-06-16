import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.listen(port, () => {
  console.log(`Feedback backend started on http://localhost:${port}`);
});
