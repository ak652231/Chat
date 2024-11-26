import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { FiSend, FiUser, FiMessageSquare, FiCircle, FiSearch, FiX } from 'react-icons/fi';

const getCurrentUserId = () => {
  try {
    const token = sessionStorage.getItem('token');
    if (!token) return null;
    const decodedToken = jwtDecode(token);
    return decodedToken.user.id;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const ChatInterface = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // In useEffect or when component mounts
  useEffect(() => {
    // Connect to socket
    const newSocket = io('http://localhost:5000', {
      auth: {
        token: sessionStorage.getItem('token')
      }
    });

    newSocket.on('receive_message', (message) => {
      if (selectedConversation &&
        message.conversationId === selectedConversation.conversationId) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [selectedConversation]);

  useEffect(() => {
    const fetchConversations = async () => {
      const token = sessionStorage.getItem('token');
      console.log('Stored token:', sessionStorage.getItem('token'));

      try {
        const response = await fetch('http://localhost:5000/api/chat/conversations', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        const conversationsArray = Array.isArray(data) ? data : [data];
        console.log("convo:", conversationsArray);
        setConversations(conversationsArray);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversations([]);
      }
    };

    const fetchUsers = async () => {
      const token = sessionStorage.getItem('token');

      try {
        const response = await fetch(`http://localhost:5000/api/chat/search-users?query=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error('Unexpected response format:', data);
          setUsers([]); 
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setUsers([]); 
      }
    };

    fetchConversations();
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      if (!selectedConversation.conversationId) {
        const token = sessionStorage.getItem('token');
        const currentUserId = getCurrentUserId();

        try {
          const response = await fetch(`http://localhost:5000/api/chat/search-conversation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              senderId: currentUserId,
              receiverId: selectedConversation.user._id
            })
          });

          const data = await response.json();

          if (data.conversationId) {
            setSelectedConversation(prev => ({
              ...prev,
              conversationId: data.conversationId
            }));
          }
        } catch (error) {
          console.error('Failed to search for existing conversation:', error);
        }

        return;
      }

      const token = sessionStorage.getItem('token');
      try {
        const response = await fetch(`http://localhost:5000/api/chat/conversations/${selectedConversation.conversationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        const messagesArray = Array.isArray(data) ? data : [data];
        console.log('Fetched messages:', data);

        if (Array.isArray(data)) {
          setMessages(messagesArray);
        } else {
          console.error('Data is not an array:', data);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered);
  }, [searchQuery, users]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage || !socket) return;

    const receiverId = selectedConversation ?
      selectedConversation.user._id :
      searchResults.find(user => user.username.toLowerCase().includes(searchQuery.toLowerCase()))?._id;

    if (!receiverId) {
      console.error('No receiver selected');
      return;
    }

    socket.emit('send_message', {
      receiverId,
      content: newMessage
    });
    const fetchMessages = async () => {
      if (!selectedConversation) return;

      if (!selectedConversation.conversationId) {
        const token = sessionStorage.getItem('token');
        const currentUserId = getCurrentUserId();

        try {
          const response = await fetch(`http://localhost:5000/api/chat/search-conversation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              senderId: currentUserId,
              receiverId: selectedConversation.user._id
            })
          });

          const data = await response.json();

          if (data.conversationId) {
            setSelectedConversation(prev => ({
              ...prev,
              conversationId: data.conversationId
            }));
          }
        } catch (error) {
          console.error('Failed to search for existing conversation:', error);
        }
        
        return;
      }

      const token = sessionStorage.getItem('token');
      try {
        const response = await fetch(`http://localhost:5000/api/chat/conversations/${selectedConversation.conversationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        const messagesArray = Array.isArray(data) ? data : [data];
        console.log('Fetched messages:', data);

        if (Array.isArray(data)) {
          setMessages(messagesArray);
        } else {
          console.error('Data is not an array:', data);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };
    const fetchConversations = async () => {
      const token = sessionStorage.getItem('token');
      console.log('Stored token:', sessionStorage.getItem('token'));

      try {
        const response = await fetch('http://localhost:5000/api/chat/conversations', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        const conversationsArray = Array.isArray(data) ? data : [data];
        console.log("convo:", conversationsArray);
        setConversations(conversationsArray);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversations([]); 
      }
    };
    fetchConversations();
    fetchMessages();
    setNewMessage('');

  };
  const handleUserSelect = (user) => {
    setSelectedConversation({
      user: user,
      conversationId: null  
    });
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F172A] text-[#E5E7EB]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#2563EB] text-[#E5E7EB] rounded-lg px-4 py-2 hover:bg-[#1E40AF] transition-colors duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0F172A] text-[#E5E7EB]">
      {/* Top section */}
      <div className="absolute top-0 left-0 right-0 bg-[#1E3A8A] p-2 flex items-center justify-between z-10">
        <h1 className="text-xl font-bold text-[#FACC15]">FuturChat</h1>
        <div className="flex items-center">
          {selectedConversation && !selectedConversation.conversationId && (
            <button
              className="mr-2 bg-[#2563EB] text-[#E5E7EB] rounded-full p-2 hover:bg-[#1E40AF] transition-colors duration-300"
            >
              <FiX />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="bg-[#2563EB] text-[#E5E7EB] rounded-full p-2 hover:bg-[#1E40AF] transition-colors duration-300"
          >
            <FiSearch />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex w-full pt-12 transition-all duration-300 ease-in-out">
        {/* Conversations Sidebar */}
        <div className={`w-64 bg-[#1E3A8A] p-4 overflow-y-auto h-[calc(100vh-3rem)] transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-48' : 'w-64'}`}>
          <h2 className="text-xl font-bold mb-4 text-[#FACC15]">Chats</h2>
          <ul className="space-y-2">
            {conversations.map((conv) => (
              <li
                key={conv.conversationId}
                className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ${selectedConversation?.conversationId === conv.conversationId ? 'bg-[#2563EB]' : 'hover:bg-[#312E81]'
                  }`}
                onClick={() => setSelectedConversation(conv)}
              >
                <FiUser className="mr-2 text-[#FACC15]" />
                <span className="truncate">
                  {conv.user?.name || conv.user?.username || 'Unknown User'}
                </span>
                <FiCircle
                  className={`ml-auto w-2 h-2 ${conv.user?.isOnline ? 'text-green-500' : 'text-gray-500'
                    }`}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col h-[calc(100vh-3rem)] transition-all duration-300 ease-in-out ${isSearchOpen ? 'mr-64' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-[#1E3A8A] p-4 flex items-center">
                <FiUser className="mr-2 text-[#FACC15]" />
                <span className="font-bold">{selectedConversation.user.name}</span>
                <FiCircle
                  className={`ml-2 w-2 h-2 ${selectedConversation.user.isOnline ? 'text-green-500' : 'text-gray-500'
                    }`}
                />
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.senderId === getCurrentUserId() ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${message.senderId === getCurrentUserId() ? 'bg-[#2563EB]' : 'bg-[#312E81]'
                        }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs text-[#A78BFA] mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="bg-[#1E3A8A] p-4">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#312E81] text-[#E5E7EB] placeholder-[#A78BFA] rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                  <button
                    type="submit"
                    className="bg-[#2563EB] text-[#E5E7EB] rounded-r-lg px-4 py-2 hover:bg-[#1E40AF] transition-colors duration-300"
                  >
                    <FiSend />
                  </button>
                </div>
              </form>
            </>
          ) : (
            // No conversation selected
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FiMessageSquare className="mx-auto text-6xl text-[#A78BFA] mb-4" />
                <p className="text-xl">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>

        {/* Search Capsule */}
        <div
          className={`fixed right-0 top-12 bottom-0 bg-[#1E3A8A] w-64 transition-all duration-300 ease-in-out transform ${isSearchOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          <div className="p-4">
            <div className="flex items-center mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="flex-1 bg-[#312E81] text-[#E5E7EB] placeholder-[#A78BFA] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div className="overflow-y-auto h-[calc(100vh-8rem)]">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-[#312E81] transition-colors duration-200"
                  onClick={() => handleUserSelect(user)}
                >
                  <FiUser className="mr-2 text-[#FACC15]" />
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

