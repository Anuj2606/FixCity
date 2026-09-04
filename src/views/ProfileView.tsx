import React from 'react';
import { useApp } from '../context/AppContext';
import { Mail, ShieldCheck, User } from 'lucide-react';
import { getInitials } from '../lib/utils';

export const ProfileView: React.FC = () => {
  const { userProfile } = useApp();

  const roleLabel = userProfile?.role === 'admin' ? 'Administrator' : 'Citizen';
  const roleColorClass = userProfile?.role === 'admin' 
    ? 'bg-blue-100 text-blue-800 border-blue-250' 
    : 'bg-emerald-100 text-emerald-800 border-emerald-250';

  const avatar = userProfile?.avatarUrl || userProfile?.avatar;

  return (
    <div className="bg-gray-50 min-h-screen py-12" id="profile-view">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight">
            My Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your official municipal identity card details.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Accent Header Banner */}
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600" />

          <div className="px-6 pb-8 text-center relative -mt-12">
            
            {/* Avatar image / fallback */}
            <div className="inline-block relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={userProfile?.fullName || 'User Avatar'}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-full border-4 border-white object-cover bg-white shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-sm uppercase font-display">
                  {getInitials(userProfile?.fullName || userProfile?.name || 'User')}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <h2 className="mt-4 text-2xl font-display font-black text-gray-900 tracking-tight">
              {userProfile?.fullName || userProfile?.name || 'N/A'}
            </h2>

            {/* Role Badge */}
            <div className="mt-2.5">
              <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${roleColorClass}`}>
                {userProfile?.role === 'admin' && <ShieldCheck size={12} className="mr-1.5 shrink-0" />}
                {roleLabel}
              </span>
            </div>

            {/* Details list */}
            <div className="mt-8 border-t border-gray-100 pt-6 space-y-4 text-left">
              
              {/* Email */}
              <div className="flex items-start space-x-3 text-sm">
                <div className="text-gray-400 mt-0.5 shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Email Address
                  </span>
                  <span className="block font-medium text-gray-800 mt-0.5">
                    {userProfile?.email || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Unique ID */}
              <div className="flex items-start space-x-3 text-sm border-t border-gray-55/65 pt-4">
                <div className="text-gray-400 mt-0.5 shrink-0">
                  <User size={16} />
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Municipal ID
                  </span>
                  <span className="block font-mono text-xs text-gray-500 mt-0.5 break-all">
                    {userProfile?.uid || 'N/A'}
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
