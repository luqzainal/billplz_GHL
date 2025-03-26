// server/routes/billplz.js
import express from 'express';
import axios from 'axios';
import BillplzCredential from '../models/BillplzCredential.js';

const router = express.Router();

/**
 * POST /api/billplz/credentials
 * Save Billplz configuration.
 */
router.post('/credentials', async (req, res) => {
  try {
    const { apiKey, xSignatureKey, collectionId, mode } = req.body;

    if (!apiKey || !xSignatureKey || !collectionId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
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
 * Get stored Billplz configuration.
 */
router.get('/credentials', async (req, res) => {
  try {
    const credentials = await BillplzCredential.findOne();
    
    if (!credentials) {
      return res.json({
        success: true,
        credentials: null
      });
    }

    res.json({
      success: true,
      credentials: {
        mode: credentials.mode,
        apiKey: credentials.apiKey,
        xSignatureKey: credentials.xSignatureKey,
        collectionId: credentials.collectionId
      }
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
 * Test connection to Billplz API using stored configuration.
 */
router.get('/test-connection', async (req, res) => {
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

    const response = await axios.get(`${baseUrl}/collections/${credentials.collectionId}`, {
      auth: {
        username: credentials.apiKey,
        password: ''
      }
    });

    if (response.status === 200) {
      res.json({
        success: true,
        message: 'Connection successful',
        mode: credentials.mode
      });
    } else {
      throw new Error('Unexpected response from Billplz API');
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to connect to Billplz'
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
      message: error.response?.data?.error?.message || 'Failed to check payment status'
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

export default router;
