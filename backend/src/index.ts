import dotenv from 'dotenv';
import app from './app';
import { bootstrap } from './utils/bootstrap';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

bootstrap()
  .catch((err) => {
    console.error('Erreur lors de l\'initialisation de la base de données:', err);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`Feedback backend started on http://localhost:${port}`);
    });
  });
