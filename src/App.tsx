import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AgentDashboard } from './pages/AgentDashboard';
import { TenantDashboard } from './pages/TenantDashboard';
import { Navbar } from './components/Navbar';
import { NotificationCenter } from './components/NotificationCenter';
import { Notification } from './types';

export default function App() {
  const { profile, loading, login, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [view, setView] = useState<'landing' | 'login'>('landing');

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [profile]);

  const handleMarkAsRead = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!profile) {
    if (view === 'landing') {
      return <LandingPage onGetStarted={() => setView('login')} />;
    }
    return <Login onLogin={login} onBack={() => setView('landing')} />;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderDashboard = () => {
    switch (profile.role) {
      case 'admin':
        return <AdminDashboard profile={profile} />;
      case 'agent':
        return <AgentDashboard profile={profile} />;
      case 'tenant':
        return <TenantDashboard profile={profile} />;
      default:
        return <TenantDashboard profile={profile} />;
    }
  };

  return (
    <div className="min-h-screen bg-cream pt-16">
      <Navbar 
        profile={profile} 
        onShowNotifications={() => setIsNotificationsOpen(true)} 
        unreadCount={unreadCount}
        onLogout={logout}
      />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderDashboard()}
      </main>

      <NotificationCenter 
        notifications={notifications} 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
}
