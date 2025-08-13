// routes/auth.routes.js
import express from 'express';
import { loginWithFacebook, facebookCallback, logout, getMe } from '../controllers/auth.controller.js';
import User from '../models/User.js';

const router = express.Router();

// middleware to load user from cookie (simple demo)
router.use(async (req, res, next) => {
  const cookie = req.cookies[process.env.SESSION_COOKIE_NAME || 'sid'];
  if (cookie) {
    try {
      const user = await User.findById(cookie);
      if (user) req.user = user;
    } catch (err) {
      // ignore
      console.log(err);
    }
  }
  next();
});

router.get('/facebook', loginWithFacebook);
router.get('/facebook/callback', facebookCallback);
router.get('/me', getMe);
router.post('/logout', logout);

export default router;
