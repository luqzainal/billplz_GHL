import mongoose from 'mongoose';

const ghlAuthSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: true,
    unique: true,
  },
  companyId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  access_token: {
    type: String,
    required: true,
  },
  refresh_token: {
    type: String,
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

const GhlAuth = mongoose.model('GhlAuth', ghlAuthSchema);

export default GhlAuth; 