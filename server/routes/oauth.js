import express from 'express';
import axios from 'axios';
require("dotenv").config();

const router = express.Router();

// Simpan token dalam memory (kau boleh tukar ke database kalau production)
let accessToken = null;
let refreshToken = null;
let locationId = null;

// OAuth Callback (GHL akan redirect ke sini)
router.get("/callback", async (req, res) => {
    console.log("🔄 OAuth Callback triggered...");
    console.log("🔗 Received Code:", req.query.code);

    const authCode = req.query.code;

    if (!authCode) {
        return res.status(400).json({ error: "Authorization code missing!" });
    }

    try {
        const response = await axios.post("https://services.leadconnectorhq.com/oauth/token", {
            grant_type: "authorization_code",
            code: authCode,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            redirect_uri: process.env.REDIRECT_URI,
        }, {
            headers: { "Content-Type": "application/json" }
        });

        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
        locationId = response.data.location_id;

        console.log("✅ Access Token:", accessToken);
        console.log("🔄 Refresh Token:", refreshToken);
        console.log("🏢 Location ID:", locationId);

        res.json({
            message: "Authorization successful!",
            access_token: accessToken,
            refresh_token: refreshToken,
            location_id: locationId
        });

    } catch (error) {
        console.error("❌ OAuth Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "OAuth process failed!" });
    }
});

// API untuk refresh token
router.get("/refresh", async (req, res) => {
    if (!refreshToken) {
        return res.status(400).json({ error: "No refresh token available!" });
    }

    try {
        const response = await axios.post("https://services.leadconnectorhq.com/oauth/token", {
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
        }, {
            headers: { "Content-Type": "application/json" }
        });

        // Update token baru
        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;

        console.log("New Access Token:", accessToken);
        console.log("New Refresh Token:", refreshToken);

        res.json({
            message: "Token refreshed!",
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: response.data.expires_in
        });

    } catch (error) {
        console.error("Error refreshing token:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Token refresh failed!" });
    }
});

// API untuk daftar Custom Payment Provider dalam GHL
router.post("/register-payment", async (req, res) => {
    if (!accessToken) {
        return res.status(400).json({ error: "Access token not available! Please authenticate first." });
    }

    try {
        const response = await axios.post("https://services.leadconnectorhq.com/payments/custom-provider/provider",
            {
                name: "Billplz",
                description: "Billplz Payment Gateway for GHL",
                imageUrl: "https://your-logo-url.com/billplz.png",
                locationId: locationId,
                queryUrl: "https://billplz.kuasaplus.com/api/billplz/query",
                paymentsUrl: "https://billplz.kuasaplus.com/api/billplz/pay"
            },
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Payment Provider Registered:", response.data);

        res.json({
            message: "Payment provider successfully registered in GHL!",
            details: response.data
        });

    } catch (error) {
        console.error("❌ Error registering payment provider:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Failed to register payment provider!", details: error.response ? error.response.data : error.message });
    }
});

export default router;
