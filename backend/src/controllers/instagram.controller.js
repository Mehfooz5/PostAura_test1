import {
  createMediaContainer,
  publishMedia
} from '../services/instagram.service.js';
import User from '../models/User.js';
import axios from 'axios';

export const publishReel = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { videoUrl, caption } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'videoUrl required' });

    const igUserId = user.igUserId;
    if (!igUserId) return res.status(400).json({ error: 'No linked Instagram Business account' });

    const access_token = user.accessToken;

    // Step 1: Create media container
    const container = await createMediaContainer({
      igUserId,
      access_token,
      video_url: videoUrl,
      caption
    });

    // Step 2: Poll until status_code == FINISHED
    let status = "IN_PROGRESS";
    let attempts = 0;
    while (status === "IN_PROGRESS" && attempts < 10) {
      await new Promise(r => setTimeout(r, 5000)); // wait 5 seconds
      const check = await axios.get(
        `https://graph.facebook.com/v20.0/${container.id}`,
        { params: { fields: "status_code", access_token } }
      );
      status = check.data.status_code;
      attempts++;
    }

    if (status !== "FINISHED") {
      return res.status(400).json({ error: "Video not ready for publishing. Try again later." });
    }

    // Step 3: Publish
    const publishRes = await publishMedia({
      igUserId,
      access_token,
      creation_id: container.id
    });

    res.json({ ok: true, container, publishRes });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Publish failed', details: err.response?.data || err.message });
  }
};
