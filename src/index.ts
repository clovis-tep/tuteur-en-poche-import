import express from 'express';
import importRoutes from './routes/import.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', importRoutes);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

export default app;