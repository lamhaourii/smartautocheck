const express = require('express');
const ChatbotController = require('../controllers/chatbot.controller');

const router = express.Router();

router.post('/message', ChatbotController.sendMessage);
router.get('/session/:id', ChatbotController.getConversation);

module.exports = router;
