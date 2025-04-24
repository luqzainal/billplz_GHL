# Billplz-GHL Payment Integration

Integrasi plugin ini membolehkan sistem pembayaran Billplz digunakan bersama GoHighLevel (GHL). Ia memudahkan pengurusan transaksi pembayaran dalam platform anda.

## 🚀 Ciri-ciri Utama
- Integrasi lancar antara Billplz dan GHL
- Sokongan untuk pembayaran satu kali dan berulang
- Status pembayaran dikemaskini secara automatik

## 📦 Keperluan
- Node.js
- MongoDB
- Akaun Billplz
- Akaun GoHighLevel (GHL)

## ⚙️ Cara Pasang

1. **Clone Repository:**  
   ```bash
   git clone https://github.com/luqzainal/billplz_GHL.git
   cd billplz_GHL
   ```

2. **Pasang Keperluan:**  
   ```bash
   npm install
   ```

3. **Konfigurasi Fail .env:**  
   Buat fail `.env` berdasarkan contoh `.env.example`:
   ```env
   BILLPLZ_API_KEY=your_billplz_api_key
   BILLPLZ_COLLECTION_ID=your_collection_id
   GHL_API_KEY=your_ghl_api_key
   MONGODB_URI=mongodb://localhost:27017/billplz_ghl
   ```

4. **Jalankan Aplikasi:**  
   ```bash
   npm run dev
   ```

## 🌐 Deploy ke DigitalOcean

1. **Push ke GitHub:**  
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy di DigitalOcean:**  
   Gunakan **App Platform** untuk deploy dari repo GitHub anda.

## 📝 API Endpoint

- **POST /payment** - Buat pembayaran baru
- **GET /payment/status/:id** - Semak status pembayaran

## 🤝 Sumbangan
Sumbangan dialu-alukan! Fork repo ini, buat perubahan, dan hantar pull request.

## 📄 Lesen
Projek ini dilesenkan di bawah [MIT License](LICENSE).

