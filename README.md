# FuturChat - Real-Time Chat Application

FuturChat is a real-time chat application built using the MERN stack (MongoDB, Express, React, and Node.js). It allows users to register, log in, and engage in real-time conversations with other users.

## Table of Contents
- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Implemented Requirements](#implemented-requirements)
- [Bonus Features](#bonus-features)
- [Technologies Used](#technologies-used)

## Features

- User authentication (registration and login)
- Real-time messaging
- Online presence indicators
  - Green dot on user profile for online users
  - Grey dot on user profile for offline users
- Chat history on left hand side section
- User search functionality on top right corner
- Unread message indicators in red bubbles in chat history
- Message status indicators (if message is seen by receiver then green tick will appear on message/otherwise single tick)
- Responsive design

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)
- MongoDB

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/ak652231/Chat.git
   ```

2. Navigate to the project directory:
   ```
   cd Chat
   ```

3. Install dependencies for both client and server:
   ```
   cd client
   npm install
   cd ../server
   npm install
   ```

### Running the Application Locally

1. Start the server:
   ```
   cd server
   npm start
   ```

2. In a new terminal, start the client:
   ```
   cd client
   npm start
   ```

3. The application should now be running on `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Register a new account or log in if you already have one
3. Start chatting with other users in real-time

## Implemented Requirements

1. User Authentication:
   - JWT-based authentication
   - Secure password hashing
   - User registration and login

2. Chat Functionality:
   - Real-time messaging using Socket.io
   - Chat history stored in MongoDB

3. User Interface:
   - React-based frontend
   - List of online users
   - Simple chat UI with input field and message display area

4. Online Presence Indicator:
   - Real-time updates of user online/offline status

5. Basic UI Features:
   - Auto-scrolling chat window
   - Message timestamps
   - Minimalist design

## Bonus Features

- Message read receipts

## Technologies Used

- Frontend: React, Socket.io-client
- Backend: Node.js, Express, Socket.io
- Database: MongoDB
- Authentication: JWT (JSON Web Tokens)

## Hosted Application

You can access the hosted version of the application at: https://symphonious-taffy-107840.netlify.app/

## Note

Due to time constraints, some bonus features like typing indicators and media message support were not implemented in this version of the application.
