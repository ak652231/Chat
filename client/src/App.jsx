import React from 'react';
import AuthForm from './components/login';
import ChatInterface from './components/chat';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const App = () => {
  return (
    <Router> {/* Wrap everything inside Router */}
      <div className="font-sans bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] min-h-screen flex flex-col">
        <header className="bg-[#1E3A8A] p-6 text-center shadow-lg">
          <h1 className="text-3xl font-bold text-[#E5E7EB]">FuturChat</h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
          <div className="w-full max-w-md">
            <Routes> {/* Wrap Routes component around Route components */}
              <Route path="/" element={<AuthForm />} />
              <Route path="/chat" element={<ChatInterface />} />
            </Routes>
          </div>
        </main>
        <footer className="bg-[#1E3A8A] p-4 text-center text-[#A78BFA] text-sm">
          © 2023 FuturChat. All rights reserved.
        </footer>
      </div>
    </Router>
  );
};

export default App;
