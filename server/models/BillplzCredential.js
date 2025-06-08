import mongoose from 'mongoose';

const billplzCredentialSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: true,
    trim: true
  },
  xSignatureKey: {
    type: String,
    required: true,
    trim: true
  },
  collectionId: {
    type: String,
    required: true,
    trim: true
  },
  mode: {
    type: String,
    enum: ['sandbox', 'production'],
    required: true,
    default: 'sandbox'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
billplzCredentialSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure only one set of credentials exists for each mode
billplzCredentialSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('mode')) {
    // Delete old credentials for the same mode
    await this.constructor.deleteMany({ mode: this.mode });
  }
  next();
});

const BillplzCredential = mongoose.model('BillplzCredential', billplzCredentialSchema);

export default BillplzCredential;
