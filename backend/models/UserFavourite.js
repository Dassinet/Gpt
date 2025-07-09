const mongoose = require('mongoose');

const userFavouriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gpt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomGpt',
        required: true
    },
    folder: {
        type: String,
        default: 'Uncategorized'
    }
}, { timestamps: true });

userFavouriteSchema.index({ user: 1, gpt: 1 }, { unique: true });

const UserFavourite = mongoose.model('UserFavourite', userFavouriteSchema);

module.exports = UserFavourite;