import express from 'express';
import axios from 'axios';
import BillplzCredential from '../models/BillplzCredential.js';

const router = express.Router();

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Billplz Installation Failed</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-gray-100">
            <div class="min-h-screen flex items-center justify-center">
              <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                <div class="text-center">
                  <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-900 mb-2">Installation Failed</h2>
                  <p class="text-gray-600">Authorization code not found. Please try again.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
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

    // Return success page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Billplz Installation Successful</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100">
          <div class="min-h-screen flex items-center justify-center">
            <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
              <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Installation Successful!</h2>
                <p class="text-gray-600 mb-6">Billplz plugin has been installed successfully.</p>
                <div class="mt-6">
                  <a href="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Go to Dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Billplz Installation Failed</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100">
          <div class="min-h-screen flex items-center justify-center">
            <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
              <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Installation Failed</h2>
                <p class="text-gray-600">${error.response?.data?.error?.message || 'Failed in OAuth process'}</p>
                <div class="mt-6">
                  <a href="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Try Again
                  </a>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
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
      client_id: process.env.GHL_CLIENT_ID, // Assuming GHL_CLIENT_ID is in .env
      client_secret: process.env.GHL_CLIENT_SECRET, // Assuming GHL_CLIENT_SECRET is in .env
      grant_type: grant_type,
    };

    if (grant_type === 'authorization_code') {
      requestBody.code = code;
      if (user_type) { // user_type is optional for authorization_code but can be provided
        requestBody.user_type = user_type;
      }
      // redirect_uri is typically required for authorization_code flow
      // It should match the one used during the authorization request.
      requestBody.redirect_uri = process.env.GHL_REDIRECT_URI; // Assuming GHL_REDIRECT_URI is in .env
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
