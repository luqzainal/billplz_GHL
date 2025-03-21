import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Setup axios baseURL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BillplzConfig = ({ locationId }) => {
  const [sandboxCredentials, setSandboxCredentials] = useState({
    locationId: locationId,
    apiKey: '',
    xSignatureKey: '',
    collectionId: '',
    mode: 'sandbox'
  });

  const [productionCredentials, setProductionCredentials] = useState({
    locationId: locationId,
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

  // Get existing credentials when component loads
  useEffect(() => {
    if (locationId) {
      fetchCredentials();
    }
  }, [locationId]);

  const fetchCredentials = async () => {
    try {
      const response = await axios.get(`/api/billplz/credentials/${locationId}`);
      if (response.data.success && response.data.credentials) {
        const credentials = response.data.credentials;
        if (credentials.mode === 'sandbox') {
          setSandboxCredentials(credentials);
          setSandboxConnected(true);
        } else {
          setProductionCredentials(credentials);
          setProductionConnected(true);
        }
        setSuccessMessage(`Billplz has been successfully configured in ${credentials.mode} mode!`);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
      setError('Failed to get credentials from server');
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
    if (!locationId) {
      setError('Location ID is required to save credentials');
      return;
    }

    // Set loading state only for selected mode
    setLoadingStates(prev => ({ ...prev, [mode]: true }));
    setError(null);
    setSuccessMessage('');
    const credentials = mode === 'sandbox' ? sandboxCredentials : productionCredentials;

    try {
      console.log(`Sending ${mode} credentials to server:`, {
        ...credentials,
        apiKey: '****' // Mask API key in logs
      });

      const saveResponse = await axios.post('/api/billplz/credentials', credentials);
      
      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.message || 'Failed to save credentials');
      }

      console.log('Credentials saved successfully, testing connection...');
      
      const testResponse = await axios.get(`/api/billplz/test-connection/${locationId}`);
      
      if (testResponse.data.success) {
        if (mode === 'sandbox') {
          setSandboxConnected(true);
          setProductionConnected(false);
        } else {
          setProductionConnected(true);
          setSandboxConnected(false);
        }
        setSuccessMessage(`Congratulations! Billplz has been successfully configured in ${mode} mode. You can now start using the payment system.`);
        console.log('Connection test successful');
      } else {
        throw new Error(testResponse.data.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Error connecting to Billplz:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to connect to Billplz. Please check your credentials.'
      );
      if (mode === 'sandbox') {
        setSandboxConnected(false);
      } else {
        setProductionConnected(false);
      }
      setSuccessMessage('');
    } finally {
      // Reset loading state only for selected mode
      setLoadingStates(prev => ({ ...prev, [mode]: false }));
    }
  };

  const renderForm = (mode) => {
    const credentials = mode === 'sandbox' ? sandboxCredentials : productionCredentials;
    const isConnected = mode === 'sandbox' ? sandboxConnected : productionConnected;
    const isLoading = loadingStates[mode];
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
            placeholder={`Enter ${mode} API Key from Billplz`}
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
            placeholder={`Enter ${mode} X-Signature Key from Billplz`}
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
            placeholder={`Enter ${mode} Collection ID from Billplz`}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className={`w-full p-2 rounded ${
            isConnected
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : isConnected ? (
            'Connected'
          ) : (
            'Connect'
          )}
        </button>
      </form>
    );
  };

  if (!locationId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Location ID is required to save Billplz credentials. Please make sure you are logged into GHL and have selected the correct location.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            Sandbox Mode (Testing)
          </h3>
          {renderForm('sandbox')}
        </div>

        {/* Production Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Production Mode (Live)
          </h3>
          {renderForm('production')}
        </div>
      </div>
    </div>
  );
};

export default BillplzConfig; 