// routes/instagram.routes.js
import express from 'express';
import { publishReel } from '../controllers/instagram.controller.js';
import User from '../models/User.js';

const router = express.Router();

// reuse cookie-to-user middleware used in auth.routes - but add here too
router.use(async (req, res, next) => {
  const cookie = req.cookies[process.env.SESSION_COOKIE_NAME || 'sid'];
  if (cookie) {
    try {
      const user = await User.findById(cookie);
      if (user) req.user = user;
    } catch (err) {}
  }
  next();
});

router.post('/publish', publishReel);

export default router;
