const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: function() {
            // Name is not required on initial creation for invited users
            return !this.invitationToken && !this.googleId;
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: function() {
            // Password is not required if signing up with Google or accepting an invitation
            return !this.googleId && !this.invitationToken;
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
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
