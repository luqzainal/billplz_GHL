import express from 'express';
import axios from 'axios';
import GhlAuth from '../models/GhlAuth.js';

const router = express.Router();

router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code not found.');
  }

  try {
    // Tukar kod dengan access token
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      user_type: 'Location',
      redirect_uri: process.env.GHL_REDIRECT_URI,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { 
      access_token, 
      refresh_token, 
      expires_in, 
      locationId, 
      companyId, 
      userId 
    } = tokenResponse.data;

    // Kira masa tamat tempoh
    const expires_at = new Date();
    expires_at.setSeconds(expires_at.getSeconds() + expires_in);

    // Simpan atau kemas kini token dalam pangkalan data
    await GhlAuth.findOneAndUpdate(
      { locationId },
      {
        companyId,
        userId,
        access_token,
        refresh_token,
        expires_at,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Cipta integrasi baru dalam GHL
    await axios.post(
      `https://services.leadconnectorhq.com/payments/custom-provider/provider?locationId=${locationId}`,
      {
        name: 'Billplz',
        description: 'Accept payments through Billplz, Malaysia\'s favorite payment gateway.',
        paymentsUrl: `${process.env.APP_URL}/billplz/payment`,
        queryUrl: `${process.env.APP_URL}/billplz/query`,
        imageUrl: `${process.env.APP_URL}/billplz-logo.png`,
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Version: '2021-07-28',
        },
      }
    );

    // Ubah hala ke halaman utama
    res.redirect(`/?locationId=${locationId}`);

  } catch (error) {
    console.error('Error during GHL OAuth callback:', error.response ? error.response.data : error.message);
    res.status(500).send('Authentication failed.');
  }
});

export default router;
