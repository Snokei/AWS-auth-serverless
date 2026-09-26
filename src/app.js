const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const listRoutes = require("./routes/listRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();


// Middleware to handle API Gateway stage & function path prefixes (e.g., /default/express-jwt-auth)
app.use((req, res, next) => {
  const rawUrl = req.url;
  // Match routes like /default/express-jwt-auth/api/login -> /api/login, or /default/express-jwt-auth/health -> /health
  const routeMatch = rawUrl.match(
    /^(?:\/[^\/]+){1,3}(\/(?:api|health)(?:[\?\/].*)?)$/,
  );
  if (routeMatch && routeMatch[1]) {
    req.url = routeMatch[1];
  } else if (rawUrl.includes("/express-jwt-auth")) {
    const parts = rawUrl.split("/express-jwt-auth");
    req.url = parts[1] || "/";
  }
  next();
});

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root API documentation endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Express.js AWS Lambda JWT Auth API",
    status: "online",
    version: "1.0.0",
    platform: process.env.AWS_EXECUTION_ENV
      ? "AWS Lambda"
      : "Standalone Express Server",
    endpoints: {
      health: "GET /health",
      register: "POST /api/register",
      login: "POST /api/login",
      list: "GET/POST/PUT/DELETE /api/list"
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    platform: process.env.AWS_EXECUTION_ENV
      ? "AWS Lambda"
      : "Standalone Express Server",
  });
});

// Auth, Item & Notification API Routes
app.use("/api", authRoutes);
app.use("/api/list", listRoutes);
app.use("/api/notifications", notificationRoutes);



// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}. Route not found.`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = app;
