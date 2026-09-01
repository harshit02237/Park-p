const User = require("../models/user");
const Dish = require("../models/dish");

const favouriteSelect = "name description imageUrl price category isVeg restaurantId";

const getFavouriteItems = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "favouriteDishes",
      select: favouriteSelect,
      populate: {
        path: "restaurantId",
        select: "name logoUrl",
      },
    });

    res.json(user?.favouriteDishes || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addFavouriteItem = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.dishId);
    if (!dish) {
      return res.status(404).json({ message: "Dish not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favouriteDishes: dish._id } },
      { new: true }
    ).populate({
      path: "favouriteDishes",
      select: favouriteSelect,
      populate: {
        path: "restaurantId",
        select: "name logoUrl",
      },
    });

    res.status(200).json(user.favouriteDishes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeFavouriteItem = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favouriteDishes: req.params.dishId } },
      { new: true }
    ).populate({
      path: "favouriteDishes",
      select: favouriteSelect,
      populate: {
        path: "restaurantId",
        select: "name logoUrl",
      },
    });

    res.status(200).json(user.favouriteDishes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getFavouriteItems,
  addFavouriteItem,
  removeFavouriteItem,
};
