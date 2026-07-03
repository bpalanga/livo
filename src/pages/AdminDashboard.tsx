import React, { useState, useEffect } from 'react';
import { UserProfile, Listing, UserRole } from '../types';
import { Users, Home, Trash2 } from 'lucide-react';

interface AdminDashboardProps {
  profile: UserProfile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ profile }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'listings'>('users');

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      setUsers(usersData);

      const listingsRes = await fetch('/api/listings');
      const listingsData = await listingsRes.json();
      setListings(listingsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateRole = async (id: number, newRole: UserRole) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!window.confirm('Flag and remove this listing?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'listings' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Home className="w-4 h-4 mr-2" />
            Listings
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                        {u.displayName[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{u.displayName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      u.role === 'agent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                      className="text-xs border border-gray-200 rounded p-1 outline-none focus:ring-1 focus:ring-brand-500"
                      disabled={u.id === profile.id}
                    >
                      <option value="tenant">Tenant</option>
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listings.map((l) => (
                <tr key={l.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{l.title}</div>
                    <div className="text-xs text-gray-500">{l.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{l.agentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {l.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteListing(l.id)}
                      className="text-red-600 hover:text-red-900 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No listings to moderate.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
