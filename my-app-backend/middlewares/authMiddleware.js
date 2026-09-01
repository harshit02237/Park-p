const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Middleware to protect routes (auth required)
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from "Authorization" header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || "zaika_secret_jwt_key_2026";
    const decoded = jwt.verify(token, jwtSecret);

    // Attach user info to req
    req.user = await User.findById(decoded._id).select("-password");

    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user.role = decoded.role || req.user.role;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ message: "Not authorized, token invalid" });
  }
};

// Vendor/Admin role check middleware
const isVendor = (req, res, next) => {
  if (req.user && ["vendor", "admin"].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Vendor/Admin only" });
  }
};

// Customer/Admin role check middleware
const isCustomer = (req, res, next) => {
  if (req.user && ["customer", "admin", "vendor"].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Customer only" });
  }
};

// Admin role check
const isAdmin = (req, res, next) => {
  if (req.user && ["admin", "vendor"].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Admin only" });
  }
};

module.exports = { protect, isVendor, isCustomer, isAdmin };

