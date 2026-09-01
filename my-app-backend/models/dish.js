const mongoose = require('mongoose');
const { Schema } = mongoose;

const dishSchema = new Schema({
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: String,
    imageUrl: String,
    price: {
        type: Number,
        required: true,
    },
    category: String,
    isVeg: {
        type: Boolean,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Dish', dishSchema);
