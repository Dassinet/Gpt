const ChatHistory = require('../models/chatHistory');

const saveChat = async (req, res) => {
    try {
        const { userId, gptId, gptName, message, role, model } = req.body;

        if (!userId || !gptId || !message || !role) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate role
        if (!['user', 'assistant'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be either "user" or "assistant"'
            });
        }

        // Find existing conversation for this user and GPT
        let conversation = await ChatHistory.findOne({
            userId,
            gptId
        }).sort({ updatedAt: -1 }); // Get the most recent conversation

        if (!conversation) {
            // Create new conversation if none exists
            conversation = new ChatHistory({
                userId,
                gptId,
                gptName: gptName || 'Unnamed GPT',
                model: model || 'gpt-4o-mini',
                messages: [],
                lastMessage: '',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // Add the new message to the conversation
        conversation.messages.push({
            role,
            content: message,
            timestamp: new Date()
        });

        // Update lastMessage and updatedAt
        conversation.lastMessage = message;
        conversation.updatedAt = new Date();

        // Save the updated conversation
        await conversation.save();

        res.status(200).json({
            success: true,
            message: 'Chat saved successfully',
            data: {
                id: conversation._id,
                conversation
            }
        });

    } catch (error) {
        console.error('Error saving chat:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving chat',
            error: error.message
        });
    }
}

const getChats = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const chats = await ChatHistory.find({ userId })
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: chats
        });

    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chats',
            error: error.message
        });
    }
}

const getChatById = async (req, res) => {
    try {
        const { id } = req.params;

        const chat = await ChatHistory.findById(id);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        res.status(200).json({
            success: true,
            data: chat
        });

    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chat',
            error: error.message
        });
    }
}

const deleteChat = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await ChatHistory.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Chat deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting chat',
            error: error.message
        });
    }
}

module.exports = {
    saveChat,
    getChats,
    getChatById,
    deleteChat
}
