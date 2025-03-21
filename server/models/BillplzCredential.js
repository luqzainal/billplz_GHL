import mongoose from 'mongoose';

const billplzCredentialSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: true,
    unique: true
  },
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

// Pastikan hanya ada satu set kredential untuk setiap locationId
billplzCredentialSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Delete kredential lama untuk locationId yang sama sahaja
    await this.constructor.deleteMany({ locationId: this.locationId });
  }
  next();
});

const BillplzCredential = mongoose.model('BillplzCredential', billplzCredentialSchema);

export default BillplzCredential;
