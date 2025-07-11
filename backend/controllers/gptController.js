const CustomGpt = require('../models/gptModel');
const { uploadToR2, deleteFromR2 } = require('../lib/r2');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const UserFavourite = require('../models/UserFavourite');

const createCustomGpt = async (req, res) => {
    console.log('Creating custom GPT...');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    try {
        const { name, description, instructions, conversationStarter, model, capabilities, mcpSchema } = req.body;

        if (!name || !description || !instructions) {
            console.error("Validation Error: Missing required fields (name, description, instructions)");
            return res.status(400).json({ success: false, message: 'Missing required fields: name, description, instructions' });
        }

        let parsedCapabilities;
        try {
            parsedCapabilities = JSON.parse(capabilities || '{"webBrowsing": true}');
        } catch (parseError) {
            console.error("Error parsing capabilities JSON:", parseError);
            return res.status(400).json({ success: false, message: 'Invalid format for capabilities' });
        }

        // Create the custom GPT object
        const customGptData = {
            name,
            description,
            instructions,
            conversationStarter: conversationStarter || '',
            model: model || 'openrouter/auto',
            capabilities: parsedCapabilities,
            mcpSchema: mcpSchema || '',
            createdBy: req.user?._id,
            imageUrl: null,
            knowledgeFiles: []
        };

        const customGpt = new CustomGpt(customGptData);

        // Handle image upload
        const imageFile = req.files?.image?.[0];
        if (imageFile) {
            try {
                console.log('Uploading image...');
                const { fileUrl } = await uploadToR2(
                    imageFile.buffer,
                    imageFile.originalname,
                    'images/gpt'
                );
                customGpt.imageUrl = fileUrl;
                console.log('Image uploaded successfully:', fileUrl);
            } catch (uploadError) {
                console.error("Error during image upload to R2:", uploadError);
                return res.status(500).json({ success: false, message: 'Failed during image upload', error: uploadError.message });
            }
        }

        // Handle knowledge files upload
        const knowledgeUploads = req.files?.knowledgeFiles || [];
        if (knowledgeUploads.length > 0) {
            try {
                console.log('Uploading knowledge files...');
                const knowledgeFilesData = await Promise.all(
                    knowledgeUploads.map(async (file) => {
                        const { fileUrl } = await uploadToR2(
                            file.buffer,
                            file.originalname,
                            'knowledge'
                        );
                        return {
                            name: file.originalname,
                            fileUrl,
                            fileType: file.mimetype,
                        };
                    })
                );
                customGpt.knowledgeFiles = knowledgeFilesData;
                console.log('Knowledge files uploaded successfully');
            } catch (uploadError) {
                console.error("Error during knowledge file upload to R2:", uploadError);
                return res.status(500).json({ success: false, message: 'Failed during knowledge file upload', error: uploadError.message });
            }
        }

        const savedGpt = await customGpt.save();
        console.log('Custom GPT saved successfully:', savedGpt._id);

        res.status(201).json({
            success: true,
            message: 'Custom GPT created successfully',
            customGpt: savedGpt
        });

    } catch (error) {
        console.error("Error in createCustomGpt:", error);

        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            console.error("Validation Errors:", validationErrors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create custom GPT',
            error: error.message
        });
    }
};

const getAllCustomGpts = async (req, res) => {
    try {
        const customGpts = await CustomGpt.find({ createdBy: req.user._id }).populate('createdBy', 'firstName lastName email');
        res.status(200).json({
            success: true,
            customGpts
        });
    } catch (error) {
        console.error('Error fetching user custom GPTs:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching custom GPTs',
            error: error.message
        });
    }
};

const getCustomGptById = async (req, res) => {
    const { id } = req.params;
    try {
        const customGpt = await CustomGpt.findById(id).populate('createdBy', 'firstName lastName email');
        if (!customGpt) {
            return res.status(404).json({
                success: false,
                message: 'Custom GPT not found'
            });
        }
        res.status(200).json({
            success: true,
            customGpt
        });
    } catch (error) {
        console.error('Error fetching custom GPT by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching custom GPT',
            error: error.message
        });
    }
}   

const updateCustomGpt = async (req, res) => {
    const { id } = req.params;
    try {
        // Log the request for debugging
        console.log('Updating GPT with ID:', id);
        console.log('Body:', req.body);
        console.log('Files:', req.files);
        
        // Get data from request
        const { name, description, instructions, conversationStarter, model, capabilities, mcpSchema } = req.body;
        
        // Validate required fields
        if (!name || !description || !instructions) {
            console.error("Validation Error: Missing required fields");
            return res.status(400).json({ success: false, message: 'Missing required fields: name, description, instructions' });
        }
        
        let parsedCapabilities;
        try {
            parsedCapabilities = JSON.parse(capabilities || '{"webBrowsing": true}');
        } catch (parseError) {
            console.error("Error parsing capabilities JSON:", parseError);
            return res.status(400).json({ success: false, message: 'Invalid format for capabilities' });
        }

        // Create clean update data object without undefined values
        const updateData = {
            name: name || "",
            description: description || "",
            instructions: instructions || "",
            conversationStarter: conversationStarter || "",
            model: model || "openrouter/auto",
            capabilities: parsedCapabilities,
            mcpSchema: mcpSchema || ""
        };

        // Handle image upload if provided
        const imageFile = req.files?.image?.[0];
        if (imageFile) {
            try {
                const { fileUrl } = await uploadToR2(
                    imageFile.buffer,
                    imageFile.originalname,
                    'images/gpt'
                );
                updateData.imageUrl = fileUrl;
            } catch (uploadError) {
                console.error("Error during image upload to R2:", uploadError);
                return res.status(500).json({ success: false, message: 'Failed during image upload', error: uploadError.message });
            }
        }

        // Handle knowledge files if provided
        const knowledgeUploads = req.files?.knowledgeFiles || [];
        if (knowledgeUploads.length > 0) {
            try {
                const knowledgeFilesData = await Promise.all(
                    knowledgeUploads.map(async (file) => {
                        const { fileUrl } = await uploadToR2(
                            file.buffer,
                            file.originalname,
                            'knowledge'
                        );
                        return {
                            name: file.originalname,
                            fileUrl,
                            fileType: file.mimetype,
                        };
                    })
                );
                
                // Use the correct update operator for arrays
                updateData.$push = { knowledgeFiles: { $each: knowledgeFilesData } };
            } catch (uploadError) {
                console.error("Error during knowledge file upload to R2:", uploadError);
                return res.status(500).json({ success: false, message: 'Failed during knowledge file upload', error: uploadError.message });
            }
        }

        // Make sure we return the updated document with {new: true}
        const customGpt = await CustomGpt.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).populate('createdBy', 'firstName lastName email');
        
        if (!customGpt) {
            return res.status(404).json({
                success: false,
                message: 'Custom GPT not found'
            });
        }
        
        console.log('GPT updated successfully:', customGpt);
        
        res.status(200).json({
            success: true,
            message: 'Custom GPT updated successfully',
            customGpt
        });
    } catch (error) {
        console.error('Error updating custom GPT:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update custom GPT',
            error: error.message
        });
    }
};

const deleteCustomGpt = async (req, res) => {
    const { id } = req.params;
    try {
        const customGpt = await CustomGpt.findById(id);
        if (!customGpt) {
            return res.status(404).json({
                success: false,
                message: 'Custom GPT not found'
            });
        }
  
        if (customGpt.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this custom GPT'
            });
        }
  
        // Delete image from R2 if exists
        if (customGpt.imageUrl) {
            try {
                let imageKey = customGpt.imageUrl;
                if (process.env.R2_PUBLIC_URL && customGpt.imageUrl.startsWith(process.env.R2_PUBLIC_URL)) {
                    imageKey = customGpt.imageUrl.replace(process.env.R2_PUBLIC_URL + '/', '');
                }
                await deleteFromR2(imageKey);
            } catch (error) {
                console.error('Error deleting image from R2:', error);
            }
        }
  
        // Delete knowledge files from R2
        for (const file of customGpt.knowledgeFiles) {
            try {
                let fileKey = file.fileUrl;
                if (process.env.R2_PUBLIC_URL && file.fileUrl.startsWith(process.env.R2_PUBLIC_URL)) {
                    fileKey = file.fileUrl.replace(process.env.R2_PUBLIC_URL + '/', '');
                }
                await deleteFromR2(fileKey);
            } catch (error) {
                console.error('Error deleting knowledge file from R2:', error);
            }
        }
  
        await CustomGpt.findByIdAndDelete(id);
  
        res.status(200).json({
            success: true,
            message: 'Custom GPT deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting custom GPT:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete custom GPT',
            error: error.message
        });
    }
};


const assignGptToUser = async (req, res) => { 
    const { id } = req.params;       
    try {
        const { user, gpt } = req.body;
        
        if(req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        if(!user || !user._id) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }
        
        if(!mongoose.Types.ObjectId.isValid(user._id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }
        
        // Find the user first to verify they exist
        const userExists = await User.findById(user._id);
        if(!userExists) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Verify the GPT exists
        const gptToAssign = await CustomGpt.findById(id);
        if(!gptToAssign) {
            return res.status(404).json({
                success: false,
                message: 'GPT not found'
            });
        }
        
        // Update the GPT with the assigned user
        const assignedGpt = await CustomGpt.findByIdAndUpdate(
            id, 
            { assignedTo: user._id }, 
            { new: true }
        );
        
        await User.findByIdAndUpdate(
            user._id,
            { $addToSet: { assignedGpts: id } }, 
            { new: true }
        );
        
        return res.status(200).json({
            success: true,
            message: 'GPT assigned to user successfully',
            assignedGpt
        });
    } catch (error) {
        console.error('Error assigning GPT to user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to assign GPT to user',
            error: error.message
        });
    }
}

const getAssignedGpts = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID provided'
            });
        }
        
        // Find the user and populate their assigned GPTs
        const user = await User.findById(id).populate('assignedGpts');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            assignedGpts: user.assignedGpts || [],
            message: 'Assigned GPTs fetched successfully'
        });
    } catch (error) {
        console.error('Error getting assigned GPTs:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get assigned GPTs',
            error: error.message
        });
    }
}

const getCustomGptTools = async (req, res) => {
    const { id } = req.params;
    try {
        if(!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GPT ID provided'
            });
        }
        if(req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const customGpt = await CustomGpt.findById(id);
        if(!customGpt) {
            return res.status(404).json({
                success: false,
                message: 'GPT not found'
            });
        }
        return res.status(200).json({
            success: true,
            tools: customGpt.composioTools  
        });
    } catch (error) {
        console.error('Error getting custom GPT tools:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get custom GPT tools',
            error: error.message
        });
    }
}

const updateCustomGptTools= async (req, res) => {
    const { id } = req.params;
    try {
        if(!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GPT ID provided'
            });
        }
        if(req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const { tools } = req.body;
        if(!tools || !Array.isArray(tools)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tools provided'
            });
        }
        const customGpt = await CustomGpt.findById(id);
        if(!customGpt) {
            return res.status(404).json({
                success: false,
                message: 'GPT not found'
            });
        }
        await CustomGpt.findByIdAndUpdate(id, { composioTools: tools }, { new: true });
        return res.status(200).json({
            success: true,
            message: 'Custom GPT tools updated successfully',
            tools: customGpt.composioTools
        });
    } catch (error) {   
        console.error('Error updating custom GPT tools:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update custom GPT tools',
            error: error.message
        });
    }
}

// New function to get a specific GPT if it's assigned to the user
const getUserAssignedGptById = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GPT ID provided'
            });
        }
        
        // Find the GPT first
        const customGpt = await CustomGpt.findById(id).populate('createdBy', 'firstName lastName email');
        
        if (!customGpt) {
            console.log(`GPT with ID ${id} not found in database`);
            return res.status(404).json({
                success: false,
                message: 'GPT not found. It may have been deleted or the ID is incorrect.'
            });
        }
        
        // Check if the user has access to this GPT
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Check if the GPT is assigned to the user (convert ObjectIds to strings for comparison)
        const isAssigned = user.assignedGpts.some(gptId => gptId.toString() === id.toString());
        
        if (!isAssigned && req.user.role !== 'admin') {
            console.log(`User ${req.user._id} attempted to access unassigned GPT ${id}`);
            return res.status(403).json({
                success: false,
                message: 'Access denied. This GPT is not assigned to you.'
            });
        }
        
        console.log(`Successfully fetched GPT ${id} for user ${req.user._id}`);
        return res.status(200).json({
            success: true,
            customGpt,
            message: 'GPT fetched successfully'
        });
    } catch (error) {
        console.error('Error getting user assigned GPT by ID:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get GPT',
            error: error.message
        });
    }
}


const addToFavourites = async (req, res) => {
    const { id } = req.params;
    try {
        if(!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GPT ID provided'
            });
        }
        if(req.user.role !== 'user') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const { folder } = req.body;
        const user = await User.findById(req.user._id);
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const gpt = await CustomGpt.findById(id);
        if(!gpt) {
            return res.status(404).json({
                success: false,
                message: 'GPT not found'
            });
        }
        const existingFavourite = await UserFavourite.findOne({ user: user._id, gpt: id });
        if(existingFavourite) {
            return res.status(400).json({
                success: false,
                message: 'GPT already in favourites'
            });
        }
        const newFavourite = new UserFavourite({ user: user._id, gpt: id, folder: folder || 'Uncategorized' });
        await newFavourite.save();
        return res.status(200).json({
            success: true,
            message: 'GPT added to favourites successfully'
        });
    } catch (error) {
        console.error('Error adding to favourites:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add to favourites',
            error: error.message
        });
    }
}

const getFavourites = async (req, res) => {
    const { userId } = req.params;
    try {
        if(!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID provided'
            });
        }
        if(req.user.role !== 'user') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        // Ensure user can only access their own favourites
        if(req.user._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Populate the GPT data in favourites
        const favourites = await UserFavourite.find({ user: userId }).populate('gpt');
        return res.status(200).json({
            success: true,
            favourites,
            message: 'Fetched favourites successfully'
        });
    } catch (error) {
        console.error('Error fetching favourites:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch favourites',
            error: error.message
        });
    }
}

const removeFromFavourites = async (req, res) => {
    const { gptId } = req.params;
    try {
        if(!gptId || gptId === 'undefined' || !mongoose.Types.ObjectId.isValid(gptId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GPT ID provided'
            }); 
        }
        if(req.user.role !== 'user') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            }); 
        }
        
        // Remove the body gpt check and use gptId from params
        const favourite = await UserFavourite.findOne({ user: req.user._id, gpt: gptId });
        if(!favourite) {
            return res.status(404).json({
                success: false, 
                message: 'GPT not in favourites'
            });
        }
        await UserFavourite.findByIdAndDelete(favourite._id);
        return res.status(200).json({
            success: true,  
            message: 'GPT removed from favourites successfully'
        });
    } catch (error) {
        console.error('Error removing from favourites:', error);
        return res.status(500).json({
            success: false, 
            message: 'Failed to remove from favourites',
            error: error.message
        });
    }
}

const unassignGptFromUser = async (req, res) => {
    const { gptId } = req.params;
    try {
        // Validate gptId
        if(!gptId || !mongoose.Types.ObjectId.isValid(gptId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid GPT ID provided'  
            });
        }
        
        // Check if admin
        if(req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized' 
            });
        }
        
        // Get userId from request body
        const { userId } = req.body;
        
        if(!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false, 
                message: 'Invalid user ID provided'
            });
        }
        
        // Find the user
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Find the GPT
        const gpt = await CustomGpt.findById(gptId);
        if(!gpt) {  
            return res.status(404).json({
                success: false,
                message: 'GPT not found'
            });
        }
        
        // Check if GPT is assigned to user using proper comparison for ObjectIds
        const isAssigned = user.assignedGpts.some(id => id.toString() === gptId.toString());
        if(!isAssigned) {
            return res.status(400).json({
                success: false,
                message: 'GPT is not assigned to this user'
            });
        }
        
        // Remove GPT from user's assignments
        await User.findByIdAndUpdate(userId, {
            $pull: { assignedGpts: gptId }
        });
        
        return res.status(200).json({
            success: true,
            message: 'GPT unassigned from user successfully'
        });
    } catch (error) {   
        console.error('Error unassigning GPT from user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to unassign GPT from user',
            error: error.message
        });
    }
}

module.exports = {
    createCustomGpt,
    getAllCustomGpts,
    getCustomGptById,
    updateCustomGpt,
    deleteCustomGpt,
    assignGptToUser,
    unassignGptFromUser,
    getAssignedGpts,
    getCustomGptTools,
    updateCustomGptTools,
    getUserAssignedGptById,
    addToFavourites,
    getFavourites,
    removeFromFavourites
}; 