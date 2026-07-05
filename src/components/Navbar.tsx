import React from 'react';
import { UserProfile } from '../types';
import { Home, Bell, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  profile: UserProfile | null;
  onShowNotifications: () => void;
  unreadCount: number;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ profile, onShowNotifications, unreadCount, onLogout }) => {
  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm px-4 py-2.5 fixed w-full z-50 top-0 left-0">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <div className="bg-brand-600 p-1.5 rounded-lg mr-2">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="self-center text-xl font-semibold whitespace-nowrap text-gray-900">Livo</span>
        </div>
        
        <div className="flex items-center lg:order-2">
          {profile && (
            <>
              <button
                onClick={onShowNotifications}
                className="relative p-2 mr-1 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <div className="flex items-center ml-3">
                <div className="flex items-center mr-4">
                  <div className="flex flex-col items-end mr-2">
                    <span className="text-sm font-medium text-gray-900">{profile.displayName}</span>
                    <span className="text-xs text-gray-500 capitalize">{profile.role}</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm ring-2 ring-brand-50">
                    {profile.displayName?.[0]?.toUpperCase() || <UserIcon className="w-5 h-5" />}
                  </div>
                </div>
                
                <button
                  onClick={onLogout}
                  className="text-white bg-brand-600 hover:bg-brand-700 focus:ring-4 focus:ring-brand-100 font-medium rounded-lg text-sm px-4 py-2 lg:px-5 lg:py-2.5 mr-2 focus:outline-none flex items-center transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
