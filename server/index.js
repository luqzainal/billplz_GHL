import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import billplzRoutes from './routes/billplz.js';
import oauthRoutes from "./routes/oauth.js";

dotenv.config();

const app = express.Router();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/billplz', billplzRoutes);
app.use("/oauth", oauthRoutes);

// Connect to MongoDB - this will run when this module is imported
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Export the router instead of starting the server
export default app;