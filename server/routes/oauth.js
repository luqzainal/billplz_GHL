import express from 'express';
import axios from 'axios';
import { URLSearchParams } from 'url';
import BillplzCredential from '../models/BillplzCredential.js';
import GhlCredential from '../models/GhlCredential.js';

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

  // Debug environment variables values (without exposing secrets)
  console.log('Environment variables debug:', {
    CLIENT_ID_LENGTH: process.env.CLIENT_ID ? process.env.CLIENT_ID.length : 0,
    CLIENT_SECRET_LENGTH: process.env.CLIENT_SECRET ? process.env.CLIENT_SECRET.length : 0,
    REDIRECT_URI: process.env.REDIRECT_URI,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL
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

  // Additional validation for authorization code
  console.log('Authorization code validation:', {
    codeLength: code.length,
    codeStartsWith: code.substring(0, 10) + '...',
    codeEndsWith: '...' + code.substring(code.length - 10),
    codeContainsSpecialChars: /[^a-zA-Z0-9\-_\.]/.test(code)
  });

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
    encodedParams.set('user_type', 'Location');
    encodedParams.set('refresh_token', '');
    encodedParams.set('redirect_uri', process.env.REDIRECT_URI);

    console.log('OAuth token request params (body):', {
      client_id: process.env.CLIENT_ID ? 'Set' : 'Not Set',
      client_secret: process.env.CLIENT_SECRET ? 'Set' : 'Not Set',
      grant_type: 'authorization_code',
      code: code,
      user_type: 'Location',
      refresh_token: '(empty)',
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

    // Additional validation for GHL credentials format
    console.log('GHL Credentials validation:', {
      CLIENT_ID_FORMAT: process.env.CLIENT_ID.includes('ghl_') ? 'Valid GHL format' : 'May not be GHL format',
      CLIENT_SECRET_FORMAT: process.env.CLIENT_SECRET.length >= 20 ? 'Reasonable length' : 'Too short',
      REDIRECT_URI_PROTOCOL: process.env.REDIRECT_URI.startsWith('https://') ? 'HTTPS' : 'Non-HTTPS'
    });

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
    
    console.log('=== STEP 1: OAuth Token Request ===');
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

    console.log('=== STEP 2: Payment Provider Creation ===');
    console.log('Access token received:', tokenResponse.data.access_token ? 'YES' : 'NO');
    console.log('Location ID:', tokenResponse.data.locationId);
    console.log('Base URL:', process.env.REACT_APP_API_URL);

    // Clean up base URL by removing trailing slash
    const cleanBaseUrl = process.env.REACT_APP_API_URL.replace(/\/$/, '');

    // Create payment provider integration
    const providerOptions = {
      method: 'POST',
      url: 'https://services.leadconnectorhq.com/payments/custom-provider/provider',
      params: { locationId: tokenResponse.data.locationId },
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

    console.log('Provider creation URL:', providerOptions.url);
    console.log('Provider creation params:', providerOptions.params);
    console.log('Provider creation headers:', providerOptions.headers);
    console.log('Provider creation data:', providerOptions.data);

    const providerResponse = await axios.request(providerOptions);
    
    console.log('Provider creation response status:', providerResponse.status);
    // Log the full response data for detailed inspection
    console.log('Provider creation response data:', JSON.stringify(providerResponse.data, null, 2));

    if (providerResponse.status >= 200 && providerResponse.status < 300) {
      console.log('✅ SUCCESS: Custom provider appears to have been registered successfully with GHL.');
    } else {
      console.warn(`⚠️ WARNING: Provider registration call returned a non-success status code: ${providerResponse.status}`);
    }

    // Save GHL credentials correctly
    const { access_token, refresh_token, locationId } = tokenResponse.data;

    console.log(`Saving GHL credentials for locationId: ${locationId}`);

    // Use updateOne with upsert to create a new document if none exists, or update if it does.
    await GhlCredential.updateOne(
      { locationId: locationId },
      {
        $set: {
          accessToken: access_token,
          refreshToken: refresh_token,
        }
      },
      { upsert: true } // This option creates the document if it does not exist.
    );
    
    console.log('GHL credentials saved successfully.');

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

    // Handle 'invalid_grant' error, which often means the code was already used.
    // This can happen on a page refresh. We can optimistically redirect to the app's homepage.
    if (error.response?.data?.error === 'invalid_grant') {
      console.warn('Caught "invalid_grant" error. This might be a harmless duplicate request. Redirecting to home page.');
      // The frontend is a SPA, so redirecting to the root will load the React app,
      // which will then handle routing to the config page.
      return res.redirect('/'); 
    }
    
    // Specific handling for 403 errors
    if (error.response && error.response.status === 403) {
      console.error('=== 403 FORBIDDEN ERROR ANALYSIS ===');
      console.error('This usually means:');
      console.error('1. Invalid client credentials (CLIENT_ID/CLIENT_SECRET)');
      console.error('2. Incorrect redirect URI');
      console.error('3. Authorization code already used or expired');
      console.error('4. Insufficient permissions for the API endpoint');
      console.error('5. Rate limiting or IP restrictions');
      
      // Log request details for debugging
      if (error.config) {
        console.error('Failed request URL:', error.config.url);
        console.error('Failed request method:', error.config.method);
        console.error('Failed request headers:', error.config.headers);
      }
    }
    
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
                ${error.response?.status === 403 ? `
                <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 class="text-sm font-medium text-yellow-800 mb-2">Possible Solutions:</h3>
                  <ul class="text-xs text-yellow-700 space-y-1">
                    <li>• Check if CLIENT_ID and CLIENT_SECRET are correct</li>
                    <li>• Verify REDIRECT_URI matches exactly with GHL app settings</li>
                    <li>• Ensure authorization code hasn't expired (try again)</li>
                    <li>• Check if your GHL app has required permissions</li>
                  </ul>
                </div>
                ` : ''}
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
