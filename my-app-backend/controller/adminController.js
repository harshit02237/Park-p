const User = require("../models/user");
const Restaurant = require("../models/restaurant");
const Order = require("../models/order");
const Dish = require("../models/dish");

const getAdminOverview = async (req, res) => {
  try {
    const [users, restaurants, orders, dishes] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).lean(),
      Restaurant.find({}).populate("ownerId", "name email avatar role").sort({ createdAt: -1 }).lean(),
      Order.find({}).populate("customerId", "name email").populate("restaurantId", "name").sort({ createdAt: -1 }).lean(),
      Dish.find({}).lean(),
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const activeOrders = orders.filter((order) =>
      ["placed", "accepted", "preparing", "out_for_delivery"].includes(order.status)
    ).length;
    const vendorUsers = users.filter((user) => user.role === "vendor" || user.role === "admin");
    const customers = users.filter((user) => user.role === "customer");

    const restaurantOrderCounts = orders.reduce((counts, order) => {
      const id = order.restaurantId?._id?.toString();
      if (id) counts[id] = (counts[id] || 0) + 1;
      return counts;
    }, {});

    const topVendors = restaurants
      .map((restaurant) => ({
        ...restaurant,
        orderCount: restaurantOrderCounts[restaurant._id.toString()] || 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);

    res.json({
      stats: {
        users: users.length,
        customers: customers.length,
        vendors: vendorUsers.length,
        restaurants: restaurants.length,
        listedRestaurants: restaurants.filter((restaurant) => restaurant.isListed !== false).length,
        dishes: dishes.length,
        orders: orders.length,
        activeOrders,
        totalRevenue,
      },
      users,
      customers,
      vendors: vendorUsers,
      restaurants,
      orders: orders.slice(0, 20),
      topVendors,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRestaurantListing = async (req, res) => {
  console.log("Admin updating listing status for restaurant ID:", req.params.id, "with body:", req.body);
  try {
    const { isListed } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isListed: Boolean(isListed) },
      { new: true }
    ).populate("ownerId", "name email avatar role");

    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRestaurantAppreciation = async (req, res) => {
  try {
    const { isAppreciated, appreciationNote } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      {
        isAppreciated: Boolean(isAppreciated),
        appreciationNote: appreciationNote || "",
      },
      { new: true }
    ).populate("ownerId", "name email avatar role");

    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAdminOverview,
  updateRestaurantListing,
  updateRestaurantAppreciation,
};
