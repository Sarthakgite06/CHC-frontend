import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, X, Send, Bot, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import './Chatbot.css';
import API from '../../api/axios'; // using current project's axios instance
import ReactMarkdown from 'react-markdown';

const Chatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [targetHealthCardId, setTargetHealthCardId] = useState('');
  const messagesEndRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await API.get('/api/chat/history');
      setMessages(res.data || []);
    } catch (err) {
      console.error('Failed to fetch chat history', err);
    }
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetchHistory();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { sender: 'USER', message: userMessage, timestamp: new Date().toISOString() }]);
    setIsLoading(true);

    try {
      const role = user?.role || '';
      const payload = {
        message: userMessage,
        targetHealthCardId: role.includes('Doctor') ? targetHealthCardId : undefined
      };
      const res = await API.post('/api/chat', payload);
      setMessages(prev => [...prev, { sender: 'AI', message: res.data.reply, timestamp: new Date().toISOString() }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'AI', message: 'Sorry, I encountered an error while processing your request.', timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      try {
        await API.delete('/api/chat/clear');
        setMessages([]);
      } catch (err) {
        console.error('Failed to clear chat history', err);
      }
    }
  };

  if (!user || (!user.role?.includes('Patient') && !user.role?.includes('Doctor'))) {
    return null;
  }

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''} ${isMinimized ? 'minimized' : ''}`}>
      {!isOpen && (
        <button className="chatbot-fab" onClick={() => setIsOpen(true)}>
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <Bot size={24} />
              <span>AI Health Assistant</span>
            </div>
            <div className="chatbot-actions">
              {messages.length > 0 && (
                <button onClick={handleClearChat} title="Clear Chat">
                  <Trash2 size={18} />
                </button>
              )}
              <button onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {user.role?.includes('Doctor') && (
                <div className="chatbot-target-input">
                  <input 
                    type="text" 
                    placeholder="Patient Health Card ID (optional)" 
                    value={targetHealthCardId}
                    onChange={(e) => setTargetHealthCardId(e.target.value)}
                  />
                </div>
              )}

              <div className="chatbot-messages">
                {messages.length === 0 && !isLoading && (
                  <div className="chatbot-welcome">
                    <p>Hello! I'm your AI Health Assistant.</p>
                    <p>Ask me about your medical history, prescriptions, or upcoming appointments.</p>
                  </div>
                )}
                {messages.map((msg, index) => (
                  <div key={index} className={`chatbot-message-wrapper ${msg.sender === 'USER' ? 'user' : 'ai'}`}>
                    <div className="chatbot-message">
                      <div className="chatbot-message-text">
                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                      </div>
                      <div className="chatbot-message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="chatbot-message-wrapper ai">
                    <div className="chatbot-message typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chatbot-input">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} disabled={!inputValue.trim() || isLoading}>
                  <Send size={20} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Chatbot;
