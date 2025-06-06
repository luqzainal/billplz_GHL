import express from 'express';
import axios from 'axios';
import BillplzCredential from '../models/BillplzCredential.js';
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
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      user_type: 'Location',
      redirect_uri: process.env.REDIRECT_URI,
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

router.post('/ghl-token', async (req, res) => {
  try {
    const { code, grant_type, refresh_token: req_refresh_token, user_type } = req.body;

    // Validate required fields based on grant_type
    if (!grant_type) {
      return res.status(400).json({ message: 'grant_type is required' });
    }
    if (grant_type === 'authorization_code' && !code) {
      return res.status(400).json({ message: 'code is required for grant_type authorization_code' });
    }
    if (grant_type === 'refresh_token' && !req_refresh_token) {
      return res.status(400).json({ message: 'refresh_token is required for grant_type refresh_token' });
    }

    const requestBody = {
      client_id: process.env.CLIENT_ID, // Updated to use CLIENT_ID directly
      client_secret: process.env.CLIENT_SECRET, // Updated to use CLIENT_SECRET directly
      grant_type: grant_type,
    };

    if (grant_type === 'authorization_code') {
      requestBody.code = code;
      if (user_type) { // user_type is optional for authorization_code but can be provided
        requestBody.user_type = user_type;
      }
      // redirect_uri is typically required for authorization_code flow
      // It should match the one used during the authorization request.
      requestBody.redirect_uri = process.env.REDIRECT_URI; // Updated to use REDIRECT_URI directly
    } else if (grant_type === 'refresh_token') {
      requestBody.refresh_token = req_refresh_token;
      if (user_type) { // user_type can also be provided with refresh_token
        requestBody.user_type = user_type;
      }
    }

    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', new URLSearchParams(requestBody).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      throw new Error('Access token not received from GHL');
    }

    // Send back the successful response from GHL
    res.status(200).json(tokenResponse.data);

  } catch (error) {
    console.error('Error in GHL token exchange:', error.response ? error.response.data : error.message);
    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response && error.response.data && error.response.data.error_description
      ? error.response.data.error_description
      : error.response && error.response.data && error.response.data.message
      ? error.response.data.message
      : 'Failed to exchange GHL token';
    res.status(statusCode).json({ message: errorMessage, details: error.response ? error.response.data : null });
  }
});

router.post('/ghl-payment-integration', async (req, res) => {
  try {
    const { locationId } = req.query;
    const { name, description, paymentsUrl, queryUrl, imageUrl } = req.body;
    const accessToken = req.headers.authorization; // Expects "Bearer YOUR_ACCESS_TOKEN"
    const apiVersion = '2021-07-28'; // As per GHL documentation

    if (!locationId) {
      return res.status(400).json({ message: 'locationId query parameter is required' });
    }
    if (!accessToken) {
      return res.status(400).json({ message: 'Authorization header is required' });
    }
    if (!name || !description || !paymentsUrl || !queryUrl || !imageUrl) {
      return res.status(400).json({ message: 'Missing required fields in body: name, description, paymentsUrl, queryUrl, imageUrl' });
    }

    const ghlApiUrl = `https://services.leadconnectorhq.com/payments/custom-provider/provider?locationId=${locationId}`;

    const response = await axios.post(ghlApiUrl, {
      name,
      description,
      paymentsUrl,
      queryUrl,
      imageUrl
    }, {
      headers: {
        'Authorization': accessToken,
        'Version': apiVersion,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    res.status(response.status).json(response.data);

  } catch (error) {
    console.error('Error in GHL payment integration:', error.response ? error.response.data : error.message);
    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response && error.response.data && error.response.data.message
      ? error.response.data.message
      : 'Failed to create GHL payment integration';
    res.status(statusCode).json({ message: errorMessage, details: error.response ? error.response.data : null });
  }
});

router.post('/ghl-provider-config', async (req, res) => {
  try {
    const { locationId } = req.query;
    const { live, test } = req.body;
    const accessToken = req.headers.authorization; // Expects "Bearer YOUR_ACCESS_TOKEN"
    const apiVersion = '2021-07-28'; // As per GHL documentation

    if (!locationId) {
      return res.status(400).json({ message: 'locationId query parameter is required' });
    }
    if (!accessToken) {
      return res.status(400).json({ message: 'Authorization header is required' });
    }
    if (!live || !live.apiKey || !live.publishableKey || !test || !test.apiKey || !test.publishableKey) {
      return res.status(400).json({ message: 'Missing required fields in body: live (apiKey, publishableKey) and test (apiKey, publishableKey)' });
    }

    const ghlApiUrl = `https://services.leadconnectorhq.com/payments/custom-provider/connect?locationId=${locationId}`;

    const response = await axios.post(ghlApiUrl, {
      live,
      test
    }, {
      headers: {
        'Authorization': accessToken,
        'Version': apiVersion,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    res.status(response.status).json(response.data);

  } catch (error) {
    console.error('Error in GHL provider config:', error.response ? error.response.data : error.message);
    const statusCode = error.response ? error.response.status : 500;
    const errorMessage = error.response && error.response.data && error.response.data.message
      ? error.response.data.message
      : 'Failed to create GHL provider config';
    res.status(statusCode).json({ message: errorMessage, details: error.response ? error.response.data : null });
  }
});

export default router;
