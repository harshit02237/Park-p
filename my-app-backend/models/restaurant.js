const mongoose = require('mongoose');
const { Schema } = mongoose;

const restaurantSchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        latitude: Number,
        longitude: Number,
    },
    logoUrl: String,
    cuisine: [String],
    openingHours: String,
    isVeg: {
        type: Boolean,
        default: false,
    },
    rating: {
        type: Number,
        default: 0,
    },
    isListed: {
        type: Boolean,
        default: true,
    },
    isAppreciated: {
        type: Boolean,
        default: false,
    },
    appreciationNote: {
        type: String,
        default: "",
    },
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
