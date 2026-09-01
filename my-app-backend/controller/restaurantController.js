const Restaurant = require("../models/restaurant");

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const distanceInKm = (fromLat, fromLng, toLat, toLng) => {
  const radius = 6371;
  const latDelta = ((toLat - fromLat) * Math.PI) / 180;
  const lngDelta = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
};

// ✅ GET all restaurants (Public)
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isListed: { $ne: false } });
    res.status(200).json(restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching restaurants." });
  }
};

// ✅ GET restaurant by ID (Public)
const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      isListed: { $ne: false },
    });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found." });
    }
    res.status(200).json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching restaurant." });
  }
};

// The public storefront has one kitchen.  Keep the older collection routes for
// backwards-compatible data migrations, but expose a single canonical record.
const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ isListed: { $ne: false } })
      .sort({ createdAt: 1 });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant is not set up yet." });
    }
    res.status(200).json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching restaurant." });
  }
};

// ✅ GET restaurants near a customer (Public)
const getNearbyRestaurants = async (req, res) => {
  try {
    const { city, state } = req.query;
    const latitude = toNumber(req.query.latitude);
    const longitude = toNumber(req.query.longitude);
    const radiusKm = toNumber(req.query.radiusKm) || 8;

    const restaurants = await Restaurant.find({ isListed: { $ne: false } });

    if (latitude !== null && longitude !== null) {
      const nearby = restaurants
        .map((restaurant) => {
          const restaurantLatitude = restaurant.address?.latitude;
          const restaurantLongitude = restaurant.address?.longitude;

          if (
            typeof restaurantLatitude !== "number" ||
            typeof restaurantLongitude !== "number"
          ) {
            return null;
          }

          const distance = distanceInKm(
            latitude,
            longitude,
            restaurantLatitude,
            restaurantLongitude
          );

          return {
            ...restaurant.toObject(),
            distanceKm: Number(distance.toFixed(1)),
          };
        })
        .filter((restaurant) => restaurant && restaurant.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return res.status(200).json(nearby);
    }

    const normalizedCity = city ? String(city).trim().toLowerCase() : "";
    const normalizedState = state ? String(state).trim().toLowerCase() : "";

    const nearby = restaurants.filter((restaurant) => {
      const restaurantCity = restaurant.address?.city?.toLowerCase() || "";
      const restaurantState = restaurant.address?.state?.toLowerCase() || "";

      return (
        (!normalizedCity || restaurantCity.includes(normalizedCity)) &&
        (!normalizedState || restaurantState.includes(normalizedState))
      );
    });

    res.status(200).json(nearby);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching nearby restaurants." });
  }
};

// ✅ GET vendor's own restaurant (Vendor only)
const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = req.user.role === "admin"
      ? await Restaurant.findOne({}).sort({ createdAt: 1 })
      : await Restaurant.findOne({ ownerId: req.user._id });
    // console.log("Fetched restaurant for vendor:", restaurant);
    if (!restaurant) {
      return res.status(404).json({ error: "No restaurant found for this vendor." });
    }
    res.status(200).json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching vendor restaurant." });
  }
};

// ✅ CREATE or INITIALIZE a restaurant (Admin only)
const createRestaurant = async (req, res) => {
  if (!["admin", "vendor"].includes(req.user.role)) {
    return res.status(403).json({ error: "Only the restaurant administrator can set up the restaurant." });
  }

  const { name, description, address, cuisine, openingHours, isVeg, logoUrl } = req.body;

  if (!name || !description) {
    return res.status(422).json({ error: "Name and description are required." });
  }

  try {
    let restaurant = await Restaurant.findOne({});
    if (restaurant) {
      Object.assign(restaurant, {
        name,
        description,
        address,
        cuisine,
        openingHours,
        isVeg,
        logoUrl: logoUrl || restaurant.logoUrl,
        ownerId: req.user._id,
      });
      await restaurant.save();
      return res.status(200).json(restaurant);
    }

    restaurant = new Restaurant({
      name,
      description,
      address,
      cuisine,
      openingHours,
      isVeg,
      logoUrl,
      ownerId: req.user._id,
    });

    await restaurant.save();
    res.status(201).json(restaurant);
  } catch (error) {
    console.error("Create restaurant error:", error);
    res.status(500).json({ error: "Failed to create restaurant." });
  }
};


// ✅ UPDATE restaurant (Vendor only)
const updateRestaurant = async (req, res) => {
  try {
    const restaurant = req.user.role === "admin"
      ? await Restaurant.findOne({}).sort({ createdAt: 1 })
      : await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found." });
    }

    Object.assign(restaurant, req.body);
    await restaurant.save();

    res.status(200).json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update restaurant." });
  }
};

// ✅ DELETE restaurant (Vendor only)
const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOneAndDelete({ ownerId: req.user._id });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found or already deleted." });
    }

    res.status(200).json({ message: "Restaurant deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete restaurant." });
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurant,
  getNearbyRestaurants,
  getRestaurantById,
  getMyRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
};
