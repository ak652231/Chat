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
          timestamp: new Date()
        });
        await newMessage.save();

        conversation.lastMessage = newMessage._id;
        await conversation.save();

        const receiverSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === receiverId);

        if (receiverSocket) {
          receiverSocket.emit('receive_message', {
            ...newMessage.toObject(),
            conversationId: conversation._id
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

    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(socket.userId, { isOnline: false }).exec();
      console.log('Client disconnected:', socket.userId);
    });
  });
};