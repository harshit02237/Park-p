const mongoose = require('mongoose');
const crypto = require('crypto');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
    },
    googleId: {
        type: String,
        sparse: true,
    },
    avatar: {
        type: String,
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'vendor'],
        default: 'customer',
    },
    favouriteDishes: [{
        type: Schema.Types.ObjectId,
        ref: 'Dish',
    }],
}, { timestamps: true });

// Password hashing helper using crypto pbkdf2
userSchema.methods.setPassword = function(plainPassword) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(plainPassword, salt, 1000, 64, 'sha512').toString('hex');
    this.password = `${salt}:${hash}`;
};

userSchema.methods.validatePassword = function(plainPassword) {
    if (!this.password) return false;
    const parts = this.password.split(':');
    if (parts.length !== 2) return false;
    const [salt, storedHash] = parts;
    const hash = crypto.pbkdf2Sync(plainPassword, salt, 1000, 64, 'sha512').toString('hex');
    return hash === storedHash;
};

module.exports = mongoose.model('User', userSchema);

