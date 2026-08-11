const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const uploadRoutes = require("./routes/upload.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// Test Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Wall Paint Visualizer Backend is Running!",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);

module.exports = app;
