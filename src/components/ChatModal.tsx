import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { Message, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ChatModalProps {
  inquiryId: number;
  receiverId: number;
  onClose: () => void;
  currentUser: UserProfile;
}

export const ChatModal: React.FC<ChatModalProps> = ({ inquiryId, receiverId, onClose, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/messages/${inquiryId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [inquiryId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const token = localStorage.getItem('token');
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inquiryId,
          receiverId,
          content: newMessage
        })
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-md h-[600px] flex flex-col shadow-2xl"
      >
        <div className="p-4 border-bottom flex justify-between items-center bg-brand-600 text-white rounded-t-2xl">
          <h3 className="font-bold">Chat</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.senderId === currentUser.id 
                    ? 'bg-brand-600 text-white rounded-tr-none' 
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
              <span className="text-[10px] text-gray-400 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button 
            type="submit"
            className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
