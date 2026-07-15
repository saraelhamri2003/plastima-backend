const express = require("express");
const cors = require("cors");
const https = require("https");
const db = require("./db");

const app = express();

app.use(cors({
  origin: ["https://app.hubspot.com", "https://app.hubspotqa.com"],
  credentials: true
}));
app.use(express.json());

// Serve the upload form and files at /uploads
app.use("/uploads", (req, res, next) => {
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://app.hubspot.com");
  next();
}, express.static("uploads"));

// Root route – redirect to upload form for easy tunnel access
app.get("/", (req, res) => {
    res.redirect("/uploads/upload.html");
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Geolocation proxy endpoint
app.get("/api/geolocation", (req, res) => {
  res.json({ latitude: 31.7917, longitude: -7.0926 });
});

const documentsRoutes = require("./routes/documents");

app.use("/api/documents", documentsRoutes);

const visitsRoutes = require("./routes/visits");
app.use("/api/visits", visitsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
