// client/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [configData, setConfigData] = useState({
    apiKey: '',
    xSignatureKey: '',
    collectionId: '',
    mode: 'sandbox'
  });
  const [testResult, setTestResult] = useState(null);
  const [redirectURL, setRedirectURL] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Setkan Redirect URL berdasarkan backend URL
  useEffect(() => {
    setRedirectURL(`${apiUrl}/api/billplz/redirect`);
  }, [apiUrl]);

  // Hantar data konfigurasi ke backend
  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${apiUrl}/api/billplz/credentials`, configData);
      if (res.data.success) {
        alert('Konfigurasi berjaya disimpan!');
      } else {
        alert('Terdapat masalah ketika menyimpan konfigurasi.');
      }
    } catch (error) {
      console.error(error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  // Uji sambungan ke API Billplz
  const handleTestConnection = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/billplz/test-connection`);
      if (res.data.success) {
        setTestResult(JSON.stringify(res.data.data, null, 2));
        alert('Sambungan berjaya!');
      } else {
        setTestResult('Gagal menguji sambungan.');
      }
    } catch (error) {
      console.error(error);
      setTestResult('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
    <h1 className="text-3xl font-bold mb-8">Billplz Plugin: Connect to Billplz API</h1>
  
    {/* Billplz Configuration Section */}
    <section className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-4">Billplz Configuration</h2>
      <form onSubmit={handleConfigSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">API Key:</label>
          <input
            type="text"
            value={configData.apiKey}
            onChange={(e) => setConfigData({ ...configData, apiKey: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">X-Signature Key:</label>
          <input
            type="text"
            value={configData.xSignatureKey}
            onChange={(e) => setConfigData({ ...configData, xSignatureKey: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Collection ID:</label>
          <input
            type="text"
            value={configData.collectionId}
            onChange={(e) => setConfigData({ ...configData, collectionId: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Mode:</label>
          <select
            value={configData.mode}
            onChange={(e) => setConfigData({ ...configData, mode: e.target.value })}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
        >
          Save Configuration
        </button>
      </form>
    </section>
  
    {/* Test Connection Section */}
    <section className="bg-white shadow-md rounded-lg p-6 mb-8 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-4">Test Billplz API Connection</h2>
      <button
        onClick={handleTestConnection}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md mb-4"
      >
        Test Connection
      </button>
      {testResult && (
        <pre className="text-left bg-gray-100 p-4 rounded-md overflow-auto whitespace-pre-wrap">
          {testResult}
        </pre>
      )}
    </section>
  
    {/* Redirect URL Section */}
    <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
      <h2 className="text-2xl font-semibold mb-4">Redirect URL for GHL</h2>
      <p className="text-gray-800 break-words">{redirectURL}</p>
    </div>
  </div>
  
  );
}

export default App;

