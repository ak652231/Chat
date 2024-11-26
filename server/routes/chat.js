const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController'); 

router.get('/conversations/:conversationId', auth, chatController.getConversationMessages);
router.get('/conversations', auth, chatController.getConversations);
router.post('/search-conversation', auth,chatController.searchConversation);

router.get('/search-users', auth, chatController.searchUsers);

module.exports = router; 
