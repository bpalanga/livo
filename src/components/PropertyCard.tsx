import React from 'react';
import { Listing } from '../types';
import { MapPin, MessageSquare } from 'lucide-react';

interface PropertyCardProps {
  listing: Listing;
  onInquire: (listing: Listing) => void;
  showInquire?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ listing, onInquire, showInquire = true }) => {
  const statusStyles: Record<string, string> = {
    'Available': 'bg-green-50 text-green-700 ring-1 ring-green-600/20',
    'Pending': 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    'Rented': 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      <div className="relative h-52 overflow-hidden bg-gray-100">
        <img
          src={listing.imageUrl || `https://picsum.photos/seed/${listing.id}/400/300`}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${statusStyles[listing.status] || 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20'}`}>
          {listing.status}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-base font-semibold text-gray-900 truncate">{listing.title}</h3>
          <span className="text-brand-700 font-bold whitespace-nowrap">ksh{listing.price.toLocaleString()}<span className="text-xs font-medium text-gray-400">/mo</span></span>
        </div>

        <div className="flex items-center text-gray-500 text-sm mt-1.5">
          <MapPin className="w-4 h-4 mr-1 shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>

        {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {listing.amenities.slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="bg-brand-50 text-brand-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
                {amenity}
              </span>
            ))}
            {listing.amenities.length > 3 && (
              <span className="text-gray-400 text-[11px] px-1 py-1">+{listing.amenities.length - 3} more</span>
            )}
          </div>
        )}

        <div className="flex-1" />

        {showInquire && listing.status === 'Available' && (
          <button
            onClick={() => onInquire(listing)}
            className="mt-4 w-full flex items-center justify-center py-2.5 px-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 active:scale-[0.98] transition-all text-sm font-medium shadow-sm"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Inquire Now
          </button>
        )}
      </div>
    </div>
  );
};
