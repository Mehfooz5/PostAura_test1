// services/instagram.service.js
import axios from 'axios';
const FB_API = process.env.FB_API_VERSION || 'v20.0';
const FB_BASE = (path) => `https://graph.facebook.com/${FB_API}${path}`;

export async function exchangeCodeForShortToken({ code, redirect_uri, client_id, client_secret }) {
  const res = await axios.get(`${FB_BASE('/oauth/access_token')}`, {
    params: { client_id, redirect_uri, client_secret, code }
  });
  return res.data; // { access_token, token_type, expires_in }
}

export async function exchangeForLongLivedToken({ short_lived_token, client_id, client_secret }) {
  const res = await axios.get(`${FB_BASE('/oauth/access_token')}`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id,
      client_secret,
      fb_exchange_token: short_lived_token
    }
  });
  return res.data; // { access_token, token_type, expires_in }
}

export async function getUserProfile({ access_token }) {
  const res = await axios.get(`${FB_BASE('/me')}`, {
    params: { access_token, fields: 'id,name' }
  });
  return res.data;
}

export async function getUserPages({ access_token }) {
  const res = await axios.get(`${FB_BASE('/me/accounts')}`, {
    params: { access_token }
  });
  return res.data; // { data: [...] }
}

export async function getInstagramBusinessAccount({ page_id, page_access_token }) {
  const res = await axios.get(`${FB_BASE(`/${page_id}`)}`, {
    params: { fields: 'instagram_business_account', access_token: page_access_token }
  });
  return res.data; // may contain instagram_business_account
}

export async function createMediaContainer({ igUserId, access_token, video_url, caption }) {
  const res = await axios.post(`${FB_BASE(`/${igUserId}/media`)}`, null, {
    params: { media_type: 'REELS' || 'IMAGE', video_url, caption, access_token }
  });
  return res.data; // { id }
}

export async function publishMedia({ igUserId, access_token, creation_id }) {
  const res = await axios.post(`${FB_BASE(`/${igUserId}/media_publish`)}`, null, {
    params: { creation_id, access_token }
  });
  return res.data;
}
