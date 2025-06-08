import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import billplzRoutes from './routes/billplz.js';
import oauthRoutes from "./routes/oauth.js";

dotenv.config();

const app = express();

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/billplz', billplzRoutes);
app.use("/api/oauth", oauthRoutes);

// --- Static assets ---
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
console.log(`[Server] Serving static files from: ${clientBuildPath}`);

app.use(express.static(clientBuildPath));

// The "catchall" handler
app.get('*', (req, res) => {
    // Log any request that falls through to here
    console.log(`[Server] Catch-all route triggered for: ${req.originalUrl}`);
    
    // Serve the main page for any non-API request
    if (!req.originalUrl.startsWith('/api')) {
        const indexPath = path.join(clientBuildPath, 'index.html');
        console.log(`[Server] Attempting to serve index.html from: ${indexPath}`);
        
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error('[Server] CRITICAL: Could not send index.html.', err);
                res.status(500).send('Server error: Could not load the application. Check logs for details.');
            }
        });
    } else {
        // This handles API calls to routes that don't exist
        console.log(`[Server] Unmatched API route: ${req.originalUrl}`);
        res.status(404).send('API route not found');
    }
});

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
    console.log('[Server] MongoDB Connected.');
    app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}.`));
})
.catch(err => console.error('[Server] MongoDB connection error:', err));