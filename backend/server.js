const express = require("express");
const cors = require("cors");
const https = require("https");
const db = require("./db");

const app = express();

app.use(cors());
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

// Geolocation proxy endpoint - uses ip-api.com (no auth required, no Cloudflare)
app.get("/api/geolocation", (req, res) => {
  https.get("https://ip-api.com/json/?fields=lat,lon", (apiRes) => {
    let data = "";
    apiRes.on("data", (chunk) => { data += chunk; });
    apiRes.on("end", () => {
      try {
        const json = JSON.parse(data);
        if (json.lat && json.lon) {
          res.json({ latitude: json.lat, longitude: json.lon });
        } else {
          res.status(502).json({ message: "Position non disponible" });
        }
      } catch {
        res.status(502).json({ message: "Réponse invalide du service de géolocalisation" });
      }
    });
  }).on("error", (err) => {
    res.status(502).json({ message: err.message });
  });
});

const documentsRoutes = require("./routes/documents");

app.use("/api/documents", documentsRoutes);

const visitsRoutes = require("./routes/visits");
app.use("/api/visits", visitsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
