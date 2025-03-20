import mongoose from 'mongoose';

const billplzCredentialSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: true
  },
  xSignatureKey: {
    type: String,
    required: true
  },
  collectionId: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    enum: ['sandbox', 'production'],
    default: 'sandbox'
  }
}, {
  timestamps: true
});

// Pastikan hanya ada satu set kredential
billplzCredentialSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Delete semua kredential yang lain sebelum simpan yang baru
    await this.constructor.deleteMany({});
  }
  next();
});

const BillplzCredential = mongoose.model('BillplzCredential', billplzCredentialSchema);

export default BillplzCredential;
