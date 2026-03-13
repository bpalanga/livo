import React from 'react';
import { Listing } from '../types';
import { MapPin, Info, MessageSquare } from 'lucide-react';

interface PropertyCardProps {
  listing: Listing;
  onInquire: (listing: Listing) => void;
  showInquire?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ listing, onInquire, showInquire = true }) => {
  const statusColors = {
    'Available': 'bg-green-100 text-green-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Rented': 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48">
        <img 
          src={listing.imageUrl || `https://picsum.photos/seed/${listing.id}/400/300`} 
          alt={listing.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[listing.status]}`}>
          {listing.status}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 truncate flex-1">{listing.title}</h3>
          <span className="text-indigo-600 font-bold ml-2">${listing.price.toLocaleString()}/mo</span>
        </div>
        
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{listing.location}</span>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {Array.isArray(listing.amenities) && listing.amenities.slice(0, 3).map((amenity, idx) => (
            <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded">
              {amenity}
            </span>
          ))}
          {Array.isArray(listing.amenities) && listing.amenities.length > 3 && (
            <span className="text-gray-400 text-[10px] px-1">+{listing.amenities.length - 3} more</span>
          )}
        </div>
        
        {showInquire && listing.status === 'Available' && (
          <button
            onClick={() => onInquire(listing)}
            className="w-full flex items-center justify-center py-2 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Inquire Now
          </button>
        )}
      </div>
    </div>
  );
};
