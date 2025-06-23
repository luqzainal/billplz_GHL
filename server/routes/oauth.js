import express from 'express';
import axios from 'axios';
import { URLSearchParams } from 'url';
import BillplzCredential from '../models/BillplzCredential.js';

const router = express.Router();

router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GHL Integration Failed</title>
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
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Integration Failed</h2>
                <p class="text-gray-600">Authorization code not found. Please try again.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  const encodedParams = new URLSearchParams();
  encodedParams.set('client_id', process.env.CLIENT_ID);
  encodedParams.set('client_secret', process.env.CLIENT_SECRET);
  encodedParams.set('grant_type', 'authorization_code');
  encodedParams.set('code', code);
  encodedParams.set('refresh_token', '');
  encodedParams.set('user_type', '');
  encodedParams.set('redirect_uri', process.env.REDIRECT_URI);

  const options = {
    method: 'POST',
    url: 'https://services.leadconnectorhq.com/oauth/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    data: encodedParams,
  };

  const tokenResponse = await axios.request(options);

  if (!tokenResponse.data.access_token) {
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GHL Integration Failed</title>
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
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Integration Failed</h2>
                <p class="text-gray-600">Access token not received</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  // Get user info from GHL
  const userResponse = await axios.get('https://services.leadconnectorhq.com/users/me', {
    headers: {
      'Authorization': `Bearer ${tokenResponse.data.access_token}`,
      'Version': '2021-07-28'
    }
  });

  // Create payment provider integration
  const providerOptions = {
    method: 'POST',
    url: 'https://services.leadconnectorhq.com/payments/custom-provider/provider',
    params: { locationId: userResponse.data.locationId },
    headers: {
      Authorization: `Bearer ${tokenResponse.data.access_token}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    data: {
      name: 'Billplz Payment Integration',
      description: 'This payment gateway supports payments in Malaysia via Billplz.',
      paymentsUrl: `${process.env.BASE_URL}/payment`,
      queryUrl: `${process.env.BASE_URL}/payment/verify`,
      imageUrl: `${process.env.BASE_URL}/billplz-favicon.png`
    }
  };

  await axios.request(providerOptions);

  // Save GHL credentials
  const credentials = new BillplzCredential({
    apiKey: tokenResponse.data.access_token,
    xSignatureKey: tokenResponse.data.refresh_token,
    collectionId: userResponse.data.locationId,
    mode: 'production'
  });

  await credentials.save();

  // Return success page
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>GHL Integration Successful</title>
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
              <h2 class="text-2xl font-bold text-gray-900 mb-2">Integration Successful!</h2>
              <p class="text-gray-600 mb-6">GHL plugin has been integrated successfully.</p>
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
});

// Route untuk update payment provider config
router.post('/config', async (req, res) => {
  const { locationId, liveMode, testMode } = req.body;

  const credentials = await BillplzCredential.findOne({ collectionId: locationId });
  
  if (!credentials) {
    return res.status(404).json({ error: 'Credentials not found' });
  }

  const configOptions = {
    method: 'POST',
    url: 'https://services.leadconnectorhq.com/payments/custom-provider/connect',
    params: { locationId: locationId },
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    data: {
      live: {
        apiKey: liveMode.apiKey,
        publishableKey: liveMode.publishableKey
      },
      test: {
        apiKey: testMode.apiKey,
        publishableKey: testMode.publishableKey
      }
    }
  };

  const response = await axios.request(configOptions);
  
  res.json(response.data);
});

export default router;
