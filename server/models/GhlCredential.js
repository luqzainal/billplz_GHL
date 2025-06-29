import mongoose from 'mongoose';

const GhlCredentialSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: true,
    unique: true, // Each location should only have one set of credentials
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the `updatedAt` field on save
GhlCredentialSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const GhlCredential = mongoose.model('GhlCredential', GhlCredentialSchema);

export default GhlCredential; 