import express from 'express';
import axios from 'axios';
import BillplzCredential from '../models/BillplzCredential.js';

const router = express.Router();

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code not found'
      });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.billplz.com/api/v3/oauth/token', {
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI
    });

    if (!tokenResponse.data.access_token) {
      throw new Error('Access token not received');
    }

    // Get user info
    const userResponse = await axios.get('https://www.billplz.com/api/v3/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenResponse.data.access_token}`
      }
    });

    // Save credentials
    const credentials = new BillplzCredential({
      apiKey: tokenResponse.data.access_token,
      xSignatureKey: userResponse.data.x_signature_key,
      collectionId: userResponse.data.collection_id,
      mode: 'production'
    });

    await credentials.save();

    res.json({
      success: true,
      message: 'OAuth successful',
      data: {
        access_token: tokenResponse.data.access_token,
        user: userResponse.data
      }
    });
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed in OAuth process'
    });
  }
});

export default router;
