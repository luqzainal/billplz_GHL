import mongoose from 'mongoose';

const BillplzCredentialSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: true,
  },
  xSignatureKey: {
    type: String,
    required: true,
  },
  collectionId: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    enum: ['sandbox', 'production'],
    required: true,
  },
}, { timestamps: true });

// Eksport model menggunakan ES Module
const BillplzCredential = mongoose.model('BillplzCredential', BillplzCredentialSchema);
export default BillplzCredential;
