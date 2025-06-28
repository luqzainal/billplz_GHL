// server/routes/billplz.js
import express from 'express';
import axios from 'axios';
import BillplzCredential from '../models/BillplzCredential.js';

const router = express.Router();

/**
 * POST /api/billplz/verify-password
 * Verify admin password to unlock production settings.
 */
router.post('/verify-password', async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable is not set.');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: Admin password not set.'
    });
  }

  if (password && password === adminPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid password'
    });
  }
});

/**
 * POST /api/billplz/credentials
 * Save Billplz configuration.
 */
router.post('/credentials', async (req, res) => {
  try {
    // Password verification is now handled by /verify-password endpoint
    const { apiKey, xSignatureKey, collectionId, mode } = req.body;

    // Validate required fields
    if (!apiKey || !xSignatureKey || !collectionId || !mode) {
      return res.status(400).json({
        success: false,
        message: 'API Key, X-Signature Key, Collection ID, and Mode are required'
      });
    }

    // If record exists for this mode, update it; if not, create new
    let credentials = await BillplzCredential.findOne({ mode });

    if (credentials) {
      console.log('Updating existing credentials for mode:', mode);
      credentials.apiKey = apiKey;
      credentials.xSignatureKey = xSignatureKey;
      credentials.collectionId = collectionId;
      await credentials.save();
    } else {
      console.log('Creating new credentials for mode:', mode);
      credentials = new BillplzCredential({
        apiKey,
        xSignatureKey,
        collectionId,
        mode
      });
      await credentials.save();
    }

    res.json({
      success: true,
      message: 'Configuration saved successfully',
      credentials: {
        mode: credentials.mode,
        apiKey: credentials.apiKey,
        xSignatureKey: credentials.xSignatureKey,
        collectionId: credentials.collectionId
      }
    });
  } catch (error) {
    console.error('Error saving credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save configuration'
    });
  }
});

/**
 * GET /api/billplz/credentials
 * Get stored Billplz configuration for a specific mode.
 */
router.get('/credentials', async (req, res) => {
  try {
    const { mode } = req.query;
    if (!mode) {
      return res.status(400).json({ success: false, message: 'Mode parameter is required' });
    }

    const credentials = await BillplzCredential.findOne({ mode });
    
    if (!credentials) {
      return res.json({
        success: true,
        credentials: null
      });
    }

    res.json({
      success: true,
      credentials, // Return the whole object
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration information'
    });
  }
});

/**
 * GET /api/billplz/test-connection
 * Test connection to Billplz API using stored configuration for a specific mode.
 */
router.get('/test-connection', async (req, res) => {
  try {
    const { mode } = req.query;
    if (!mode) {
      return res.status(400).json({ success: false, message: 'Mode parameter is required' });
    }

    const credentials = await BillplzCredential.findOne({ mode });
    
    if (!credentials) {
      return res.status(404).json({
        success: false,
        message: `Configuration for ${mode} mode not found`,
      });
    }

    const baseUrl = credentials.mode === 'sandbox' 
      ? 'https://www.billplz-sandbox.com/api/v3'
      : 'https://www.billplz.com/api/v3';

    await axios.get(`${baseUrl}/check/api_key`, {
      auth: {
        username: credentials.apiKey,
        password: ''
      }
    });

    res.json({
      success: true,
      message: `Connection to ${mode} mode successful`,
    });
  } catch (error) {
    console.error(`Error testing ${mode} connection:`, error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || `Failed to connect to Billplz in ${mode} mode.`
    });
  }
});

/**
 * POST /api/billplz/pay
 * Endpoint to create payment
 */
router.post('/pay', async (req, res) => {
  try {
    const credentials = await BillplzCredential.findOne();
    
    if (!credentials) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    const baseUrl = credentials.mode === 'sandbox' 
      ? 'https://www.billplz-sandbox.com/api/v3'
      : 'https://www.billplz.com/api/v3';

    const response = await axios.post(
      `${baseUrl}/bills`,
      {
        collection_id: credentials.collectionId,
        email: req.body.email,
        name: req.body.name,
        amount: req.body.amount * 100, // Convert to cents
        description: req.body.description,
        callback_url: `${process.env.BASE_URL}/api/billplz/redirect`,
        redirect_url: `${process.env.BASE_URL}/api/billplz/redirect`
      },
      {
        auth: {
          username: credentials.apiKey,
          password: ''
        }
      }
    );

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to create payment'
    });
  }
});

/**
 * POST /api/billplz/query
 * Endpoint to query payment status
 */
router.post('/query', async (req, res) => {
  try {
    const credentials = await BillplzCredential.findOne();
    
    if (!credentials) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    const baseUrl = credentials.mode === 'sandbox' 
      ? 'https://www.billplz-sandbox.com/api/v3'
      : 'https://www.billplz.com/api/v3';

    const response = await axios.get(
      `${baseUrl}/bills/${req.body.billId}`,
      {
        auth: {
          username: credentials.apiKey,
          password: ''
        }
      }
    );

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error querying payment:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to query payment'
    });
  }
});

/**
 * GET /api/billplz/redirect
 * Handle Billplz redirect after payment
 */
router.get('/redirect', async (req, res) => {
  try {
    const credentials = await BillplzCredential.findOne();
    
    if (!credentials) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    console.log('Billplz callback received:', req.query);

    // Verify signature
    const signature = req.headers['x-billplz-signature'];
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Signature not found'
      });
    }

    // TODO: Implement signature verification

    res.json({
      success: true,
      message: 'Payment successful',
      data: req.query
    });
  } catch (error) {
    console.error('Error handling redirect:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment'
    });
  }
});

/**
 * POST /payment/verify
 * GHL queryUrl endpoint to verify payment status.
 */
router.post('/payment/verify', async (req, res) => {
  console.log('Received request on /payment/verify from GHL:', req.body);

  // GHL usually sends transactionId or some identifier in the body
  const { transactionId, paymentId } = req.body; 

  if (!transactionId && !paymentId) {
    console.error('No transactionId or paymentId received from GHL');
    return res.status(400).json({ status: 'error', message: 'Missing transaction identifier.' });
  }

  try {
    // TODO: Implement logic to query Billplz API
    // 1. Get Billplz credentials from the database.
    // 2. Use the transactionId/paymentId to find the corresponding Billplz Bill ID.
    // 3. Make an API call to Billplz to get the bill status.
    // 4. Map the Billplz status ('paid', 'due', 'overdue') to GHL expected statuses.

    console.log(`Querying status for transaction: ${transactionId || paymentId}`);

    // Placeholder response - assuming the payment is successful for now
    const ghlStatus = {
      status: 'paid', // Can be 'paid', 'unpaid', 'refunded', 'failed'
      amount: 100.00, // Optional: amount paid
      currency: 'MYR', // Optional: currency
      transactionId: transactionId || paymentId, // Optional
      providerData: {
        billplzBillId: 'bill_xyz', // Example data
        paidAt: new Date().toISOString()
      }
    };

    console.log('Sending response to GHL:', ghlStatus);
    res.json(ghlStatus);

  } catch (error) {
    console.error('Error in /payment/verify endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'An internal error occurred while verifying the payment.'
    });
  }
});

export default router;
