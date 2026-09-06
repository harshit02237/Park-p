// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
    mongoose.set('strictQuery', true);
  try {
    const mongoUri = process.env.MONGO_URI || process.env.PROD_MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MongoDB URI not found in environment variables (MONGO_URI, PROD_MONGO_URI, or MONGODB_URI).");
    }
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;