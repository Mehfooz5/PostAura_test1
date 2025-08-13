// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  facebookId: { type: String, required: true, index: true, unique: true },
  name: { type: String },
  accessToken: { type: String }, // long-lived access token
  tokenExpiresAt: { type: Date }, // optional
  pages: { type: Array, default: [] }, // list of fb pages with access_token
  igUserId: { type: String }, // instagram_business_account.id if found
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
    