const express = require("express");
const router = express.Router();
const { protect, isVendor, isCustomer, isAdmin } = require("../middlewares/authMiddleware");
const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getVendorOrders,
  updateOrderStatus,
} = require("../controller/orderController");

// Customer routes
router.post("/", protect, isCustomer, createOrder);
router.get("/my", protect, getMyOrders);
router.get("/my/:id", protect, isCustomer, getMyOrderById);

// Admin / Restaurant live order queries
router.get("/admin/all", protect, isAdmin, getVendorOrders);
router.get("/vendor/:restaurantId", protect, isAdmin, getVendorOrders);

// Update order status & payment status
router.put("/:id/status", protect, isAdmin, updateOrderStatus);

module.exports = router;

