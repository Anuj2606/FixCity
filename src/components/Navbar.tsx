import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../lib/utils';
import { 
  Menu, X, Bell, User, Settings, LogOut, PlusCircle, 
  FileText, ShieldAlert, BarChart2, Users, Info, Mail, ShieldCheck, HelpCircle, Map
} from 'lucide-react';
import { FixMyCityLogo } from './FixMyCityLogo';

export const Navbar: React.FC = () => {
  const { 
    currentRoute, 
    navigate, 
    userProfile, 
    logout, 
    unreadNotificationsCount 
  } = useApp();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return currentRoute.path === path;
  };

  const linkClass = (path: string) => {
    return `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path) 
        ? 'bg-blue-50 text-blue-600 font-semibold' 
        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
    }`;
  };

  const mobileLinkClass = (path: string) => {
    return `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
      isActive(path) 
        ? 'bg-blue-50 text-blue-600 font-semibold' 
        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
    }`;
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-xs" id="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => handleLinkClick('home')}
              className="flex items-center space-x-2 hover:opacity-90 cursor-pointer"
              id="nav-logo"
            >
              <FixMyCityLogo size={36} />
            </button>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Public links */}
            {!userProfile && (
              <>
                <button onClick={() => handleLinkClick('home')} className={linkClass('home')} id="nav-home">Home</button>
                <button onClick={() => handleLinkClick('about')} className={linkClass('about')} id="nav-about">About</button>
                <button onClick={() => handleLinkClick('contact')} className={linkClass('contact')} id="nav-contact">Contact</button>
                <button onClick={() => handleLinkClick('privacy')} className={linkClass('privacy')} id="nav-privacy">Privacy</button>
              </>
            )}

            {/* Citizen Links */}
            {userProfile && userProfile.role === 'citizen' && (
              <>
                <button onClick={() => handleLinkClick('dashboard')} className={linkClass('dashboard')} id="nav-cit-dash">Dashboard</button>
                <button onClick={() => handleLinkClick('report-issue')} className={`flex items-center space-x-1 ${linkClass('report-issue')}`} id="nav-cit-report">
                  <PlusCircle size={15} />
                  <span>Report Issue</span>
                </button>
                <button onClick={() => handleLinkClick('my-reports')} className={linkClass('my-reports')} id="nav-cit-reports">My Reports</button>
                <button onClick={() => handleLinkClick('community-map')} className={linkClass('community-map')} id="nav-cit-map">Community Map</button>
                <button onClick={() => handleLinkClick('community-insights')} className={linkClass('community-insights')} id="nav-cit-stats">Community Statistics</button>
                <button onClick={() => handleLinkClick('contact')} className={linkClass('contact')} id="nav-cit-help">Help & Support</button>
              </>
            )}

            {/* Admin Links */}
            {userProfile && userProfile.role === 'admin' && (
              <>
                <button onClick={() => handleLinkClick('issue-management')} className={linkClass('issue-management')} id="nav-adm-mgmt">Issue Management</button>
                <button onClick={() => handleLinkClick('operations-center')} className={linkClass('operations-center')} id="nav-adm-ops">Operations Center</button>
                <button onClick={() => handleLinkClick('analytics')} className={linkClass('analytics')} id="nav-adm-anal">Reports & Insights</button>
                <button onClick={() => handleLinkClick('contact')} className={linkClass('contact')} id="nav-adm-help">Help & Support</button>
              </>
            )}
          </div>

          {/* Right Side Buttons (Auth / Profile / Alert) */}
          <div className="hidden md:flex items-center space-x-4">
            {userProfile ? (
              <div className="flex items-center space-x-3">
                {/* Admin Badge */}
                {userProfile.role === 'admin' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-100 uppercase tracking-wider">
                    Admin Staff
                  </span>
                )}

                {/* Notifications Bell */}
                <button 
                  onClick={() => handleLinkClick('notifications')}
                  className="relative p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  title="Notifications"
                  id="nav-bell"
                >
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full h-4 w-4 transform translate-x-1 -translate-y-1 scale-75">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Profile */}
                <button 
                  onClick={() => handleLinkClick('profile')}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                  id="nav-profile-btn"
                >
                  {userProfile.avatarUrl ? (
                    <img 
                      src={userProfile.avatarUrl} 
                      alt={userProfile.fullName} 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm uppercase">
                      {getInitials(userProfile.fullName)}
                    </div>
                  )}
                  <span>{userProfile.fullName}</span>
                </button>

                {/* Settings */}
                <button 
                  onClick={() => handleLinkClick('settings')}
                  className="p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-50 cursor-pointer"
                  title="Settings"
                  id="nav-settings"
                >
                  <Settings size={18} />
                </button>

                {/* Logout */}
                <button 
                  onClick={logout}
                  className="p-1.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Logout"
                  id="nav-logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => handleLinkClick('login')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  id="nav-login-btn"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            {userProfile && (
              <button 
                onClick={() => handleLinkClick('notifications')}
                className="relative p-1.5 mr-2 rounded-full text-gray-500 hover:text-blue-600"
                id="nav-bell-mobile"
              >
                <Bell size={20} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-red-500 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-50 focus:outline-hidden cursor-pointer"
              id="nav-hamburger"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100" id="mobile-nav-panel">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Public Links */}
            {!userProfile && (
              <>
                <button onClick={() => handleLinkClick('home')} className={mobileLinkClass('home')}>Home</button>
                <button onClick={() => handleLinkClick('about')} className={mobileLinkClass('about')}>About</button>
                <button onClick={() => handleLinkClick('contact')} className={mobileLinkClass('contact')}>Contact</button>
                <button onClick={() => handleLinkClick('privacy')} className={mobileLinkClass('privacy')}>Privacy</button>
                <div className="pt-4 border-t border-gray-100 flex flex-col space-y-2 px-3">
                  <button 
                    onClick={() => handleLinkClick('login')}
                    className="w-full text-center bg-blue-600 text-white font-semibold text-base py-2.5 rounded-xl shadow-xs"
                  >
                    Sign In
                  </button>
                </div>
              </>
            )}

            {/* Citizen Links */}
            {userProfile && userProfile.role === 'citizen' && (
              <>
                <button onClick={() => handleLinkClick('dashboard')} className={mobileLinkClass('dashboard')}>Dashboard</button>
                <button onClick={() => handleLinkClick('report-issue')} className={mobileLinkClass('report-issue')}>Report Issue</button>
                <button onClick={() => handleLinkClick('my-reports')} className={mobileLinkClass('my-reports')}>My Reports</button>
                <button onClick={() => handleLinkClick('community-map')} className={mobileLinkClass('community-map')}>Community Map</button>
                <button onClick={() => handleLinkClick('community-insights')} className={mobileLinkClass('community-insights')}>Community Statistics</button>
                <button onClick={() => handleLinkClick('contact')} className={mobileLinkClass('contact')}>Help & Support</button>
                <button onClick={() => handleLinkClick('profile')} className={mobileLinkClass('profile')}>My Profile</button>
                <button onClick={() => handleLinkClick('settings')} className={mobileLinkClass('settings')}>Settings</button>
                <div className="pt-4 border-t border-gray-100 px-3">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center justify-center space-x-2 text-center text-red-600 hover:bg-red-50 font-medium text-base py-2 rounded-md border border-red-100"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}

            {/* Admin Links */}
            {userProfile && userProfile.role === 'admin' && (
              <>
                <button onClick={() => handleLinkClick('issue-management')} className={mobileLinkClass('issue-management')}>Issue Management</button>
                <button onClick={() => handleLinkClick('operations-center')} className={mobileLinkClass('operations-center')}>Operations Center</button>
                <button onClick={() => handleLinkClick('analytics')} className={mobileLinkClass('analytics')}>Reports & Insights</button>
                <button onClick={() => handleLinkClick('contact')} className={mobileLinkClass('contact')}>Help & Support</button>
                <button onClick={() => handleLinkClick('profile')} className={mobileLinkClass('profile')}>My Profile</button>
                <button onClick={() => handleLinkClick('settings')} className={mobileLinkClass('settings')}>Settings</button>
                <div className="pt-4 border-t border-gray-100 px-3">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center justify-center space-x-2 text-center text-red-600 hover:bg-red-50 font-medium text-base py-2 rounded-md border border-red-100"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
