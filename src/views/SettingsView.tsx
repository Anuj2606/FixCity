import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell } from 'lucide-react';
import { translations } from '../lib/translations';

export const SettingsView: React.FC = () => {
  const { userProfile, updateUserProfile, language } = useApp();

  const [notifEnabled, setNotifEnabled] = useState(userProfile?.notificationsEnabled ?? true);

  const handleToggleNotifs = async () => {
    const val = !notifEnabled;
    setNotifEnabled(val);
    try {
      await updateUserProfile({ notificationsEnabled: val });
    } catch (e) {
      console.error(e);
    }
  };

  const t = translations[language];

  return (
    <div className="bg-gray-50 min-h-screen py-8" id="settings-view">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight">
            {t.settingsTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t.settingsSub}
          </p>
        </div>

        {/* Settings blocks */}
        <div className="space-y-6">
          
          {/* Block 1: Alerts */}
          <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6">
            <h3 className="text-sm font-bold text-gray-900 font-display flex items-center space-x-2 border-b border-gray-100 pb-3 mb-4">
              <Bell size={16} className="text-blue-600" />
              <span>{t.alertTitle}</span>
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-bold text-gray-800">{t.alertHeading}</span>
                <span className="block text-xs text-gray-500 mt-0.5 leading-normal max-w-sm">
                  {t.alertSub}
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleToggleNotifs}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  notifEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    notifEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

