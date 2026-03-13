import React from 'react';
import { Notification } from '../types';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  notifications: Notification[];
  onClose: () => void;
  isOpen: boolean;
  onMarkAsRead: (id: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose, isOpen, onMarkAsRead }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-[60]" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-[70] overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-800">{notification.message}</p>
                      {!notification.is_read && (
                        <button
                          onClick={() => onMarkAsRead(notification.id)}
                          className="p-1 text-indigo-600 hover:bg-indigo-100 rounded"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
