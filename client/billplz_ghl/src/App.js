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
  const [errors, setErrors] = useState({
    apiKey: '',
    xSignatureKey: '',
    collectionId: ''
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Setkan Redirect URL berdasarkan backend URL
  useEffect(() => {
    setRedirectURL(`${apiUrl}/api/billplz/redirect`);
  }, [apiUrl]);

  // Validate Input Fields
  const validateInput = (name, value) => {
    let errorMessage = "";

    if (value.trim() === "") {
      errorMessage = `${name} is required`;
    } else {
      // Validation rule
      if ((name === "API Key" || name === "Collection ID") && (value.length < 8 || value.length > 32)) {
        errorMessage = `${name} must be between 8-32 characters`;
      }
      if (name === "X-Signature Key" && value.length < 16) {
        errorMessage = `${name} must be at least 16 characters`;
      }
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: errorMessage }));
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfigData({ ...configData, [name]: value });

    // Validate real-time input
    validateInput(name, value);
  };

  // Check if form is valid
  const isFormValid = Object.values(errors).every((err) => err === "") && 
                      Object.values(configData).every((val) => val.trim() !== "");

  // Submit Configuration to Backend
  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

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

  // Test Connection to Billplz API
  const handleTestConnection = async () => {
    try {
      setTestResult("Testing connection...");
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
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
        
        {/* Left Section */}
        <div>
          <h1 className="text-3xl font-bold mb-6">Billplz Plugin: Connect to Billplz API</h1>

          {/* Billplz Configuration Section */}
          <section className="bg-white shadow-md rounded-lg p-6 w-full">
            <h2 className="text-2xl font-semibold mb-4">Billplz Configuration</h2>
            <form onSubmit={handleConfigSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">API Key:</label>
                <input
                  type="text"
                  name="API Key"
                  value={configData.apiKey}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors["API Key"] ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                  }`}
                />
                {errors["API Key"] && <p className="text-red-500 text-sm mt-1">{errors["API Key"]}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">X-Signature Key:</label>
                <input
                  type="password"
                  name="X-Signature Key"
                  value={configData.xSignatureKey}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors["X-Signature Key"] ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                  }`}
                />
                {errors["X-Signature Key"] && <p className="text-red-500 text-sm mt-1">{errors["X-Signature Key"]}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Collection ID:</label>
                <input
                  type="password"
                  name="Collection ID"
                  value={configData.collectionId}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors["Collection ID"] ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
                  }`}
                />
                {errors["Collection ID"] && <p className="text-red-500 text-sm mt-1">{errors["Collection ID"]}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Mode:</label>
                <select
                  name="mode"
                  value={configData.mode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full font-semibold py-2 px-4 rounded-md ${
                  isFormValid ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
              >
                Save Configuration
              </button>
            </form>
          </section>
        </div>

        {/* Right Section */}
        <div className="flex flex-col space-y-6">
          
          {/* Test Connection Section */}
          <section className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Test Billplz API Connection</h2>
            <button
              onClick={handleTestConnection}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md mb-4"
            >
              Test Connection
            </button>
          </section>

          {/* Redirect URL Section */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Redirect URL for GHL</h2>
            <p className="text-gray-800 break-words">{redirectURL}</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;