import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Setup axios baseURL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BillplzConfig = () => {
  const [sandboxCredentials, setSandboxCredentials] = useState({
    apiKey: '',
    xSignatureKey: '',
    collectionId: '',
    mode: 'sandbox'
  });

  const [productionCredentials, setProductionCredentials] = useState({
    apiKey: '',
    xSignatureKey: '',
    collectionId: '',
    mode: 'production'
  });

  const [activeMode, setActiveMode] = useState('sandbox');
  const [loadingStates, setLoadingStates] = useState({
    sandbox: false,
    production: false
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [sandboxConnected, setSandboxConnected] = useState(false);
  const [productionConnected, setProductionConnected] = useState(false);

  // Dapatkan kredential yang sedia ada bila komponen dimuat
  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await axios.get('/api/billplz/credentials');
      if (response.data.success && response.data.credentials) {
        const credentials = response.data.credentials;
        if (credentials.mode === 'sandbox') {
          setSandboxCredentials(credentials);
          setSandboxConnected(true);
        } else {
          setProductionCredentials(credentials);
          setProductionConnected(true);
        }
        setSuccessMessage(`Billplz telah dikonfigurasi dengan jayanya dalam mode ${credentials.mode}!`);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
      setError('Gagal mendapatkan kredential dari server');
    }
  };

  const handleInputChange = (e, mode) => {
    const { name, value } = e.target;
    if (mode === 'sandbox') {
      setSandboxCredentials(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setProductionCredentials(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError(null);
    setSuccessMessage('');
  };

  const handleConnect = async (mode) => {
    // Set loading state hanya untuk mode yang dipilih
    setLoadingStates(prev => ({ ...prev, [mode]: true }));
    setError(null);
    setSuccessMessage('');
    const credentials = mode === 'sandbox' ? sandboxCredentials : productionCredentials;

    try {
      console.log(`Menghantar kredential ${mode} ke server:`, {
        ...credentials,
        apiKey: '****' // Mask API key in logs
      });

      const saveResponse = await axios.post('/api/billplz/credentials', credentials);
      
      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.message || 'Gagal menyimpan kredential');
      }

      console.log('Kredential berjaya disimpan, menguji sambungan...');
      
      const testResponse = await axios.get('/api/billplz/test-connection');
      
      if (testResponse.data.success) {
        if (mode === 'sandbox') {
          setSandboxConnected(true);
          setProductionConnected(false);
        } else {
          setProductionConnected(true);
          setSandboxConnected(false);
        }
        setSuccessMessage(`Tahniah! Billplz telah berjaya dikonfigurasi dalam mode ${mode}. Anda boleh mula guna sistem pembayaran sekarang.`);
        console.log('Sambungan berjaya diuji');
      } else {
        throw new Error(testResponse.data.message || 'Ujian sambungan gagal');
      }
    } catch (error) {
      console.error('Error connecting to Billplz:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Gagal menyambung ke Billplz. Sila periksa kredential anda.'
      );
      if (mode === 'sandbox') {
        setSandboxConnected(false);
      } else {
        setProductionConnected(false);
      }
      setSuccessMessage('');
    } finally {
      // Reset loading state hanya untuk mode yang dipilih
      setLoadingStates(prev => ({ ...prev, [mode]: false }));
    }
  };

  const renderForm = (mode) => {
    const credentials = mode === 'sandbox' ? sandboxCredentials : productionCredentials;
    const isConnected = mode === 'sandbox' ? sandboxConnected : productionConnected;
    const isLoading = loadingStates[mode]; // Guna loading state untuk mode yang spesifik
    const handleChange = (e) => handleInputChange(e, mode);

    return (
      <form onSubmit={(e) => { e.preventDefault(); handleConnect(mode); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            API Key
          </label>
          <input
            type="text"
            name="apiKey"
            value={credentials.apiKey}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
            placeholder={`Masukkan API Key ${mode} dari Billplz`}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            X-Signature Key
          </label>
          <input
            type="text"
            name="xSignatureKey"
            value={credentials.xSignatureKey}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
            placeholder={`Masukkan X-Signature Key ${mode} dari Billplz`}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Collection ID
          </label>
          <input
            type="text"
            name="collectionId"
            value={credentials.collectionId}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
            placeholder={`Masukkan Collection ID ${mode} dari Billplz`}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full p-3 rounded text-white font-medium transition-colors ${
            isConnected 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sedang Menyambung...
            </span>
          ) : isConnected ? (
            'Tersambung ✓'
          ) : (
            'Sambung'
          )}
        </button>

        {isConnected && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-medium mb-2">Status Sambungan {mode.charAt(0).toUpperCase() + mode.slice(1)}</h3>
            <p className="text-sm text-gray-600">
              Collection ID: <span className="font-medium">{credentials.collectionId}</span>
            </p>
          </div>
        )}
      </form>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Konfigurasi Billplz</h2>
      
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sandbox Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Mode Sandbox (Testing)
          </h3>
          {renderForm('sandbox')}
        </div>

        {/* Production Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Mode Production (Live)
          </h3>
          {renderForm('production')}
        </div>
      </div>
    </div>
  );
};

export default BillplzConfig; 