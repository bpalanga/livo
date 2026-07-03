import React, { useState, useEffect } from 'react';
import { Listing, UserProfile, Inquiry } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { Search, Send, X, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatModal } from '../components/ChatModal';

interface TenantDashboardProps {
  profile: UserProfile;
}

export const TenantDashboard: React.FC<TenantDashboardProps> = ({ profile }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
  const [chattingWith, setChattingWith] = useState<{ inquiryId: number, agentId: number } | null>(null);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings');
      const data = await res.json();
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const fetchInquiries = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/inquiries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMyInquiries(data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchInquiries();
  }, []);

  const filteredListings = listings.filter(l => 
    (l.title.toLowerCase().includes(search.toLowerCase()) || 
     l.location.toLowerCase().includes(search.toLowerCase())) &&
    l.price <= maxPrice
  );

  const handleSendInquiry = async () => {
    if (!selectedListing || !inquiryMessage.trim()) return;
    
    setSending(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agentId: selectedListing.agentId,
          propertyId: selectedListing.id,
          message: inquiryMessage
        })
      });

      if (!res.ok) throw new Error('Failed to send inquiry');

      setSelectedListing(null);
      setInquiryMessage('');
      fetchInquiries();
      alert('Inquiry sent successfully!');
    } catch (error) {
      console.error('Error sending inquiry:', error);
      alert('Failed to send inquiry.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-600 p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by title or location..."
            className="w-full pl-10 pr-4 py-2 border border-brand-600 rounded-xl focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Max Price: ${maxPrice}</label>
            <input 
              type="range" 
              min="0" 
              max="10000" 
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((listing) => (
          <PropertyCard 
            key={listing.id} 
            listing={listing} 
            onInquire={setSelectedListing}
          />
        ))}
        {filteredListings.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No properties found matching your search.
          </div>
        )}
      </div>

      <div className="pt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Inquiries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myInquiries.length === 0 ? (
            <p className="text-gray-500 italic">You haven't made any inquiries yet.</p>
          ) : (
            myInquiries.map(inquiry => (
              <div key={inquiry.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">{inquiry.propertyTitle || 'Property Inquiry'}</h4>
                  <div className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-full ${
                    inquiry.status === 'Approved' ? 'bg-green-100 text-green-700' :
                    inquiry.status === 'Declined' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inquiry.status === 'Approved' ? <CheckCircle className="w-3 h-3 mr-1" /> : 
                     inquiry.status === 'Declined' ? <XCircle className="w-3 h-3 mr-1" /> : 
                     <Clock className="w-3 h-3 mr-1" />}
                    {inquiry.status}
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic mb-4 line-clamp-2">"{inquiry.message}"</p>
                <div className="mt-auto flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">{new Date(inquiry.timestamp).toLocaleDateString()}</span>
                  <button 
                    onClick={() => setChattingWith({ inquiryId: inquiry.id, agentId: inquiry.agentId })}
                    className="flex items-center text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Chat with Agent
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50" 
              onClick={() => setSelectedListing(null)} 
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">Inquire about {selectedListing.title}</h3>
                <button onClick={() => setSelectedListing(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                <textarea
                  rows={4}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-600 outline-none resize-none"
                  placeholder="I'm interested in this property. Can we schedule a viewing?"
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                />
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedListing(null)}
                    className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInquiry}
                    disabled={sending || !inquiryMessage.trim()}
                    className="flex-1 py-2.5 px-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-medium flex items-center justify-center disabled:opacity-50"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Inquiry
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {chattingWith && (
        <ChatModal
          inquiryId={chattingWith.inquiryId}
          receiverId={chattingWith.agentId}
          onClose={() => setChattingWith(null)}
          currentUser={profile}
        />
      )}
    </div>
  );
};
