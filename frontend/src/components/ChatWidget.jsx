import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import axios from 'axios';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi there! 👋 I am your Resume AI Assistant. Ask me anything about how this application works, how to optimize your resume in the Sandbox, or general ATS optimization tips!'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Suggestions list
  const suggestions = [
    'How does ATS scoring work?',
    'What features are in the Optimizer Sandbox?',
    'What is the tech stack of this app?',
    'Give me a professional resume tip.'
  ];

  // Send message
  const handleSend = async (textToSend) => {
    const text = textToSend || message;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: text,
        history: messages.slice(1) // exclude welcome message
      });

      // Add bot response
      const botMsg = { sender: 'bot', text: response.data.text };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = { sender: 'bot', text: 'Sorry, I am having trouble connecting to the system core. Please check your connection.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, fontFamily: 'var(--font-secondary)' }}>
      
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div 
          className="card animate-fade-in"
          style={{
            width: '360px',
            height: '480px',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            background: 'var(--card-bg)'
          }}
        >
          {/* Header */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '0.85rem 1.25rem', 
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Resume AI Assistant <Sparkles size={12} className="text-primary" />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Online & Ready</div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start'
                }}
              >
                {/* Avatar */}
                <div 
                  style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: msg.sender === 'user' ? 'var(--primary-light)' : 'var(--border-color)',
                    color: msg.sender === 'user' ? 'var(--primary-color)' : 'var(--text-color)',
                    flexShrink: 0
                  }}
                >
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Bubble */}
                <div 
                  style={{ 
                    maxWidth: '75%', 
                    padding: '0.65rem 0.85rem', 
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    background: msg.sender === 'user' ? 'var(--primary-color)' : 'var(--border-color)',
                    color: msg.sender === 'user' ? '#ffffff' : 'var(--text-color)',
                    borderTopRightRadius: msg.sender === 'user' ? '2px' : '12px',
                    borderTopLeftRadius: msg.sender === 'bot' ? '2px' : '12px',
                    whiteSpace: 'pre-wrap',
                    textAlign: 'left'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing Loader */}
            {isLoading && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border-color)', color: 'var(--text-color)' }}>
                  <Bot size={14} />
                </div>
                <div style={{ background: 'var(--border-color)', padding: '0.65rem 1rem', borderRadius: '12px', borderTopLeftRadius: '2px' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', height: '14px' }}>
                    <div className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'bounce 1.4s infinite ease-in-out' }}></div>
                    <div className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }}></div>
                    <div className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestion Chips */}
            {messages.length === 1 && !isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left', fontWeight: 500 }}>Common Questions:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                  {suggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSend(sug)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem',
                        color: 'var(--primary-color)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'var(--transition)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary-light)';
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '0.75rem 1rem', 
              borderTop: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.02)'
            }}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                color: 'var(--text-color)',
                outline: 'none',
                padding: '0.25rem 0'
              }}
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              style={{
                background: 'transparent',
                border: 'none',
                color: message.trim() ? 'var(--primary-color)' : 'var(--text-muted)',
                cursor: message.trim() ? 'pointer' : 'default',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={16} />
            </button>
          </form>

        </div>
      )}

      {/* Dot bouncing styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}} />

    </div>
  );
};

export default ChatWidget;
