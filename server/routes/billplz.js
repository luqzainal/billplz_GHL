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
    const { apiKey, xSignatureKey, collectionId, mode } = req.body;

    // Jika sudah ada rekod, kemaskini; jika tidak, buat baru.
    let credentials = await BillplzCredential.findOne();
    if (credentials) {
      credentials.apiKey = apiKey;
      credentials.xSignatureKey = xSignatureKey;
      credentials.collectionId = collectionId;
      credentials.mode = mode;
      await credentials.save();
    } else {
      credentials = new BillplzCredential({ apiKey, xSignatureKey, collectionId, mode });
      await credentials.save();
    }
    res.json({ success: true, credentials });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/billplz/credentials
 * Dapatkan konfigurasi Billplz yang tersimpan.
 */
router.get('/credentials', async (req, res) => {
  try {
    const credentials = await BillplzCredential.findOne();
    res.json({ success: true, credentials });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/billplz/test-connection
 * Uji sambungan ke API Billplz menggunakan konfigurasi yang disimpan.
 *
 * Contoh endpoint ini akan mengambil maklumat collection daripada Billplz.
 */
router.get('/test-connection', async (req, res) => {
  try {
    // Dapatkan konfigurasi Billplz dari DB
    const credentials = await BillplzCredential.findOne();
    if (!credentials) {
      return res.status(400).json({ success: false, message: 'Billplz credentials belum dikonfigurasi.' });
    }

    // Tentukan URL API Billplz berdasarkan mode
    const baseUrl = credentials.mode === 'production'
      ? 'https://www.billplz.com/api/v3'
      : 'https://www.billplz-sandbox.com/api/v3';

    // Contoh: Mengambil maklumat collection untuk menguji sambungan
    const response = await axios.get(`${baseUrl}/collections/${credentials.collectionId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:`).toString('base64')}`
      }
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

/**
 * GET /api/billplz/redirect
 * Endpoint untuk menerima callback daripada Billplz selepas pembayaran.
 */
router.get('/redirect', (req, res) => {
  console.log('Billplz callback diterima:', req.query);
  
  // Lakukan proses yang perlu (contohnya, kemaskini status pembayaran) di sini
  
  res.send("Pembayaran berjaya diproses. Sila tutup tetingkap ini.");
});

const billplz = () => {
    console.log("Billplz route is working!");
  };
  

  export default router;
