import React, { useState, useEffect } from 'react';
import { Listing, UserProfile, Inquiry } from '../types';
import { PropertyCard } from '../components/PropertyCard';
import { Plus, Edit2, Trash2, MessageSquare, X, Save, Check, XCircle, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatModal } from '../components/ChatModal';

interface AgentDashboardProps {
  profile: UserProfile;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ profile }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [viewingInquiries, setViewingInquiries] = useState<number | null>(null);
  const [chattingWith, setChattingWith] = useState<{ inquiryId: number, tenantId: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/listings');
      const data = await res.json();
      setListings(data.filter((l: Listing) => l.agentId === profile.id));
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
      setInquiries(data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchInquiries();
  }, [profile.id]);

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    const token = localStorage.getItem('token');
    try {
      const isEdit = !!editingListing.id;
      const endpoint = isEdit ? `/api/listings/${editingListing.id}` : '/api/listings';
      const method = isEdit ? 'PUT' : 'POST';

      // Ensure amenities is an array
      const payload = {
        ...editingListing,
        amenities: typeof editingListing.amenities === 'string' 
          ? editingListing.amenities.split(',').map(s => s.trim()).filter(Boolean)
          : editingListing.amenities
      };

      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save listing');

      setIsModalOpen(false);
      setEditingListing(null);
      fetchListings();
    } catch (error) {
      console.error('Error saving listing:', error);
      alert('Failed to save listing');
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // no Content-Type: the browser sets the multipart boundary itself
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setEditingListing((prev: any) => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  const toggleStatus = async (listing: Listing) => {
    const statuses: Listing['status'][] = ['Available', 'Pending', 'Rented'];
    const currentIndex = statuses.indexOf(listing.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...listing, status: nextStatus })
      });
      fetchListings();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleInquiryStatus = async (id: number, status: 'Approved' | 'Declined') => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/inquiries/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      fetchInquiries();
    } catch (error) {
      console.error('Error updating inquiry status:', error);
    }
  };

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) || 
    l.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your properties and respond to tenant inquiries.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search my listings..."
              className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setEditingListing({ title: '', price: 0, location: '', amenities: [], status: 'Available' });
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Listing
          </button>
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <Home className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {listings.length === 0 ? "You haven't listed any properties yet" : "No listings match your search"}
          </p>
          {listings.length === 0 && (
            <p className="text-sm text-gray-400 mt-1">Click "Add Listing" above to create your first one.</p>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((listing) => (
          <div key={listing.id} className="relative group">
            <PropertyCard listing={listing} onInquire={() => {}} showInquire={false} />
            <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setEditingListing(listing);
                  setIsModalOpen(true);
                }}
                className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-brand-600 hover:bg-white"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteListing(listing.id)}
                className="p-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-red-600 hover:bg-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => toggleStatus(listing)}
                className="flex-1 py-1.5 px-3 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200"
              >
                Toggle Status
              </button>
              <button
                onClick={() => setViewingInquiries(listing.id)}
                className="flex-1 py-1.5 px-3 bg-brand-50 text-brand-700 rounded-lg text-xs font-medium hover:bg-brand-100 flex items-center justify-center"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Inquiries ({inquiries.filter(i => i.propertyId === listing.id).length})
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editingListing?.id ? 'Edit Listing' : 'New Listing'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSaveListing} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={editingListing?.title || ''} onChange={e => setEditingListing({...editingListing!, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($/mo)</label>
                    <input required type="number" className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={editingListing?.price || 0} onChange={e => setEditingListing({...editingListing!, price: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={editingListing?.status || 'Available'} onChange={e => setEditingListing({...editingListing!, status: e.target.value as any})}>
                      <option value="Available">Available</option>
                      <option value="Pending">Pending</option>
                      <option value="Rented">Rented</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input required type="text" className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={editingListing?.location || ''} onChange={e => setEditingListing({...editingListing!, location: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma separated)</label>
                  <input type="text" className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={Array.isArray(editingListing?.amenities) ? editingListing?.amenities.join(', ') : editingListing?.amenities || ''} onChange={e => setEditingListing({...editingListing!, amenities: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Photo</label>

                  {editingListing?.imageUrl && (
                    <img
                      src={editingListing.imageUrl}
                      alt="Listing preview"
                      className="w-full h-40 object-cover rounded-lg mb-2 border border-gray-200"
                    />
                  )}

                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:font-medium hover:file:bg-brand-100 disabled:opacity-50"
                  />

                  {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                  {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}

                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Or paste an image URL instead</summary>
                    <input
                      type="text"
                      placeholder="https://example.com/photo.jpg"
                      className="w-full mt-2 p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                      value={editingListing?.imageUrl || ''}
                      onChange={e => setEditingListing({...editingListing!, imageUrl: e.target.value})}
                    />
                  </details>
                </div>
                <button type="submit" className="w-full py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold flex items-center justify-center">
                  <Save className="w-5 h-5 mr-2" />
                  Save Listing
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {viewingInquiries && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50" onClick={() => setViewingInquiries(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold">Inquiries for {listings.find(l => l.id === viewingInquiries)?.title}</h2>
                <button onClick={() => setViewingInquiries(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {inquiries.filter(i => i.propertyId === viewingInquiries).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No inquiries yet.</p>
                ) : (
                  inquiries.filter(i => i.propertyId === viewingInquiries).map(inquiry => (
                    <div key={inquiry.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Tenant: {inquiry.tenantName || `ID ${inquiry.tenantId}`}</span>
                          <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full w-fit ${
                            inquiry.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            inquiry.status === 'Declined' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {inquiry.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(inquiry.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700 text-sm italic mb-4">"{inquiry.message}"</p>
                      
                      <div className="flex gap-2">
                        {inquiry.status === 'Pending' && (
                          <>
                            <button 
                              onClick={() => handleInquiryStatus(inquiry.id, 'Approved')}
                              className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center justify-center hover:bg-green-700"
                            >
                              <Check className="w-3 h-3 mr-1" /> Approve
                            </button>
                            <button 
                              onClick={() => handleInquiryStatus(inquiry.id, 'Declined')}
                              className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center justify-center hover:bg-red-700"
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Decline
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => setChattingWith({ inquiryId: inquiry.id, tenantId: inquiry.tenantId })}
                          className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold flex items-center justify-center hover:bg-brand-700"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" /> Chat
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {chattingWith && (
        <ChatModal
          inquiryId={chattingWith.inquiryId}
          receiverId={chattingWith.tenantId}
          onClose={() => setChattingWith(null)}
          currentUser={profile}
        />
      )}
    </div>
  );
};
