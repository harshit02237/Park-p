const Order = require("../models/order");
const Restaurant = require("../models/restaurant");
const Dish = require("../models/dish");
const { getIO } = require("../utils/socket");

const ORDER_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

// Place an order as a customer
const createOrder = async (req, res) => {
  try {
    if (req.user && ["admin", "vendor"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Admin accounts cannot place customer orders. Please use a customer account.",
      });
    }

    const {
      restaurantId: requestedRestaurantId,
      items,
      deliveryAddress,
      customerInfo,
      paymentDetails,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(422).json({ message: "Order items are required" });
    }

    // Auto-resolve restaurant if not provided
    let restaurant;
    let restaurantId = requestedRestaurantId;
    if (restaurantId) {
      restaurant = await Restaurant.findById(restaurantId);
    }
    if (!restaurant) {
      restaurant = await Restaurant.findOne({ isListed: { $ne: false } }).sort({ createdAt: 1 });
    }
    if (!restaurant) {
      restaurant = await Restaurant.findOne({});
    }

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant is not configured yet" });
    }
    restaurantId = restaurant._id;

    const dishIds = items.map((item) => item.dishId);
    const dishes = await Dish.find({ _id: { $in: dishIds } });
    const dishesById = new Map(dishes.map((dish) => [dish._id.toString(), dish]));

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const dish = dishesById.get(String(item.dishId));
      const quantity = Number(item.quantity);

      if (!dish || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(422).json({ message: "Invalid order item" });
      }

      orderItems.push({
        dishId: dish._id,
        name: dish.name,
        quantity,
        price: dish.price,
      });
      totalAmount += dish.price * quantity;
    }

    // Orders above ₹150 receive FREE Delivery; otherwise standard ₹29
    const deliveryFee = totalAmount > 150 ? 0 : (totalAmount > 0 ? 29 : 0);
    const finalAmount = totalAmount + deliveryFee;

    const paymentMethod = paymentDetails?.method || "cod";
    const paymentStatus = paymentDetails?.status || (paymentMethod === "cod" ? "pending" : "paid");

    const custName =
      customerInfo?.name ||
      deliveryAddress?.name ||
      req.user?.name ||
      "Customer";
    const custPhone =
      customerInfo?.phone ||
      deliveryAddress?.phone ||
      (typeof deliveryAddress === "object" ? deliveryAddress.phone : "") ||
      "";
    const custLocation =
      deliveryAddress?.location ||
      deliveryAddress?.street ||
      (typeof deliveryAddress === "string"
        ? deliveryAddress
        : "Standard Delivery");

    let defaultMins = 35;
    try {
      const rest = await Restaurant.findById(restaurantId).lean();
      if (rest?.defaultOrderTimeLimitMinutes && Number(rest.defaultOrderTimeLimitMinutes) > 0) {
        defaultMins = Number(rest.defaultOrderTimeLimitMinutes);
      }
    } catch (e) {
      // fallback
    }
    const estimatedMins = Number(req.body.estimatedTimeMinutes) || defaultMins;
    const now = new Date();
    const targetDeliveryTime = new Date(now.getTime() + estimatedMins * 60 * 1000);

    let order = await Order.create({
      customerId: req.user._id,
      restaurantId,
      items: orderItems,
      totalAmount: finalAmount,
      phone: custPhone,
      customerName: custName,
      customerInfo: {
        name: custName,
        phone: custPhone,
      },
      deliveryAddress: {
        street: custLocation,
        location: custLocation,
        phone: custPhone,
        name: custName,
      },
      estimatedTimeMinutes: estimatedMins,
      targetDeliveryTime,
      paymentDetails: {
        method: paymentMethod,
        status: paymentStatus,
        paymentId: paymentDetails?.paymentId || paymentDetails?.transactionId || `PAY-${Date.now()}`,
        transactionId: paymentDetails?.transactionId || `TXN-${Date.now()}`,
        paidAt: paymentStatus === "paid" ? new Date() : undefined,
      },
    });




    // Populate order with customer info for rich real-time notification
    order = await Order.findById(order._id)
      .populate("customerId", "name email avatar")
      .populate("restaurantId", "name logoUrl");

    // Real-time broadcast to admin and restaurant room
    try {
      const io = getIO();
      if (io) {
        // Emit to restaurant-specific room
        io.to(String(restaurantId)).emit("new_order", order);
        // Emit to global admin channel
        io.to("admin_room").emit("new_order", order);
        io.emit("new_order_broadcast", order);
      }
    } catch (err) {
      console.error("Socket emit error:", err.message || err);
    }

    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get logged-in customer's orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate("restaurantId", "name logoUrl")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single logged-in customer's order for tracking
const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customerId: req.user._id,
    }).populate("restaurantId", "name logoUrl address");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all orders for restaurant admin
const getVendorOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    let query = {};
    if (restaurantId && restaurantId !== "all") {
      query.restaurantId = restaurantId;
    }

    const orders = await Order.find(query)
      .populate("customerId", "name email avatar")
      .populate("restaurantId", "name")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update order status or payment status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, estimatedTimeMinutes } = req.body;

    const order = await Order.findById(id).populate("restaurantId").populate("customerId", "name email avatar");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Terminal state protection: once delivered or cancelled, state cannot be changed or reversed
    if (["delivered", "cancelled"].includes(order.status) && status && status !== order.status) {
      return res.status(400).json({
        message: `Order is already ${order.status.toUpperCase()} and cannot be modified or reversed.`,
      });
    }

    if (status) {
      if (!ORDER_STATUSES.includes(status)) {
        return res.status(422).json({ message: "Invalid order status" });
      }
      order.status = status;
      if (status === "accepted" && !order.acceptedAt) {
        order.acceptedAt = new Date();
      } else if (status === "delivered" && !order.deliveredAt) {
        order.deliveredAt = new Date();
      } else if (status === "cancelled" && !order.cancelledAt) {
        order.cancelledAt = new Date();
      }
    }

    if (estimatedTimeMinutes && !isNaN(Number(estimatedTimeMinutes))) {
      order.estimatedTimeMinutes = Number(estimatedTimeMinutes);
      order.targetDeliveryTime = new Date(Date.now() + order.estimatedTimeMinutes * 60 * 1000);
    }

    if (paymentStatus && ["pending", "paid", "failed"].includes(paymentStatus)) {
      if (order.status === "cancelled") {
        return res.status(400).json({
          message: "Cannot update payment status for a cancelled order.",
        });
      }
      if (!order.paymentDetails) {
        order.paymentDetails = {};
      }
      order.paymentDetails.status = paymentStatus;
      if (paymentStatus === "paid" && !order.paymentDetails.paidAt) {
        order.paymentDetails.paidAt = new Date();
      }
    }


    await order.save();

    // Broadcast order update
    try {
      const io = getIO();
      if (io) {
        io.emit("order_updated", order);
        io.emit("order_status_updated", {
          orderId: order._id,
          status: order.status,
          order,
        });

        const customerId = order.customerId?._id || order.customerId;
        if (customerId) {
          io.to(`user_${customerId}`).emit("order_status_changed", order);
          io.to(String(customerId)).emit("order_status_changed", order);
        }
        io.to(`order_${order._id}`).emit("order_status_changed", order);
      }
    } catch (err) {
      console.warn("Socket broadcast warning:", err);
    }

    res.json(order);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createOrder, getMyOrders, getMyOrderById, getVendorOrders, updateOrderStatus };

