import React, { useEffect, useState } from 'react';

const Payment = () => {
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  // 1. Fungsi untuk hantar event ke GHL (parent window)
  const postEvent = (data) => {
    window.parent.postMessage(JSON.stringify(data), "*");
  };

  useEffect(() => {
    // 2. Beritahu GHL bahawa laman payment sudah sedia
    const handleLoad = () => {
      const readyEvent = { type: "custom_provider_ready", loaded: true };
      console.log("Sending custom_provider_ready event to GHL");
      postEvent(readyEvent);
    };

    // 3. Listener untuk menerima data dari GHL
    const handleMessage = (event) => {
      console.log("Received message from GHL:", event.data);
      let parsedData;
      try {
        parsedData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        
        // Pastikan ia adalah event yang relevan
        if (parsedData && parsedData.type === 'payment_request') {
          console.log("Payment request data received:", parsedData);
          setPaymentData(parsedData);
        }

      } catch (e) {
        console.error("Error parsing message data:", e);
        setError("Invalid data received from host.");
        parsedData = event.data;
      }
    };

    window.addEventListener("load", handleLoad);
    window.addEventListener("message", handleMessage);

    // Cleanup listeners apabila komponen unmount
    return () => {
      window.removeEventListener("load", handleLoad);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Fungsi untuk handle bila payment berjaya
  const handleSuccessfulPayment = () => {
    const successEvent = {
      type: "payment_success",
      transactionId: "...", // Ganti dengan ID transaksi dari Billplz
      amount: paymentData?.amount,
      currency: paymentData?.currency,
    };
    console.log("Sending payment_success event to GHL");
    postEvent(successEvent);
  };

  // Fungsi untuk handle bila payment gagal
  const handleFailedPayment = () => {
    const errorEvent = {
      type: "payment_error",
      message: "Payment failed or was cancelled.",
    };
    console.log("Sending payment_error event to GHL");
    postEvent(errorEvent);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">Error: {error}</div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Waiting for payment information from GHL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">Complete Your Payment</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <p className="text-lg font-semibold">{paymentData.amount} {paymentData.currency}</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <p className="text-gray-600">{paymentData.description || 'GHL Invoice Payment'}</p>
        </div>

        {/* Placeholder untuk form payment Billplz */}
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-900">Select Payment Method</h2>
          <p className="text-gray-500 text-sm mt-2">Billplz integration will go here. User will be redirected to Billplz to complete payment.</p>
          
          <div className="mt-6 space-y-4">
            <button
              onClick={handleSuccessfulPayment}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Simulate Successful Payment
            </button>
            <button
              onClick={handleFailedPayment}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Simulate Failed Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment; 