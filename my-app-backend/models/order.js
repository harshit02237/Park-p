const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema({
    dishId: {
        type: Schema.Types.ObjectId,
        ref: 'Dish',
        required: true,
    },
    name: String,
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: Number,
});

const orderSchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'placed',
    },
    customerInfo: {
        name: String,
        phone: String,
    },
    phone: String,
    customerName: String,
    deliveryAddress: {
        street: String,
        location: String,
        phone: String,
        name: String,
        city: String,
        state: String,
        zip: String,
    },

    paymentDetails: {
        method: {
            type: String,
            enum: ['cod', 'upi', 'card', 'online'],
            default: 'cod',
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending',
        },
        paymentId: String,
        transactionId: String,
        paidAt: Date,
    },
    estimatedTimeMinutes: {
        type: Number,
        default: 35,
    },
    targetDeliveryTime: Date,
    acceptedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Order', orderSchema);


