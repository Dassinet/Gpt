const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: function() {
            return this.isVerified === true;
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: function() {
            return this.isVerified === true;
        },
        select: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    department: {
        type: String,
        default: 'Not Assigned'
    },
    profilePic: {
        type: String,
        default: null
    },
    lastActive: {
        type: Date,
        default: null
    },
    apiKeys: {
        type: Object,
        select: false,
        default: {}
    },
    assignedGpts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomGpt',
    }],
    isVerified: {
        type: Boolean,
        default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    lastVerificationResent: Date,
    invitationToken: String,
    invitationTokenExpiresAt: Date,
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
