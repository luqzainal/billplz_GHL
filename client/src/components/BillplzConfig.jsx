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
  const [success, setSuccess] = useState(null);
  const [sandboxConnected, setSandboxConnected] = useState(false);
  const [productionConnected, setProductionConnected] = useState(false);
  const [productionPassword, setProductionPassword] = useState('');

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
        setActiveMode(credentials.mode);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
      setError('Failed to fetch configuration information');
    }
  };

  const handleInputChange = (mode, field, value) => {
    if (mode === 'sandbox') {
      setSandboxCredentials(prev => ({ ...prev, [field]: value }));
    } else {
      setProductionCredentials(prev => ({ ...prev, [field]: value }));
    }
    setError(null);
  };

  const handleConnect = async (mode) => {
    const credentials = mode === 'sandbox' ? sandboxCredentials : productionCredentials;
    
    const dataToSend = { ...credentials };

    if (mode === 'production') {
      if (!productionPassword) {
        setError('Admin password is required to save production credentials');
        return;
      }
      dataToSend.password = productionPassword;
    }
    
    if (!credentials.apiKey || !credentials.xSignatureKey || !credentials.collectionId) {
      setError('All fields are required');
      return;
    }

    // Set loading state only for selected mode
    setLoadingStates(prev => ({ ...prev, [mode]: true }));
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/billplz/credentials', dataToSend);
      
      if (response.data.success) {
        setSuccess(`Configuration for ${mode === 'sandbox' ? 'Sandbox' : 'Production'} saved successfully`);
        setActiveMode(mode);
        
        // Test connection after saving
        const testResponse = await axios.get('/api/billplz/test-connection');
        
        if (testResponse.data.success) {
          if (mode === 'sandbox') {
            setSandboxConnected(true);
            setProductionConnected(false);
          } else {
            setProductionConnected(true);
            setSandboxConnected(false);
          }
          setSuccess(prev => `${prev} and connection successful`);
        } else {
          setError('Configuration saved but connection failed');
        }
      } else {
        setError(response.data.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      setError(error.response?.data?.message || 'Failed to save configuration');
    } finally {
      // Reset loading state only for selected mode
      setLoadingStates(prev => ({ ...prev, [mode]: false }));
    }
  };

  const renderForm = (mode) => {
    const credentials = mode === 'sandbox' ? sandboxCredentials : productionCredentials;
    const isActive = activeMode === mode;
    const isLoading = loadingStates[mode];
    const isConnected = mode === 'sandbox' ? sandboxConnected : productionConnected;

    return (
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            API Key
          </label>
          <input
            type="text"
            value={credentials.apiKey}
            onChange={(e) => handleInputChange(mode, 'apiKey', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder={`Enter ${mode === 'sandbox' ? 'Sandbox' : 'Production'} API Key`}
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            X-Signature Key
          </label>
          <input
            type="text"
            value={credentials.xSignatureKey}
            onChange={(e) => handleInputChange(mode, 'xSignatureKey', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder={`Enter ${mode === 'sandbox' ? 'Sandbox' : 'Production'} X-Signature Key`}
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Collection ID
          </label>
          <input
            type="text"
            value={credentials.collectionId}
            onChange={(e) => handleInputChange(mode, 'collectionId', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder={`Enter ${mode === 'sandbox' ? 'Sandbox' : 'Production'} Collection ID`}
            disabled={isLoading}
          />
        </div>
        {mode === 'production' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Admin Password
            </label>
            <input
              type="password"
              value={productionPassword}
              onChange={(e) => setProductionPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter password to save production keys"
              disabled={isLoading}
              required
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleConnect(mode)}
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isConnected
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : isConnected ? (
              'Connection Successful'
            ) : (
              'Connect'
            )}
          </button>
          {isActive && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>
      </form>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Billplz Configuration</h2>
        
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Sandbox Configuration</h3>
            {renderForm('sandbox')}
          </div>
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Production Configuration</h3>
            {renderForm('production')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillplzConfig; 