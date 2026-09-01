const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
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
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: String,
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
