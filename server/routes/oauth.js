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

export default router;
