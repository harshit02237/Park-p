const express = require("express");
const router = express.Router();

const {
  getAllRestaurants,
  getRestaurant,
  getNearbyRestaurants,
  getRestaurantById,
  getMyRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} = require("../controller/restaurantController");

const { protect, isVendor, isAdmin } = require("../middlewares/authMiddleware");

// ✅ Vendor-only routes
router.get("/vendor/me", protect, isAdmin, getMyRestaurant);
router.post("/", protect, isAdmin, createRestaurant);
router.put("/vendor/update", protect, isAdmin, updateRestaurant);
router.delete("/vendor/delete", protect, isAdmin, deleteRestaurant);

// ✅ Public routes
router.get("/", getAllRestaurants);
router.get("/current", getRestaurant);
router.get("/nearby/search", getNearbyRestaurants);
router.get("/:id", getRestaurantById);

module.exports = router;
