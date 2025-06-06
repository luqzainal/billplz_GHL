import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Setup axios baseURL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BillplzConfig = () => {
  const [credentials, setCredentials] = useState({
    apiKey: '',
    xSignatureKey: '',
    collectionId: '',
  });
  const [locationId, setLocationId] = useState(null);
  const [activeMode, setActiveMode] = useState('production');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locId = params.get('locationId');
    if (locId) {
      setLocationId(locId);
      resetForm(); // Reset borang apabila pemasangan baru dikesan
    }
  }, []);

  const resetForm = () => {
    setCredentials({ apiKey: '', xSignatureKey: '', collectionId: '' });
    setError(null);
    setSuccess(null);
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!locationId) {
      setError('Location ID is missing. Please reinstall the app.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/billplz/save-credentials', {
        ...credentials,
        locationId,
        mode: activeMode,
      });
      
      if (response.data.success) {
        setSuccess(`Konfigurasi untuk mod ${activeMode} berjaya disimpan!`);
      } else {
        setError(response.data.message || 'Gagal menyimpan konfigurasi.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ralat semasa menyimpan konfigurasi.');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    return (
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            API Key
          </label>
          <input
            type="text"
            value={credentials.apiKey}
            onChange={(e) => handleInputChange('apiKey', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Masukkan API Key Billplz"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            X-Signature Key
          </label>
          <input
            type="text"
            value={credentials.xSignatureKey}
            onChange={(e) => handleInputChange('xSignatureKey', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Masukkan X-Signature Key Billplz"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Collection ID
          </label>
          <input
            type="text"
            value={credentials.collectionId}
            onChange={(e) => handleInputChange('collectionId', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Masukkan Collection ID Billplz"
            required
            disabled={loading}
          />
        </div>
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Konfigurasi'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Konfigurasi Billplz Payment Gateway
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sila masukkan kelayakan Billplz anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">{success}</div>}
          
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveMode('production')}
                  className={`${
                    activeMode === 'production'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Production
                </button>
                <button
                  onClick={() => setActiveMode('sandbox')}
                  className={`${
                    activeMode === 'sandbox'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Sandbox
                </button>
              </nav>
            </div>
          </div>
          
          {renderForm()}

        </div>
      </div>
    </div>
  );
};

export default BillplzConfig; 