import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Icons for better UI
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-10.707a1 1 0 00-1.414-1.414L9 9.586 7.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ExclamationCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

const CogIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

// Setup axios baseURL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BillplzConfig = () => {
  const [mode, setMode] = useState('sandbox'); // 'sandbox' or 'production'
  const [credentials, setCredentials] = useState({
    apiKey: '',
    xSignatureKey: '',
    collectionId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // 'success' or 'error'
  const [showSignatureKey, setShowSignatureKey] = useState(false);

  // Fetch data on mode change
  useEffect(() => {
    const fetchCreds = async () => {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
    try {
        const response = await axios.get(`/api/billplz/credentials?mode=${mode}`);
      if (response.data.success && response.data.credentials) {
          setCredentials(response.data.credentials);
        } else {
          // If no credentials found for the mode, reset the form
          handleReset();
      }
    } catch (error) {
        setMessage({ type: 'error', text: 'Failed to fetch settings.' });
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
    }
  };

    fetchCreds();
  }, [mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setCredentials({ apiKey: '', xSignatureKey: '', collectionId: '' });
    setMessage({ type: '', text: '' });
    setShowSignatureKey(false); // Reset visibility on form reset
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/billplz/credentials', { ...credentials, mode });
      if (response.data.success) {
        // Test connection right after saving
        try {
            const testResponse = await axios.get(`/api/billplz/test-connection?mode=${mode}`);
        if (testResponse.data.success) {
                setMessage({ type: 'success', text: 'Settings saved and connection successful!' });
          } else {
                setMessage({ type: 'error', text: 'Settings saved, but connection test failed.' });
          }
        } catch (testError) {
             setMessage({ type: 'error', text: 'Settings saved, but connection test failed.' });
        }
      } else {
        setMessage({ type: 'error', text: response.data.message || 'An unknown error occurred.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save settings.' });
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-gray-50 p-6 border-b border-gray-200">
            <div className="flex items-center">
                <CogIcon />
                <h1 className="text-xl font-semibold text-gray-800">Billplz API Configuration</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Configure your API keys for Sandbox and Production environments.</p>
        </div>
        
        <div className="p-6">
          {/* Mode Toggler */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('sandbox')}
                className={`w-full text-center py-2 rounded-md transition-all duration-300 ${mode === 'sandbox' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                Sandbox
              </button>
                <button
                onClick={() => setMode('production')}
                className={`w-full text-center py-2 rounded-md transition-all duration-300 ${mode === 'production' ? 'bg-white shadow text-indigo-600 font-semibold' : 'text-gray-500 hover:bg-gray-200'}`}
              >
                Production
                </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">API Key</label>
              <input
                type="text"
                id="apiKey"
                name="apiKey"
                value={credentials.apiKey}
                onChange={handleInputChange}
                disabled={isLoading}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="eg: 5b4c9b9e-8b1a-4b9e-9b0a-9b1a4b9e8b1a"
              />
            </div>
            
            <div>
              <label htmlFor="xSignatureKey" className="block text-sm font-medium text-gray-700">X-Signature Key</label>
              <div className="mt-1 relative">
              <input
                  type={showSignatureKey ? 'text' : 'password'}
                  id="xSignatureKey"
                  name="xSignatureKey"
                value={credentials.xSignatureKey}
                  onChange={handleInputChange}
                disabled={isLoading}
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Secret key for verifying callbacks"
                />
                <button
                  type="button"
                  onClick={() => setShowSignatureKey(!showSignatureKey)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showSignatureKey ? 'Hide key' : 'Show key'}
                >
                  {showSignatureKey ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="collectionId" className="block text-sm font-medium text-gray-700">Collection ID</label>
              <input
                type="text"
                id="collectionId"
                name="collectionId"
                value={credentials.collectionId}
                onChange={handleInputChange}
                disabled={isLoading}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="eg: ab1cd2ef"
              />
            </div>

            {/* Message Area */}
            {message.text && (
              <div className={`flex items-center p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.type === 'success' ? <CheckCircleIcon /> : <ExclamationCircleIcon />}
                <p className="ml-3 text-sm font-medium">{message.text}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Reset
              </button>
                  <button
                type="submit"
                    disabled={isLoading}
                className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                {isLoading ? 'Saving...' : 'Save Configuration'}
                  </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BillplzConfig; 