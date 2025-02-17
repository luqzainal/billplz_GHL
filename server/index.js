import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import billplzRoutes from './routes/billplz.js';
const oauthRoutes = require("./routes/oauth");
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/oauth", oauthRoutes);
app.use("/oauth", oauthRoutes);

// Sambungkan ke MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Gunakan route Billplz
app.use('/api/billplz', billplzRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));