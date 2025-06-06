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
    // Step 1: Exchange code for access token
    console.log('Step 1: Exchanging authorization code for tokens...');
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      user_type: 'Location',
      redirect_uri: process.env.REDIRECT_URI,
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    console.log('Step 1 successful: Tokens received.');

    const { 
      access_token, 
      refresh_token, 
      expires_in, 
      locationId, 
      companyId, 
      userId 
    } = tokenResponse.data;

    // Step 2: Save tokens to database
    console.log('Step 2: Saving tokens to the database...');
    const expires_at = new Date();
    expires_at.setSeconds(expires_at.getSeconds() + expires_in);

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
    console.log('Step 2 successful: Tokens saved.');

    // Step 3: Create integration provider in GHL
    console.log('Step 3: Creating integration provider in GHL...');
    if (!process.env.APP_URL) {
        console.error('CRITICAL: APP_URL environment variable is not set. This will cause the integration creation to fail.');
        throw new Error('Server configuration error: APP_URL is not set.');
    }
    await axios.post(
      `https://services.leadconnectorhq.com/payments/custom-provider/provider?locationId=${locationId}`,
      {
        name: 'Billplz',
        description: 'Accept payments through Billplz, Malaysia\'s favorite payment gateway.',
        paymentsUrl: `${process.env.APP_URL}/api/billplz/payment`,
        queryUrl: `${process.env.APP_URL}/api/billplz/query`,
        imageUrl: `${process.env.APP_URL}/billplz-logo.png`,
      },
      {
        headers: { Authorization: `Bearer ${access_token}`, Version: '2021-07-28' },
      }
    );
    console.log('Step 3 successful: Integration provider created.');

    // Step 4: Redirect to frontend
    console.log('Step 4: Redirecting to the frontend application...');
    res.redirect(`/?locationId=${locationId}`);

  } catch (error) {
    const step = error.message.includes('APP_URL') ? 'Step 3 (Integration Creation)' 
        : error.config?.url.includes('token') ? 'Step 1 (Token Exchange)' 
        : error.config?.url.includes('provider') ? 'Step 3 (Integration Creation)'
        : 'Unknown Step';
        
    console.error(`Error during GHL OAuth callback at ${step}:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    
    let userMessage = `An unexpected error occurred during the setup process. Please contact support.`;
    if (step === 'Step 1 (Token Exchange)') {
        userMessage = `Could not get authorization from GHL. Please check your Client ID and Client Secret, and then try reinstalling the app.`;
    } else if (step === 'Step 3 (Integration Creation)') {
        userMessage = `Authentication was successful, but the app failed to register itself inside GHL. This is likely due to a server configuration issue (missing APP_URL). Please contact support.`;
    }

    res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Installation Failed</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-100 font-sans">
            <div class="min-h-screen flex items-center justify-center">
                <div class="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
                    <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                        <svg class="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">Installation Failed</h1>
                    <p class="text-gray-600 text-lg mb-4">We encountered an error during the installation process.</p>
                    <div class="bg-red-50 text-red-700 p-4 rounded-md text-left">
                        <p class="font-semibold">Error Details:</p>
                        <p>${userMessage}</p>
                    </div>
                    <p class="text-sm text-gray-500 mt-6">Please try reinstalling the app from the GHL Marketplace. If the issue continues, please contact our support team.</p>
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
