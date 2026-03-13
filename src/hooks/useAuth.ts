import { useState, useEffect } from 'react';
import { UserProfile } from '../types';

export function useAuth() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then(user => {
        setProfile(user);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setProfile(null);
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string, user: UserProfile) => {
    localStorage.setItem('token', token);
    setProfile(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setProfile(null);
  };

  return { profile, loading, login, logout };
}
