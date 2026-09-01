const express = require("express");
const { protect, isCustomer } = require("../middlewares/authMiddleware");
const {
  getFavouriteItems,
  addFavouriteItem,
  removeFavouriteItem,
} = require("../controller/favouriteController");

const router = express.Router();

router.get("/", protect, isCustomer, getFavouriteItems);
router.post("/:dishId", protect, isCustomer, addFavouriteItem);
router.delete("/:dishId", protect, isCustomer, removeFavouriteItem);

module.exports = router;
