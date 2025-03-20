// server/routes/billplz.js
import express from 'express';
import axios from 'axios';
const router = express.Router();

import BillplzCredential from '../models/BillplzCredential.js';

/**
 * POST /api/billplz/credentials
 * Simpan atau kemaskini konfigurasi Billplz.
 */
router.post('/credentials', async (req, res) => {
  try {
    console.log('Menerima permintaan untuk simpan kredential:', {
      ...req.body,
      apiKey: req.body.apiKey ? '****' : undefined // Mask API key for security
    });

    const { apiKey, xSignatureKey, collectionId, mode } = req.body;

    if (!apiKey || !xSignatureKey || !collectionId) {
      console.log('Validation error: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'API Key, X-Signature Key, dan Collection ID diperlukan'
      });
    }

    // Jika sudah ada rekod, kemaskini; jika tidak, buat baru
    let credentials = await BillplzCredential.findOne();
    if (credentials) {
      console.log('Mengemaskini kredential sedia ada');
      credentials.apiKey = apiKey;
      credentials.xSignatureKey = xSignatureKey;
      credentials.collectionId = collectionId;
      credentials.mode = mode;
      await credentials.save();
    } else {
      console.log('Membuat kredential baru');
      credentials = new BillplzCredential({ apiKey, xSignatureKey, collectionId, mode });
      await credentials.save();
    }

    // Test connection sebelum return success
    const baseUrl = mode === 'production'
      ? 'https://www.billplz.com/api/v3'
      : 'https://www.billplz-sandbox.com/api/v3';

    console.log('Menguji sambungan ke Billplz:', {
      url: `${baseUrl}/collections/${collectionId}`,
      mode: mode
    });

    try {
      const testResponse = await axios.get(`${baseUrl}/collections/${collectionId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
        }
      });

      console.log('Sambungan berjaya:', testResponse.data);

      res.json({ 
        success: true, 
        message: 'Kredential berjaya disimpan dan sambungan diuji',
        credentials: {
          apiKey: credentials.apiKey,
          xSignatureKey: credentials.xSignatureKey,
          collectionId: credentials.collectionId,
          mode: credentials.mode
        }
      });
    } catch (testError) {
      console.error('Error menguji sambungan:', {
        status: testError.response?.status,
        data: testError.response?.data,
        message: testError.message
      });

      // Delete credentials if test fails
      if (credentials) {
        await BillplzCredential.deleteOne({ _id: credentials._id });
        console.log('Kredential dipadam kerana ujian sambungan gagal');
      }

      res.status(400).json({ 
        success: false, 
        message: 'Gagal menyambung ke Billplz. Sila periksa kredential anda.',
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
      message: 'Gagal menyimpan kredential',
      error: error.message 
    });
  }
});

/**
 * GET /api/billplz/credentials
 * Dapatkan konfigurasi Billplz yang tersimpan.
 */
router.get('/credentials', async (req, res) => {
  try {
    const credentials = await BillplzCredential.findOne();
    if (!credentials) {
      return res.json({ 
        success: false, 
        message: 'Tiada kredential yang disimpan' 
      });
    }
    res.json({ 
      success: true, 
      credentials: {
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
      message: 'Gagal mendapatkan kredential',
      error: error.message 
    });
  }
});

/**
 * GET /api/billplz/test-connection
 * Uji sambungan ke API Billplz menggunakan konfigurasi yang disimpan.
 */
router.get('/test-connection', async (req, res) => {
  try {
    const credentials = await BillplzCredential.findOne();
    if (!credentials) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tiada kredential yang disimpan' 
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
      message: 'Sambungan berjaya',
      data: response.data 
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal menguji sambungan',
      error: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/billplz/pay
 * Endpoint untuk membuat pembayaran
 */
router.post('/pay', async (req, res) => {
  try {
    const credentials = await BillplzCredential.findOne();
    if (!credentials) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tiada kredential yang disimpan' 
      });
    }

    const { amount, name, email, phone, description } = req.body;
    if (!amount || !name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount, name dan email diperlukan' 
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
      callback_url: `${process.env.BASE_URL}/api/billplz/redirect`,
      redirect_url: `${process.env.BASE_URL}/api/billplz/redirect`,
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
      message: 'Gagal membuat bil',
      error: error.response?.data || error.message 
    });
  }
});

/**
 * POST /api/billplz/query
 * Endpoint untuk query status pembayaran
 */
router.post('/query', async (req, res) => {
  try {
    const credentials = await BillplzCredential.findOne();
    if (!credentials) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tiada kredential yang disimpan' 
      });
    }

    const { billId } = req.body;
    if (!billId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bill ID diperlukan' 
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
      message: 'Gagal mendapatkan status bil',
      error: error.response?.data || error.message 
    });
  }
});

/**
 * GET /api/billplz/redirect
 * Endpoint untuk menerima callback daripada Billplz selepas pembayaran.
 */
router.get('/redirect', (req, res) => {
  // Verify X-Signature
  const credentials = BillplzCredential.findOne();
  if (credentials) {
    // TODO: Implement X-Signature verification
    console.log('Billplz callback diterima:', req.query);
  }
  
  res.send("Pembayaran berjaya diproses. Sila tutup tetingkap ini.");
});

const billplz = () => {
    console.log("Billplz route is working!");
  };
  

  export default router;
