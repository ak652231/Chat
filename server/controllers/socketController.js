const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.user.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.userId);

    User.findByIdAndUpdate(socket.userId, { isOnline: true }).exec();
    
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content } = data;
        const senderId = socket.userId;

        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
          conversation = new Conversation({
            participants: [senderId, receiverId]
          });
          await conversation.save();
        }

        const newMessage = new Message({
          conversationId: conversation._id,
          senderId,
          receiverId,
          content,
          timestamp: new Date(),
          read: false 
        });
        await newMessage.save();

        conversation.lastMessage = newMessage._id;
        await conversation.save();

        const receiverSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === receiverId);

        if (receiverSocket) {
          const unreadCount = await Message.countDocuments({
            conversationId: conversation._id,
            receiverId: receiverId,
            read: false
          });

          receiverSocket.emit('receive_message', {
            ...newMessage.toObject(),
            conversationId: conversation._id,
            unreadCount: unreadCount,
            senderId: senderId  
          });
        }

        socket.emit('message_sent', {
          ...newMessage.toObject(),
          conversationId: conversation._id
        });

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    socket.on('mark_messages_read', async (data) => {
      try {
        const { conversationId, senderId } = data;
        const receiverId = socket.userId;

        const updatedMessages = await Message.updateMany(
          { 
            conversationId: conversationId, 
            senderId: senderId,
            receiverId: receiverId,
            read: false 
          },
          { read: true }
        );

        const senderSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === senderId);

        const unreadCount = await Message.countDocuments({
          conversationId: conversationId,
          receiverId: senderId,
          read: false
        });

        if (senderSocket) {
          senderSocket.emit('messages_read', {
            conversationId,
            receiverId,
            unreadCount  
          });
        }

        io.to(senderId).emit('messages_read', {
          conversationId,
          receiverId,
          unreadCount
        });

      } catch (error) {
        console.error('Mark messages read error:', error);
      }
    });

    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(socket.userId, { isOnline: false }).exec();
      console.log('Client disconnected:', socket.userId);
    });
  });
};