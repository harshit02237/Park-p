// 🌐 Import core packages
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const cookieSession = require("cookie-session");
require("dotenv").config();

// 🧠 Import local modules
const connectDB = require("./config/db");

// 🧩 Import models (must be before routes & passport)
require("./models/user");
require("./models/restaurant");
require("./models/dish");
require("./models/order");
require("./models/review");

// 🔑 Passport configuration
require("./config/passport");

// 🛣️ Import routes
const authRoutes = require("./routes/auth_routes");
const restaurantRoutes = require("./routes/restaurant_routes");
const dishRoutes = require("./routes/dish_routes");
const orderRoutes = require("./routes/order_routes");
const adminRoutes = require("./routes/admin_routes");
const favouriteRoutes = require("./routes/favourite_routes");
const uploadRoutes = require("./routes/upload_routes");

// ⚙️ Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// 🧭 Connect MongoDB
connectDB();

// 🌍 Allowed Origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://zaika-online.vercel.app",
];

// 🧱 Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith("http://localhost:")) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for single-restaurant deployment
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(
  cookieSession({
    name: "session",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    keys: [process.env.COOKIE_KEY || "zaika_cookie_key_secret"],
    sameSite: "lax", // prevents cross-site issues
    secure: process.env.NODE_ENV === "production", // secure in production
  })
);

app.set("trust proxy", 1);

// 🧾 Body Parser
app.use(express.json());

// 🔐 Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// 🚦 Routes (mounted on both /api/* and /* for maximum frontend compatibility)
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);


app.use("/api/restaurants", restaurantRoutes);
app.use("/restaurants", restaurantRoutes);

app.use("/api/dishes", dishRoutes);
app.use("/dishes", dishRoutes);

app.use("/api/orders", orderRoutes);
app.use("/orders", orderRoutes);

app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

app.use("/api/favourites", favouriteRoutes);
app.use("/favourites", favouriteRoutes);

app.use("/api/uploads", uploadRoutes);
app.use("/uploads", uploadRoutes);

// 🌐 Root & Health Check Endpoints
app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "🚀 Zaika Online Backend API is active and running successfully!",
    version: "1.0.0",
    docs: {
      healthCheck: "/api/test",
      auth: "/api/auth",
      restaurants: "/api/restaurants",
      dishes: "/api/dishes",
      orders: "/api/orders",
      admin: "/api/admin",
      favourites: "/api/favourites",
      uploads: "/api/uploads",
    },
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "🚀 Zaika Online API root",
    healthCheck: "/api/test",
  });
});

// 🧪 Test Route
app.get("/api/test", (req, res) => {
  res.json({ message: "✅ Server working fine!", timestamp: new Date().toISOString() });
});

// 🧩 Error Handling (Optional but good practice)
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// 🛑 404 Catch-all handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}. Please verify the endpoint URL.`,
  });
});

const http = require("http");
const { init } = require("./utils/socket");

// 🚀 Start Server with Socket.IO
function startServer(port, retries = 3) {
  // create a fresh server instance each attempt to avoid multiple listen calls on same server
  const server = http.createServer(app);
  try {
    init(server);
  } catch (e) {
    console.warn("Socket init warning:", e && e.message);
  }

  server.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use.`);
      if (retries > 0) {
        const nextPort = Number(port) + 1;
        console.log(`Trying to start on port ${nextPort} (retries left: ${retries - 1})`);
        // close current server before retrying
        try {
          server.close(() => {
            setTimeout(() => startServer(nextPort, retries - 1), 300);
          });
        } catch (closeErr) {
          console.warn("Error closing server instance:", closeErr && closeErr.message);
          setTimeout(() => startServer(nextPort, retries - 1), 300);
        }
      } else {
        console.error("Failed to bind server: no available ports. Exiting.");
        process.exit(1);
      }
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
}

startServer(PORT);
