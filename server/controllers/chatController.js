const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userObjectId = new mongoose.Types.ObjectId(userId);

    console.log('Retrieving conversations for userId:', userId);

    const conversations = await Conversation.aggregate([
      {
        $match: {
          participants: userObjectId
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { participantIds: '$participants' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$_id', '$$participantIds'] },
                    { $ne: ['$_id', userObjectId] }
                  ]
                }
              }
            }
          ],
          as: 'otherUser'
        }
      },
      {
        $unwind: {
          path: '$otherUser',
          preserveNullAndEmptyArrays: false 
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'lastMessage',
          foreignField: '_id',
          as: 'lastMessageDetails'
        }
      },
      {
        $unwind: {
          path: '$lastMessageDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          conversationId: '$_id',
          user: {
            _id: '$otherUser._id',
            name: '$otherUser.name',
            username: '$otherUser.username',
            isOnline: '$otherUser.isOnline'
          },
          lastMessage: '$lastMessageDetails.content',
          lastMessageTimestamp: '$lastMessageDetails.timestamp'
        }
      },
      {
        $sort: { lastMessageTimestamp: -1 }
      }
    ]);

    console.log('Conversations found:', conversations.length);
    console.log('First conversation (if any):', conversations[0]);

    const allConversations = await Conversation.find({ 
      participants: userObjectId 
    });
    console.log('Raw conversations count:', allConversations.length);

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({ 
      message: 'Server error', 
      errorDetails: error.message 
    });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const messages = await Message.find({ 
      conversationId: conversationId 
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (typeof query !== 'string') {
      return res.status(400).json({ message: 'Invalid query parameter' });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
          ]
        },
        { _id: { $ne: userId } }
      ]
    }).select('_id name username isOnline');

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.searchConversation = async (req, res) => {
  const { senderId, receiverId } = req.body;
  
  try {
    const existingConversation = await Conversation.findOne({
      $or: [
        { participants: [senderId, receiverId] },
        { participants: [receiverId, senderId] }
      ]
    });

    if (existingConversation) {
      return res.json({ 
        conversationId: existingConversation._id 
      });
    }

    res.status(404).json({ message: 'No existing conversation found' });
  } catch (error) {
    res.status(500).json({ message: 'Error finding conversation' });
  }
};