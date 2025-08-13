import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default function App() {
  const [user, setUser] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState('');

useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await axios.get(`${BACKEND}/auth/me`, { withCredentials: true });
      setUser(res.data.user);
      console.log(res.data.user);
    } catch (error) {
      setUser(null);
      console.error(error);
    }
  };
  fetchUser();
}, []);

  const handleLogin = () => {
    // redirect browser to backend which will redirect to FB OAuth
    window.location.href = `${BACKEND}/auth/facebook`;
  };

  const handleLogout = async () => {
    await axios.post(`${BACKEND}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  const uploadToCloudinary = async (file) => {
    setStatus('Uploading to Cloudinary...');
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    console.log("its here", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
    const name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const res = await fetch(`https://api.cloudinary.com/v1_1/${name}/video/upload`, {
      method: 'POST',
      body: form
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handlePublish = async () => {
    if (!videoFile) return alert('Select a video');
    if (!user) return alert('Login first');

    try {
      const videoUrl = await uploadToCloudinary(videoFile);
      console.log("✅ Uploaded to Cloudinary:", videoUrl);
      setStatus('Publishing to Instagram...');
      const res = await axios.post(`${BACKEND}/instagram/publish`, {
        videoUrl,
        caption
      }, { withCredentials: true });
      setStatus('Published: ' + JSON.stringify(res.data));
    } catch (err) {
      console.error(err.response?.data || err.message);
      setStatus('Publish failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>POST AURA</h1>

      {!user ? (
        <>
          <p>Not connected</p>
          <button onClick={handleLogin}>Connect with Facebook</button>
        </>
      ) : (
        <>
          <p>Connected as: <strong>{user.name}</strong></p>
          <p>IG Business ID: {user.igUserId || 'not linked'}</p>
          <button onClick={handleLogout}>Logout</button>

          <hr />

          <h3>Post a Reel</h3>
          <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} />
          <div>
            <input placeholder="Caption" value={caption} onChange={e => setCaption(e.target.value)} />
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={handlePublish}>Upload & Publish</button>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Status:</strong> {status}
          </div>
        </>
      )}
    </div>
  );
}
