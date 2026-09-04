import React from 'react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../lib/utils';
import { Users, Mail, Phone, Calendar, ShieldCheck, UserCircle2 } from 'lucide-react';

export const UsersView: React.FC = () => {
  const { demoUsers } = useApp();

  return (
    <div className="bg-gray-50 min-h-screen py-8 font-sans" id="users-view">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 max-w-max mb-2">
            <Users size={12} />
            <span>Civic Account Directory</span>
          </div>
          <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight">
            User Accounts Directory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review registered citizen profiles, municipal administrative roles, and system creation timestamps.
          </p>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150 text-left text-xs text-gray-500">
              <thead className="bg-gray-50 text-[10px] font-mono text-gray-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4 font-mono">Email Address</th>
                  <th className="px-6 py-4">Phone Contact</th>
                  <th className="px-6 py-4">Platform Role</th>
                  <th className="px-6 py-4">Created Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white font-sans text-xs text-gray-750">
                {demoUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                    
                    {/* User profile with initial avatar */}
                    <td className="px-6 py-4 font-bold text-gray-900 flex items-center space-x-3">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.fullName} 
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-750 font-bold text-xs uppercase border border-blue-200">
                          {getInitials(user.fullName)}
                        </div>
                      )}
                      <span>{user.fullName}</span>
                    </td>

                    <td className="px-6 py-4 font-mono text-gray-500">{user.email}</td>
                    
                    <td className="px-6 py-4 text-gray-550 font-mono">
                      {user.phone || '--'}
                    </td>

                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                          <ShieldCheck size={11} className="mr-1 shrink-0" />
                          Admin Staff
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                          <UserCircle2 size={11} className="mr-1 shrink-0" />
                          Citizen
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()} {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
