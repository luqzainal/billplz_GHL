import axios from 'axios';
import GhlAuth from '../models/GhlAuth.js';

const refreshAccessToken = async (locationId) => {
  const ghlAuth = await GhlAuth.findOne({ locationId });
  if (!ghlAuth) {
    throw new Error('GHL Auth credentials not found for this location.');
  }

  // Semak jika token masih sah
  if (new Date() < new Date(ghlAuth.expires_at)) {
    return ghlAuth.access_token;
  }

  // Jika tamat tempoh, dapatkan token baru
  console.log('Refreshing GHL access token for location:', locationId);
  const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', new URLSearchParams({
    client_id: process.env.GHL_CLIENT_ID,
    client_secret: process.env.GHL_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: ghlAuth.refresh_token,
    user_type: 'Location',
  }), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const { access_token, refresh_token, expires_in } = tokenResponse.data;
  
  const expires_at = new Date();
  expires_at.setSeconds(expires_at.getSeconds() + expires_in);

  ghlAuth.access_token = access_token;
  ghlAuth.refresh_token = refresh_token; // GHL mungkin hantar refresh token baru
  ghlAuth.expires_at = expires_at;
  
  await ghlAuth.save();

  return access_token;
};

export { refreshAccessToken }; 