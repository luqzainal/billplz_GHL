import express from 'express';
import axios from 'axios';
import { URLSearchParams } from 'url';
import BillplzCredential from '../models/BillplzCredential.js';

const router = express.Router();

router.get('/callback', async (req, res) => {
  const { code } = req.query;

  console.log('OAuth callback received with code:', code);
  console.log('Environment variables check:', {
    CLIENT_ID: process.env.CLIENT_ID ? 'Set' : 'Missing',
    CLIENT_SECRET: process.env.CLIENT_SECRET ? 'Set' : 'Missing',
    REDIRECT_URI: process.env.REDIRECT_URI ? 'Set' : 'Missing',
    REACT_APP_API_URL: process.env.REACT_APP_API_URL ? 'Set' : 'Missing'
  });

  if (!code) {
    console.error('No authorization code received');
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
                <p class="text-gray-600">No authorization code received</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  // Validate authorization code format
  if (typeof code !== 'string' || code.trim() === '') {
    console.error('Invalid authorization code format:', code);
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
                <p class="text-gray-600">Invalid authorization code format</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  try {
    // Check environment variables
    if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.REDIRECT_URI || !process.env.REACT_APP_API_URL) {
      console.error('Missing required environment variables');
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
                  <p class="text-gray-600">Missing required environment variables</p>
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
    encodedParams.set('redirect_uri', process.env.REDIRECT_URI);

    console.log('OAuth token request params:', {
      client_id: process.env.CLIENT_ID,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.REDIRECT_URI
    });

    // Validate environment variables format
    if (!process.env.CLIENT_ID || process.env.CLIENT_ID.trim() === '') {
      throw new Error('CLIENT_ID is empty or invalid');
    }
    if (!process.env.CLIENT_SECRET || process.env.CLIENT_SECRET.trim() === '') {
      throw new Error('CLIENT_SECRET is empty or invalid');
    }
    if (!process.env.REDIRECT_URI || process.env.REDIRECT_URI.trim() === '') {
      throw new Error('REDIRECT_URI is empty or invalid');
    }

    // Validate redirect URI format
    try {
      new URL(process.env.REDIRECT_URI);
    } catch (error) {
      throw new Error('REDIRECT_URI is not a valid URL');
    }

    const options = {
      method: 'POST',
      url: 'https://services.leadconnectorhq.com/oauth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      data: encodedParams.toString(),
      timeout: 10000 // 10 second timeout
    };

    console.log('Making OAuth token request to:', options.url);
    console.log('Request data:', encodedParams.toString());
    console.log('Request headers:', options.headers);
    
    const tokenResponse = await axios.request(options);
    
    console.log('OAuth token response status:', tokenResponse.status);
    console.log('OAuth token response data:', tokenResponse.data);

    if (!tokenResponse.data.access_token) {
      console.error('No access token received:', tokenResponse.data);
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
      },
      timeout: 10000
    });

    // Clean up base URL by removing trailing slash
    const cleanBaseUrl = process.env.REACT_APP_API_URL.replace(/\/$/, '');

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
        paymentsUrl: `${cleanBaseUrl}/payment`,
        queryUrl: `${cleanBaseUrl}/payment/verify`,
        imageUrl: `${cleanBaseUrl}/billplz-favicon.png`
      },
      timeout: 10000
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
  } catch (error) {
    console.error('Error in OAuth callback:', error.message);
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.request) {
      console.error('Error request:', error.request);
    }
    res.status(500).send(`
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
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Installation Failed</h2>
                <p class="text-gray-600">${error.response?.data?.error?.message || error.response?.data?.message || error.message || 'An unexpected error occurred during the OAuth process.'}</p>
                ${error.response?.data ? `<pre class="mt-4 text-xs text-gray-500 text-left overflow-auto">${JSON.stringify(error.response.data, null, 2)}</pre>` : ''}
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  }
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
