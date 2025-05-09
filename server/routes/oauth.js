import express from 'express';
import axios from 'axios';
// import BillplzCredential from '../models/BillplzCredential.js'; // Removed as it's not used in this GHL OAuth specific file

const router = express.Router();

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Application Connection Failed</title>
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
                  <h2 class="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h2>
                  <p class="text-gray-600">Authorization code not found. Please try again.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
    }

    // Exchange code for access token
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('client_id', process.env.CLIENT_ID); // Directly use CLIENT_ID
    params.append('client_secret', process.env.CLIENT_SECRET); // Directly use CLIENT_SECRET
    params.append('redirect_uri', process.env.REDIRECT_URI); // Directly use REDIRECT_URI
    // user_type can be optionally sent as 'Location' or 'Company' if needed.
    // params.append('user_type', 'Location');

    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!tokenResponse.data.access_token) {
      throw new Error('GHL Access token not received');
    }

    // Log GHL token data (access_token, locationId, companyId, userId etc.)
    // These tokens should be stored securely, e.g., in a database associated with the location.
    console.log('GHL Token Data:', tokenResponse.data);
    // const { access_token, refresh_token, locationId, companyId, userId, expires_in, scope, userType } = tokenResponse.data;

    // The following Billplz specific credential fetching and saving is incorrect in this GHL OAuth flow.
    // Billplz credentials should be configured by the user within the app's custom page.
    /*
    // Get user info
    const userResponse = await axios.get('https://www.billplz.com/api/v3/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenResponse.data.access_token}` // This would be GHL token, not Billplz
      }
    });

    // Save credentials
    const credentials = new BillplzCredential({
      apiKey: tokenResponse.data.access_token, // This was intended for Billplz token
      xSignatureKey: userResponse.data.x_signature_key,
      collectionId: userResponse.data.collection_id,
      mode: 'production'
    });

    await credentials.save();
    */

    // Return success page
    // The success message might need updating to reflect GHL app connection rather than Billplz plugin installation specifically.
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Application Connection Successful</title>
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
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Connection Successful!</h2>
                <p class="text-gray-600 mb-6">The application has been connected successfully.</p>
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
    const errorMessage = error.response?.data?.message || error.response?.data?.error_description || error.response?.data?.error?.message || 'Failed in OAuth process';
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Application Connection Failed</title>
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
                <h2 class="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h2>
                <p class="text-gray-600">${errorMessage}</p>
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
