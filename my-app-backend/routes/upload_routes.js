const express = require("express");
const { protect, isVendor } = require("../middlewares/authMiddleware");
const {
  createCloudinaryUploadSignature,
} = require("../controller/cloudinaryUploadController");

const router = express.Router();

router.post("/cloudinary/signature", protect, isVendor, createCloudinaryUploadSignature);

module.exports = router;
