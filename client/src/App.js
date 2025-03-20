import React from 'react';
import BillplzConfig from './components/BillplzConfig';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-xl font-semibold text-gray-800">
            Billplz Integration
          </h1>
        </div>
      </nav>
      
      <main className="py-8">
        <BillplzConfig />
      </main>
    </div>
  );
}

export default App; 