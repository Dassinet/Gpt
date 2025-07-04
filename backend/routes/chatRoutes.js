const express = require('express');
const { protectRoute } = require('../middleware/authMiddleware');

const router = express.Router();

const { saveChat, getChats, getChatById, deleteChat } = require('../controllers/chatController');

router.post('/save',protectRoute, saveChat);
router.get('/all', protectRoute, getChats);
router.get('/:id', protectRoute, getChatById);
router.delete('/:id', protectRoute, deleteChat);

module.exports = router;