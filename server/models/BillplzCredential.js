import mongoose from 'mongoose';

const billplzCredentialSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: [true, 'GHL Location ID is required.'],
    trim: true
  },
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
    // default: 'sandbox' // Default can be set in your save logic if needed
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

// Update the updatedAt timestamp before saving/updating
billplzCredentialSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

billplzCredentialSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Create a compound unique index on locationId and mode
// This ensures that each GHL location can have one set of credentials per mode (sandbox/production)
billplzCredentialSchema.index({ locationId: 1, mode: 1 }, { unique: true });

const BillplzCredential = mongoose.model('BillplzCredential', billplzCredentialSchema);

export default BillplzCredential;
