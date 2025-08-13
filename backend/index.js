// index.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.route.js';
import instagramRoutes from './src/routes/instagram.routes.js';
import { connectDb } from './src/utills/db.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// allow frontend origin
app.use(cors({
  origin: process.env.FRONTEND_ROOT_URL,
  credentials: true
}));

// connect db then start
connectDb().then(() => {
  app.use('/auth', authRoutes);
  app.use('/instagram', instagramRoutes);

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}).catch(err => {
  console.error('DB connection failed', err);
});
