// controllers/auth.controller.js
import qs from 'querystring';
import dotenv from 'dotenv';

dotenv.config();

import {
  exchangeCodeForShortToken,
  exchangeForLongLivedToken,
  getUserProfile,
  getUserPages,
  getInstagramBusinessAccount
} from '../services/instagram.service.js';
import User from '../models/User.js';

const CLIENT_ID = process.env.FACEBOOK_APP_ID;
const CLIENT_SECRET = process.env.FACEBOOK_APP_SECRET;
const FB_API = process.env.FB_API_VERSION || 'v20.0';
const SERVER_ROOT = process.env.SERVER_ROOT_URL;
const FRONTEND_ROOT = process.env.FRONTEND_ROOT_URL;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sid';

// start OAuth -> redirect to Facebook
export const loginWithFacebook = (req, res) => {
  const redirectUri = `${SERVER_ROOT}/auth/facebook/callback`;
const scopes = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_metadata',
  'instagram_basic',
  'instagram_content_publish',
  'publish_video',
  'business_management'
].join(',');

  const params = {
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    auth_type: 'rerequest'
  };
  const fbAuthUrl = `https://www.facebook.com/${FB_API}/dialog/oauth?${qs.stringify(params)}`;
  res.redirect(fbAuthUrl);
};

// callback: exchange tokens, create/update user in DB, set httpOnly cookie, redirect to frontend
export const facebookCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');

    const redirectUri = `${SERVER_ROOT}/auth/facebook/callback`;

    // Step 1: Get short-lived user token
    const short = await exchangeCodeForShortToken({
      code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    });

    // Step 2: Exchange for long-lived user token
    const long = await exchangeForLongLivedToken({
      short_lived_token: short.access_token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    });

    // Step 3: Get user profile
    const profile = await getUserProfile({ access_token: long.access_token });
    console.log("User Profile:", profile);

    // Step 4: Get Facebook Pages (should include page access tokens)
    const pagesRes = await getUserPages({ access_token: long.access_token });
    const pages = pagesRes.data || [];
    console.log("Pages:", pages);

    // Step 5: Find IG Business Account
    let igUserId = null;

    for (const p of pages) {
      if (!p.access_token) {
        console.warn(`⚠ No Page Access Token for page: ${p.name} (${p.id})`);
        continue; // skip pages without a token
      }

      try {
        const igRes = await getInstagramBusinessAccount({
          page_id: p.id,
          page_access_token: p.access_token
        });

        console.log(`IG data for page ${p.name}:`, igRes);

        if (igRes.instagram_business_account?.id) {
          igUserId = igRes.instagram_business_account.id;
          break;
        }
      } catch (err) {
        console.error(`Error fetching IG account for page ${p.name}:`, err.response?.data || err.message);
      }
    }

    // Step 6: Save user in DB
    const tokenExpiresAt = long.expires_in
      ? new Date(Date.now() + long.expires_in * 1000)
      : null;

    const user = await User.findOneAndUpdate(
      { facebookId: profile.id },
      {
        facebookId: profile.id,
        name: profile.name,
        accessToken: long.access_token,
        tokenExpiresAt,
        pages,
        igUserId
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Step 7: Set session cookie
    res.cookie(SESSION_COOKIE_NAME, user._id.toString(), {
      httpOnly: true,
      // secure: true, // enable in prod
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    });

    // Step 8: Redirect to frontend
    res.redirect(FRONTEND_ROOT);

  } catch (err) {
    console.error('OAuth callback error', err.response?.data || err.message);
    res.status(500).send('OAuth callback failed');
  }
};

// logout
export const logout = (req, res) => {
  const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sid';
  res.clearCookie(SESSION_COOKIE_NAME);
  res.json({ ok: true });
};

// get me
export const getMe = async (req, res) => {
  const user = req.user;
  if (!user) return res.json({ user: null });
  // return safe user info (no tokens)
  res.json({
    user: {
      id: user._id,
      facebookId: user.facebookId,
      name: user.name,
      igUserId: user.igUserId,
      pages: user.pages
    }
  });
};
