const Dish = require("../models/dish");
const Restaurant = require("../models/restaurant");

// Add a new dish
const createDish = async (req, res) => {
    try {
        let { restaurantId, name, description, imageUrl, price, category, isVeg } = req.body;

        if (!restaurantId) {
            const restaurant = await Restaurant.findOne({}).sort({ createdAt: 1 });
            if (restaurant) restaurantId = restaurant._id;
        }

        const dish = await Dish.create({
            restaurantId,
            name,
            description,
            imageUrl,
            price: Number(price),
            category,
            isVeg: Boolean(isVeg),
        });

        res.status(201).json(dish);
    } catch (err) {
        console.error("Create dish error:", err);
        res.status(500).json({ message: err.message });
    }
};

const getDishesByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        let query = {};
        if (restaurantId && restaurantId !== "current" && restaurantId !== "all") {
            query.restaurantId = restaurantId;
        }

        const dishes = await Dish.find(query).sort({ createdAt: -1 });
        return res.json(dishes);
    } catch (err) {
        console.error("Error fetching dishes:", err);
        res.status(500).json({ message: err.message });
    }
};

// Update a dish
const updateDish = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const dish = await Dish.findById(id);
        if (!dish) return res.status(404).json({ message: "Dish not found" });

        Object.assign(dish, updates);
        await dish.save();
        res.json(dish);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete a dish
const deleteDish = async (req, res) => {
    try {
        const { id } = req.params;
        const dish = await Dish.findByIdAndDelete(id);
        if (!dish) return res.status(404).json({ message: "Dish not found" });

        res.json({ message: "Dish deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createDish,
    getDishesByRestaurant,
    updateDish,
    deleteDish,
};

