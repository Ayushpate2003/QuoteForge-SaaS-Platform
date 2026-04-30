'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Mail, User as UserIcon, Shield, Clock, MoreVertical, Trash2, X, Building } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showFirmModal, setShowFirmModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '' });
  const [inviting, setInviting] = useState(false);
  const [updatingFirms, setUpdatingFirms] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchFirms();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFirms = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/firms`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch firms');
      const data = await response.json();
      setFirms(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to invite user');

      setShowInviteModal(false);
      setInviteForm({ email: '', name: '' });
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleAssignFirms = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingFirms(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/${selectedUser.id}/firms`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ firmIds: selectedUser.assignedFirmIds }),
      });

      if (!response.ok) throw new Error('Failed to update assignments');

      setShowFirmModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingFirms(false);
    }
  };

  const toggleFirmAssignment = (firmId: string) => {
    const current = selectedUser.assignedFirmIds || [];
    const updated = current.includes(firmId)
      ? current.filter((id: string) => id !== firmId)
      : [...current, firmId];
    setSelectedUser({ ...selectedUser, assignedFirmIds: updated });
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-1">Manage your team and their access levels</p>
        </div>
        <Button 
          onClick={() => setShowInviteModal(true)}
          className="gap-2 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> Invite User
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Joined</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <UserIcon className="w-8 h-8 text-slate-300" />
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                          {user.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{user.full_name}</span>
                          <span className="text-xs text-slate-500">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        user.role === 'admin' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                          : 'bg-slate-50 text-slate-700 border-slate-100'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {format(new Date(user.created_at), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setSelectedUser({
                              ...user,
                              assignedFirmIds: user.user_firms?.map((f: any) => f.firm_id) || []
                            });
                            setShowFirmModal(true);
                          }}
                          title="Assign Firms"
                          className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                        >
                          <Building className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-rose-600 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="group-hover:hidden text-slate-300">
                        <MoreVertical className="w-4 h-4 ml-auto" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Invite Team Member</h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    required
                    placeholder="John Doe"
                    className="pl-10"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    required
                    type="email"
                    placeholder="john@example.com"
                    className="pl-10"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold shadow-lg shadow-indigo-100"
                  disabled={inviting}
                >
                  {inviting ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Firm Assignment Modal */}
      {showFirmModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Assign Firms</h3>
                <p className="text-sm text-slate-500">Access control for {selectedUser.full_name}</p>
              </div>
              <button 
                onClick={() => setShowFirmModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAssignFirms} className="p-6 space-y-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto p-1">
                {firms.map((firm: any) => (
                  <label key={firm.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      checked={selectedUser.assignedFirmIds?.includes(firm.id)}
                      onChange={() => toggleFirmAssignment(firm.id)}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{firm.name}</span>
                      <span className="text-xs text-slate-500">{firm.gstin}</span>
                    </div>
                  </label>
                ))}
                {firms.length === 0 && (
                  <p className="text-center py-8 text-slate-500 text-sm italic">No firms found in this tenant.</p>
                )}
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold shadow-lg shadow-indigo-100"
                  disabled={updatingFirms}
                >
                  {updatingFirms ? 'Saving Changes...' : 'Save Assignments'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
