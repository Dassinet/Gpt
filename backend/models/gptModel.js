const mongoose = require('mongoose');

const CustomGptSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    instructions: {
        type: String,
        required: true,
        maxLength: 10000,
    },
    conversationStarter: {
        type: String,
        default: ""
    },
    model: {
        type: String,
        default: ""
    },
    capabilities: {
        type: Object,
        default: { webBrowsing: true }
    },
    mcpSchema: {
        type: String,
        default: ""
    },
    imageUrl: {
        type: String,
        default: null
    },
    knowledgeFiles: [{
        name: String,
        fileUrl: String,
        fileType: String,
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

const CustomGpt = mongoose.model('CustomGpt', CustomGptSchema);

module.exports = CustomGpt; 