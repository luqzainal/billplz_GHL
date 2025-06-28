import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import BillplzConfig from './components/BillplzConfig';
import Payment from './components/Payment';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <main className="py-8">
          <Routes>
            <Route path="/" element={<BillplzConfig />} />
            <Route path="/payment" element={<Payment />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 