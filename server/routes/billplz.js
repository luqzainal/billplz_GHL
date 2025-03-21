// server/routes/billplz.js
import express from 'express';
import axios from 'axios';
const router = express.Router();

import BillplzCredential from '../models/BillplzCredential.js';

/**
 * POST /api/billplz/credentials
 * Save or update Billplz configuration.
 */
router.post('/credentials', async (req, res) => {
  try {
    console.log('Received request to save credentials:', {
      ...req.body,
      apiKey: req.body.apiKey ? '****' : undefined // Mask API key for security
    });

    const { apiKey, xSignatureKey, collectionId, mode, locationId } = req.body;

    if (!apiKey || !xSignatureKey || !collectionId || !locationId) {
      console.log('Validation error: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'API Key, X-Signature Key, Collection ID, and Location ID are required'
      });
    }

    // If record exists for this locationId, update it; if not, create new
    let credentials = await BillplzCredential.findOne({ locationId });
    if (credentials) {
      console.log('Updating existing credentials for locationId:', locationId);
      credentials.apiKey = apiKey;
      credentials.xSignatureKey = xSignatureKey;
      credentials.collectionId = collectionId;
      credentials.mode = mode;
      await credentials.save();
    } else {
      console.log('Creating new credentials for locationId:', locationId);
      credentials = new BillplzCredential({ locationId, apiKey, xSignatureKey, collectionId, mode });
      await credentials.save();
    }

    // Test connection before returning success
    const baseUrl = mode === 'production'
      ? 'https://www.billplz.com/api/v3'
      : 'https://www.billplz-sandbox.com/api/v3';

    console.log('Testing connection to Billplz:', {
      url: `${baseUrl}/collections/${collectionId}`,
      mode: mode,
      locationId: locationId
    });

    try {
      const testResponse = await axios.get(`${baseUrl}/collections/${collectionId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
        }
      });

      console.log('Connection successful:', testResponse.data);

      res.json({ 
        success: true, 
        message: 'Credentials saved and connection tested successfully',
        credentials: {
          locationId: credentials.locationId,
          apiKey: credentials.apiKey,
          xSignatureKey: credentials.xSignatureKey,
          collectionId: credentials.collectionId,
          mode: credentials.mode
        }
      });
    } catch (testError) {
      console.error('Error testing connection:', {
        status: testError.response?.status,
        data: testError.response?.data,
        message: testError.message
      });

      // Delete credentials if test fails
      if (credentials) {
        await BillplzCredential.deleteOne({ _id: credentials._id });
        console.log('Credentials deleted due to failed connection test');
      }

      res.status(400).json({ 
        success: false, 
        message: 'Failed to connect to Billplz. Please check your credentials.',
        error: testError.response?.data || testError.message 
      });
    }
  } catch (error) {
    console.error('Error saving credentials:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save credentials',
      error: error.message 
    });
  }
});

/**
 * GET /api/billplz/credentials/:locationId
 * Get stored Billplz configuration for specific locationId.
 */
router.get('/credentials/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const credentials = await BillplzCredential.findOne({ locationId });
    if (!credentials) {
      return res.json({ 
        success: false, 
        message: 'No credentials stored for this location' 
      });
    }
    res.json({ 
      success: true, 
      credentials: {
        locationId: credentials.locationId,
        apiKey: credentials.apiKey,
        xSignatureKey: credentials.xSignatureKey,
        collectionId: credentials.collectionId,
        mode: credentials.mode
      }
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get credentials',
      error: error.message 
    });
  }
});

/**
 * GET /api/billplz/test-connection/:locationId
 * Test connection to Billplz API using stored configuration for specific locationId.
 */
router.get('/test-connection/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const credentials = await BillplzCredential.findOne({ locationId });
    if (!credentials) {
      return res.status(400).json({ 
        success: false, 
        message: 'No credentials stored for this location' 
      });
    }

    const baseUrl = credentials.mode === 'production'
      ? 'https://www.billplz.com/api/v3'
      : 'https://www.billplz-sandbox.com/api/v3';

    const response = await axios.get(`${baseUrl}/collections/${credentials.collectionId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:`).toString('base64')}`
      }
    });

    res.json({ 
      success: true, 
      message: 'Connection successful',
      data: response.data 
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test connection',
      error: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/billplz/pay/:locationId
 * Endpoint to create payment for specific locationId
 */
router.post('/pay/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const credentials = await BillplzCredential.findOne({ locationId });
    if (!credentials) {
      return res.status(400).json({ 
        success: false, 
        message: 'No credentials stored for this location' 
      });
    }

    const { amount, name, email, phone, description } = req.body;
    if (!amount || !name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount, name and email are required' 
      });
    }

    const baseUrl = credentials.mode === 'production'
      ? 'https://www.billplz.com/api/v3'
      : 'https://www.billplz-sandbox.com/api/v3';

    const response = await axios.post(`${baseUrl}/bills`, {
      collection_id: credentials.collectionId,
      email: email,
      name: name,
      amount: amount * 100, // Convert to cents
      description: description || 'Payment via GHL',
      callback_url: `${process.env.BASE_URL}/api/billplz/redirect/${locationId}`,
      redirect_url: `${process.env.BASE_URL}/api/billplz/redirect/${locationId}`,
      phone: phone
    }, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      billId: response.data.id,
      url: response.data.url
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create bill',
      error: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/billplz/query/:locationId
 * Endpoint to query payment status for specific locationId
 */
router.post('/query/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const credentials = await BillplzCredential.findOne({ locationId });
    if (!credentials) {
      return res.status(400).json({ 
        success: false, 
        message: 'No credentials stored for this location' 
      });
    }

    const { billId } = req.body;
    if (!billId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bill ID is required' 
      });
    }

    const baseUrl = credentials.mode === 'production'
      ? 'https://www.billplz.com/api/v3'
      : 'https://www.billplz-sandbox.com/api/v3';

    const response = await axios.get(`${baseUrl}/bills/${billId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:`).toString('base64')}`
      }
    });

    res.json({
      success: true,
      status: response.data.state,
      paid: response.data.paid,
      amount: response.data.amount,
      paid_amount: response.data.paid_amount
    });
  } catch (error) {
    console.error('Error querying bill:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get bill status',
      error: error.response?.data || error.message 
    });
  }
});

/**
 * GET /api/billplz/redirect/:locationId
 * Endpoint to receive callback from Billplz after payment.
 */
router.get('/redirect/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const credentials = await BillplzCredential.findOne({ locationId });
    if (credentials) {
      // TODO: Implement X-Signature verification
      console.log('Billplz callback received for locationId:', locationId, req.query);
    }
    
    res.send("Payment has been processed. You may close this window.");
  } catch (error) {
    console.error('Error handling redirect:', error);
    res.status(500).send("Error processing payment.");
  }
});

const billplz = () => {
    console.log("Billplz route is working!");
  };
  

  export default router;
