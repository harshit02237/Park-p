const express = require("express");
const { protect, isAdmin } = require("../middlewares/authMiddleware");
const {
  getAdminOverview,
  updateRestaurantListing,
  updateRestaurantAppreciation,
} = require("../controller/adminController");

const router = express.Router();

router.get("/overview", protect, isAdmin, getAdminOverview);
router.patch("/restaurants/:id/listing", protect, isAdmin, updateRestaurantListing);
router.patch("/restaurants/:id/appreciation", protect, isAdmin, updateRestaurantAppreciation);

module.exports = router;
