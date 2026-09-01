const express = require("express");
const { protect, isVendor, isAdmin } = require("../middlewares/authMiddleware");
const {
  createDish,
  updateDish,
  deleteDish,
  getDishesByRestaurant,
} = require("../controller/dishController");

const router = express.Router();

router.post("/", protect, isAdmin, createDish);
router.put("/:id", protect, isAdmin, updateDish);
router.delete("/:id", protect, isAdmin, deleteDish);

// Vendor can view their own dishes (authenticated)
router.get("/vendor/restaurants/:restaurantId/dishes", protect, isAdmin, getDishesByRestaurant);

// Public (no auth)
router.get("/restaurants/:restaurantId/dishes", getDishesByRestaurant);


module.exports = router;
