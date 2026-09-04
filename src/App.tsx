import React from 'react';
import { useApp } from './context/AppContext';
import { getInitials } from './lib/utils';
import { translations } from './lib/translations';
import { 
  ShieldCheck, LogOut, User, Bell, LayoutDashboard, PlusCircle, 
  FileText, Settings, BarChart2, Users, Menu, X, Sparkles, Building2, HelpCircle, ShieldAlert, Compass, Search, Clock, ArrowRight, CornerDownLeft, Eye, CheckCircle2, MessageSquare, History, MapPin, ChevronDown
} from 'lucide-react';

// Import Views
import { HomeView } from './views/HomeView';
import { AboutView } from './views/AboutView';
import { ContactView } from './views/ContactView';
import { PrivacyView } from './views/PrivacyView';
import { LoginView } from './views/LoginView';
import { FixMyCityLogo } from './components/FixMyCityLogo';
import { CitizenDashboardView } from './views/CitizenDashboardView';
import { ReportNewIssueView } from './views/ReportNewIssueView';
import { MyReportsView } from './views/MyReportsView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';
import { ReportDetailsView } from './views/ReportDetailsView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { IssueManagementView } from './views/IssueManagementView';
import { AnalyticsView } from './views/AnalyticsView';
import { UsersView } from './views/UsersView';
import { CommunityMapView } from './views/CommunityMapView';
import { CommunityInsightsView } from './views/CommunityInsightsView';
import { OperationsCenterView } from './views/OperationsCenterView';

// Import Custom Global Components
import { CommandPalette } from './components/CommandPalette';
import { QuickActionModal } from './components/QuickActionModal';

export default function App() {
  const { 
    currentUser, 
    userProfile, 
    currentRoute, 
    notifications, 
    logout, 
    navigate,
    issues,
    language
  } = useApp();

  const t = translations[language];

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);

  // Header Search Bar States
  const [headerSearchQuery, setHeaderSearchQuery] = React.useState('');
  const [headerSearchFocused, setHeaderSearchFocused] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = React.useState<string[]>([]);
  
  const [selectedSearchIssue, setSelectedSearchIssue] = React.useState<any | null>(null);
  const [isSearchQuickActionOpen, setIsSearchQuickActionOpen] = React.useState(false);
  const [searchQuickActionTab, setSearchQuickActionTab] = React.useState<'assign' | 'status' | 'timeline' | 'map' | 'comment'>('timeline');

  React.useEffect(() => {
    const searches = localStorage.getItem('fixmycity_recent_searches');
    const viewed = localStorage.getItem('fixmycity_recently_viewed_ids');
    if (searches) setRecentSearches(JSON.parse(searches));
    if (viewed) setRecentlyViewed(JSON.parse(viewed));
  }, []);

  // Sync Recently Viewed on details landing
  React.useEffect(() => {
    if (currentRoute.path === 'issue-details' && currentRoute.params?.id) {
      const id = currentRoute.params.id;
      setRecentlyViewed(prev => {
        const updated = [id, ...prev.filter(item => item !== id)].slice(0, 5);
        localStorage.setItem('fixmycity_recently_viewed_ids', JSON.stringify(updated));
        return updated;
      });
    }
  }, [currentRoute.path, currentRoute.params?.id]);

  // Match search results
  const searchIssues = issues.filter(i => !i.isDemoSeed && !i.id.startsWith('issue-seed-'));
  const searchResults = searchIssues.filter(issue => {
    if (!headerSearchQuery.trim()) return false;
    const query = headerSearchQuery.toLowerCase();
    
    const matchesTitle = issue.title.toLowerCase().includes(query);
    const matchesDesc = issue.description.toLowerCase().includes(query);
    const matchesLoc = issue.location.toLowerCase().includes(query);
    const matchesCategory = issue.category.toLowerCase().includes(query);
    const matchesDept = issue.assignedDepartment?.toLowerCase().includes(query);
    const matchesOfficer = issue.assignedOfficer?.toLowerCase().includes(query);
    const matchesStatus = issue.status.toLowerCase().includes(query);
    
    const matchesReporter = userProfile?.role === 'admin' && issue.userName.toLowerCase().includes(query);

    return matchesTitle || matchesDesc || matchesLoc || matchesCategory || matchesDept || matchesOfficer || matchesStatus || matchesReporter;
  });

  // Authentication & Role Route Guarding
  React.useEffect(() => {
    const publicRoutes = ['home', 'about', 'contact', 'privacy', 'login'];
    const adminOnlyRoutes = ['admin-dashboard', 'issue-management', 'analytics', 'users'];
    const citizenOnlyRoutes = ['dashboard', 'report-issue', 'my-reports'];

    // If not logged in and trying to access a secure route, redirect to login
    if (!currentUser && !publicRoutes.includes(currentRoute.path)) {
      navigate('login');
      return;
    }

    // If logged in and on public landing, redirect to appropriate dashboard
    if (currentUser && (currentRoute.path === 'home' || currentRoute.path === 'login' || currentRoute.path === 'register')) {
      if (userProfile?.role === 'admin') {
        navigate('issue-management');
      } else {
        navigate('dashboard');
      }
      return;
    }

    // Role-based security checks
    if (currentUser && userProfile) {
      if (userProfile.role === 'citizen' && adminOnlyRoutes.includes(currentRoute.path)) {
        navigate('dashboard');
      } else if (userProfile.role === 'admin' && citizenOnlyRoutes.includes(currentRoute.path)) {
        navigate('issue-management');
      }
    }
  }, [currentUser, userProfile, currentRoute.path]);

  // Unread notification count
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('home');
    } catch (e) {
      console.error(e);
    }
  };

  // Switch View Router
  const renderActiveView = () => {
    switch (currentRoute.path) {
      case 'home':
        return <HomeView />;
      case 'about':
        return <AboutView />;
      case 'contact':
        return <ContactView />;
      case 'privacy':
        return <PrivacyView />;
      case 'login':
        return <LoginView />;
      case 'register':
        return <LoginView />;
      case 'dashboard':
        return <CitizenDashboardView />;
      case 'report-issue':
        return <ReportNewIssueView />;
      case 'my-reports':
        return <MyReportsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'profile':
        return <ProfileView />;
      case 'settings':
        return <SettingsView />;
      case 'issue-details':
        return <ReportDetailsView />;
      case 'operations-center':
        return <OperationsCenterView />;
      case 'community-map':
        return <CommunityMapView />;
      case 'admin-dashboard':
        return <AdminDashboardView />;
      case 'issue-management':
        return <IssueManagementView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'users':
        return <UsersView />;
      case 'community-insights':
        return <CommunityInsightsView />;
      default:
        return <HomeView />;
    }
  };

  const getBreadcrumbs = () => {
    const role = userProfile?.role;
    const isReadyAdmin = role === 'admin';
    const homeDashboard = isReadyAdmin ? 'admin-dashboard' : 'dashboard';
    
    const crumbs = [
      { label: 'Home', path: currentUser ? homeDashboard : 'home' }
    ];

    switch (currentRoute.path) {
      case 'dashboard':
        crumbs.push({ label: 'Dashboard', path: '' });
        break;
      case 'admin-dashboard':
        crumbs.push({ label: 'Dashboard', path: '' });
        break;
      case 'report-issue':
        crumbs.push({ label: 'Dashboard', path: homeDashboard });
        crumbs.push({ label: 'New Report', path: '' });
        break;
      case 'my-reports':
        crumbs.push({ label: 'Dashboard', path: homeDashboard });
        crumbs.push({ label: 'My Reports', path: '' });
        break;
      case 'issue-management':
        crumbs.push({ label: 'Dashboard', path: homeDashboard });
        crumbs.push({ label: 'Inquiries & Dispatch', path: '' });
        break;
      case 'operations-center':
        crumbs.push({ label: 'Dashboard', path: homeDashboard });
        crumbs.push({ label: 'Ops Center', path: '' });
        break;
      case 'community-map':
        crumbs.push({ label: 'Dashboard', path: homeDashboard });
        crumbs.push({ label: 'Community Map', path: '' });
        break;
      case 'analytics':
        crumbs.push({ label: 'Dashboard', path: homeDashboard });
        crumbs.push({ label: 'Reports & Insights', path: '' });
        break;
      case 'users':
        crumbs.push({ label: 'Dashboard', path: homeDashboard });
        crumbs.push({ label: 'User Directory', path: '' });
        break;
      case 'profile':
        crumbs.push({ label: 'Dashboard', path: homeDashboard });
        crumbs.push({ label: 'Profile', path: '' });
        break;
      case 'settings':
        crumbs.push({ label: 'Dashboard', path: homeDashboard });
        crumbs.push({ label: 'Account Settings', path: '' });
        break;
      case 'notifications':
        crumbs.push({ label: 'Dashboard', path: homeDashboard });
        crumbs.push({ label: 'Notifications', path: '' });
        break;
      case 'issue-details':
        crumbs.push({ label: 'Dashboard', path: homeDashboard });
        if (isReadyAdmin) {
          crumbs.push({ label: 'Inquiries', path: 'issue-management' });
        } else {
          crumbs.push({ label: 'My Reports', path: 'my-reports' });
        }
        crumbs.push({ label: 'Ticket Details', path: '' });
        break;
      default:
        crumbs.push({ label: currentRoute.path.replace('-', ' '), path: '' });
        break;
    }

    return crumbs;
  };

  // Navigation Links based on authentication and roles
  const renderNavLinks = () => {
    // 1. Guest Links
    if (!currentUser) {
      return (
        <>
          <button onClick={() => { navigate('home'); setMobileMenuOpen(false); }} className={`nav-link text-xs font-bold font-sans uppercase tracking-wider cursor-pointer ${currentRoute.path === 'home' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>{t.home}</button>
          <button onClick={() => { navigate('about'); setMobileMenuOpen(false); }} className={`nav-link text-xs font-bold font-sans uppercase tracking-wider cursor-pointer ${currentRoute.path === 'about' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>{t.aboutMission}</button>
          <button onClick={() => { navigate('contact'); setMobileMenuOpen(false); }} className={`nav-link text-xs font-bold font-sans uppercase tracking-wider cursor-pointer ${currentRoute.path === 'contact' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>{t.contactSupport}</button>
          <button onClick={() => { navigate('privacy'); setMobileMenuOpen(false); }} className={`nav-link text-xs font-bold font-sans uppercase tracking-wider cursor-pointer ${currentRoute.path === 'privacy' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>{t.privacy}</button>
        </>
      );
    }

    // 2. Admin Links
    if (userProfile?.role === 'admin') {
      return (
        <>
          <button onClick={() => { navigate('admin-dashboard'); setMobileMenuOpen(false); }} className={`flex items-center space-x-1 nav-link text-xs font-bold font-sans uppercase tracking-wider cursor-pointer ${currentRoute.path === 'admin-dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>
            <LayoutDashboard size={14} />
            <span>{t.dashboard}</span>
          </button>
          <button onClick={() => { navigate('issue-management'); setMobileMenuOpen(false); }} className={`flex items-center space-x-1 nav-link text-xs font-bold font-sans uppercase tracking-wider cursor-pointer ${currentRoute.path === 'issue-management' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>
            <FileText size={14} />
            <span>{t.issues}</span>
          </button>
          <button onClick={() => { navigate('operations-center'); setMobileMenuOpen(false); }} className={`flex items-center space-x-1 nav-link text-xs font-bold font-sans uppercase tracking-wider cursor-pointer ${currentRoute.path === 'operations-center' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>
            <ShieldCheck size={14} className="text-blue-500" />
            <span>{t.issueManagement}</span>
          </button>
          <button onClick={() => { navigate('analytics'); setMobileMenuOpen(false); }} className={`flex items-center space-x-1 nav-link text-xs font-bold font-sans uppercase tracking-wider cursor-pointer ${currentRoute.path === 'analytics' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>
            <BarChart2 size={14} />
            <span>{t.reportsAndInsights}</span>
          </button>
        </>
      );
    }

    // 3. Citizen Links
    return (
      <>
        <button onClick={() => { navigate('dashboard'); setMobileMenuOpen(false); }} className={`flex items-center space-x-1 nav-link text-xs font-bold font-sans uppercase tracking-wider cursor-pointer ${currentRoute.path === 'dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>
          <LayoutDashboard size={14} />
          <span>{t.dashboard}</span>
        </button>
        <button onClick={() => { navigate('report-issue'); setMobileMenuOpen(false); }} className={`flex items-center space-x-1 nav-link text-xs font-bold font-sans uppercase tracking-wider cursor-pointer ${currentRoute.path === 'report-issue' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>
          <PlusCircle size={14} />
          <span>{t.reportIssue}</span>
        </button>
        <button onClick={() => { navigate('my-reports'); setMobileMenuOpen(false); }} className={`flex items-center space-x-1 nav-link text-xs font-bold font-sans uppercase tracking-wider cursor-pointer ${currentRoute.path === 'my-reports' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>
          <FileText size={14} />
          <span>{t.myReports}</span>
        </button>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans select-none selection:bg-blue-500 selection:text-white" id="root-app-container">
      
      {/* Navigation Header Bar */}
      <nav className="bg-white border-b border-gray-150 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Left: Brand Identity & Search Bar */}
            <div className="flex items-center space-x-5 flex-1 max-w-xl">
              <div 
                onClick={() => navigate(currentUser ? (userProfile?.role === 'admin' ? 'admin-dashboard' : 'dashboard') : 'home')}
                className="flex items-center space-x-2.5 cursor-pointer shrink-0"
                id="header-brand-logo"
              >
                <FixMyCityLogo size={36} />
              </div>

              {/* Persistent Header Search Input */}
              {currentUser && (
                <div className="relative flex-1 hidden md:block animate-fade-in" id="header-global-search">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      value={headerSearchQuery}
                      onChange={(e) => setHeaderSearchQuery(e.target.value)}
                      onFocus={() => setHeaderSearchFocused(true)}
                      onBlur={() => setTimeout(() => setHeaderSearchFocused(false), 200)}
                      placeholder={t.searchPlaceholder}
                      className="w-full pl-9 pr-4 py-1.5 border border-gray-250 rounded-xl text-xs bg-gray-55/65 hover:bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-550 transition-all font-sans text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Smart Search suggestions & results dropdown */}
                  {headerSearchFocused && (
                    <div 
                      onMouseDown={(e) => e.preventDefault()} // Keep search dropdown open during clicks
                      className="absolute top-full left-0 mt-2 w-[28rem] bg-white border border-gray-150 rounded-2xl shadow-2xl overflow-hidden z-50 text-left max-h-[30rem] overflow-y-auto animate-scale-up p-2.5 space-y-3.5"
                    >
                      {!headerSearchQuery.trim() ? (
                        <div className="space-y-3.5">
                          {/* Suggested Queries list */}
                          <div>
                            <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1.5">
                              {t.suggestedShortcuts}
                            </p>
                            <div className="flex flex-wrap gap-1.5 px-1">
                              {['Road Damage', 'Water Leakage', 'Street Lighting', 'Talawade', 'Public Works'].map((term) => (
                                <button
                                  key={term}
                                  onClick={() => {
                                    setHeaderSearchQuery(term);
                                    setRecentSearches(prev => {
                                      const updated = [term, ...prev.filter(x => x !== term)].slice(0, 5);
                                      localStorage.setItem('fixmycity_recent_searches', JSON.stringify(updated));
                                      return updated;
                                    });
                                  }}
                                  className="text-[10px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all cursor-pointer font-bold"
                                >
                                  {term}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Recent Searches */}
                          {recentSearches.length > 0 && (
                            <div>
                              <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1 px-1.5">
                                {t.recentSearches}
                              </p>
                              <div className="space-y-0.5">
                                {recentSearches.map((term, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setHeaderSearchQuery(term)}
                                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-55 hover:text-gray-900 transition-all flex items-center space-x-2 cursor-pointer"
                                  >
                                    <Clock size={11} className="text-gray-400 shrink-0" />
                                    <span>{term}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recently Viewed Reports */}
                          {recentlyViewed.length > 0 && (
                            <div>
                              <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1 px-1.5">
                                {t.recentlyViewedInquiries}
                              </p>
                              <div className="space-y-0.5">
                                {recentlyViewed
                                  .map(id => issues.find(i => i.id === id))
                                  .filter(Boolean)
                                  .map((issue: any) => (
                                    <div
                                      key={issue.id}
                                      onClick={() => {
                                        navigate('issue-details', { id: issue.id });
                                        setHeaderSearchFocused(false);
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-gray-700 hover:bg-gray-55 transition-all flex items-center justify-between cursor-pointer group"
                                    >
                                      <div className="flex items-center space-x-2 truncate">
                                        <Clock size={11} className="text-gray-400 shrink-0" />
                                        <span className="font-bold truncate">{issue.title}</span>
                                      </div>
                                      <span className="text-[9px] font-mono text-gray-450 shrink-0 bg-gray-100 px-1 py-0.2 rounded-sm uppercase">
                                        {issue.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Search Results List
                        <div>
                          <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2 px-1.5">
                            Search Results ({searchResults.length})
                          </p>
                          {searchResults.length === 0 ? (
                            <div className="text-center py-8 text-gray-450 text-xs">
                              No matching tickets found. Try another query or check spelling.
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {searchResults.slice(0, 5).map((issue: any) => (
                                <div
                                  key={issue.id}
                                  className="w-full px-3 py-2 rounded-xl text-xs hover:bg-gray-50/90 transition-all flex items-center justify-between border border-transparent hover:border-gray-150 cursor-pointer"
                                >
                                  {/* Left: Metadata info click */}
                                  <div 
                                    onClick={() => {
                                      setRecentSearches(prev => {
                                        const updated = [headerSearchQuery, ...prev.filter(x => x !== headerSearchQuery)].slice(0, 5);
                                        localStorage.setItem('fixmycity_recent_searches', JSON.stringify(updated));
                                        return updated;
                                      });
                                      navigate('issue-details', { id: issue.id });
                                      setHeaderSearchFocused(false);
                                      setHeaderSearchQuery('');
                                    }}
                                    className="truncate pr-3 flex-1 text-left"
                                  >
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-[9px] font-mono text-blue-600 bg-blue-50 font-black px-1.5 py-0.2 rounded-sm">
                                        #{issue.id.substring(0, 8)}
                                      </span>
                                      <span className="font-bold text-gray-950 truncate">{issue.title}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-455 mt-1 truncate flex items-center">
                                      <MapPin size={10} className="mr-0.5 shrink-0 text-gray-400" />
                                      <span>{issue.location} • {issue.category}</span>
                                    </div>
                                  </div>

                                  {/* Right: Quick Action Hub Trigger buttons */}
                                  <div className="flex items-center space-x-1.5 shrink-0">
                                    <button
                                      onClick={() => {
                                        setSelectedSearchIssue(issue);
                                        setSearchQuickActionTab('timeline');
                                        setIsSearchQuickActionOpen(true);
                                      }}
                                      className="p-1 hover:bg-gray-200 text-gray-450 hover:text-gray-850 rounded-lg transition-colors cursor-pointer"
                                      title="Inspect Timeline details"
                                    >
                                      <Clock size={12} />
                                    </button>
                                    {userProfile?.role === 'admin' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setSelectedSearchIssue(issue);
                                            setSearchQuickActionTab('assign');
                                            setIsSearchQuickActionOpen(true);
                                          }}
                                          className="p-1 hover:bg-gray-200 text-gray-450 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                          title="Dispatch assignment"
                                        >
                                          <User size={12} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedSearchIssue(issue);
                                            setSearchQuickActionTab('status');
                                            setIsSearchQuickActionOpen(true);
                                          }}
                                          className="p-1 hover:bg-gray-200 text-gray-450 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                          title="Update complaint status"
                                        >
                                          <CheckCircle2 size={12} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Center: Main Nav Links */}
            <div className="hidden md:flex items-center space-x-6">
              {renderNavLinks()}
            </div>

            {/* Right: User Menu & Notification Alert Triggers */}
            <div className="hidden md:flex items-center space-x-4">
              {currentUser && (
                <>
                  {/* Notifications Alert Bell */}
                  <button
                    onClick={() => navigate('notifications')}
                    className="relative p-2 text-gray-450 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-150 rounded-xl transition-colors cursor-pointer"
                    id="header-bell-btn"
                  >
                    <Bell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-white ring-1 ring-blue-500/10">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Professional User Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="flex items-center space-x-2.5 pl-3 border-l border-gray-150 cursor-pointer focus:outline-hidden hover:opacity-90 select-none"
                      id="profile-dropdown-trigger"
                    >
                      {userProfile?.avatarUrl ? (
                        <img 
                          src={userProfile.avatarUrl} 
                          alt="Avatar" 
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase border border-blue-200">
                          {getInitials(userProfile?.fullName)}
                        </div>
                      )}
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-gray-900 leading-none">
                          {userProfile?.fullName || 'Civic User'}
                        </span>
                        <span className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-wider font-semibold flex items-center gap-0.5">
                          <span className="inline-flex items-center space-x-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${userProfile?.role === 'admin' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            <span>{userProfile?.role === 'admin' ? 'Administrator' : 'Citizen'}</span>
                          </span>
                          <ChevronDown size={10} />
                        </span>
                      </div>
                    </button>

                    {profileMenuOpen && (
                      <>
                        {/* Backdrop to close dropdown on outer clicks */}
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setProfileMenuOpen(false)}
                        />
                        
                        {/* Dropdown Card */}
                        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-150 rounded-2xl shadow-2xl overflow-hidden z-50 py-3 animate-scale-up">
                          <div className="px-4.5 py-3.5 border-b border-gray-100 flex items-center space-x-3.5 mb-2">
                            {userProfile?.avatarUrl ? (
                              <img 
                                src={userProfile.avatarUrl} 
                                alt="Avatar" 
                                referrerPolicy="no-referrer"
                                className="w-14 h-14 rounded-full object-cover border-2 border-white ring-2 ring-blue-100"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg uppercase border border-blue-200">
                                {getInitials(userProfile?.fullName)}
                              </div>
                            )}
                            <div className="flex flex-col truncate">
                              <span className="font-bold text-sm text-gray-900 truncate leading-tight mb-0.5">
                                {userProfile?.fullName || 'Civic User'}
                              </span>
                              <span className="text-[11px] text-gray-500 font-mono truncate mb-1.5">
                                {currentUser?.email || userProfile?.email}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center text-[8px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full border uppercase ${userProfile?.role === 'admin' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-blue-700 bg-blue-50 border-blue-150'}`}>
                                  {userProfile?.role === 'admin' ? 'Administrator' : 'Citizen'}
                                </span>
                                {userProfile?.createdAt && (
                                  <span className="text-[9px] text-gray-400 font-sans">
                                    {(() => {
                                      try {
                                        const d = new Date(userProfile.createdAt);
                                        return isNaN(d.getTime()) ? '' : `Est. ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
                                      } catch (e) {
                                        return '';
                                      }
                                    })()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Navigation Links */}
                          <div className="px-1.5 py-1 space-y-0.5">
                            <button
                              onClick={() => { navigate('profile'); setProfileMenuOpen(false); }}
                              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-55 transition-all text-left cursor-pointer"
                            >
                              <User size={14} className="text-gray-400" />
                              <span>My Profile</span>
                            </button>

                            <button
                              onClick={() => { navigate('settings'); setProfileMenuOpen(false); }}
                              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-55 transition-all text-left cursor-pointer"
                            >
                              <Settings size={14} className="text-gray-400" />
                              <span>Account Settings</span>
                            </button>

                            <div className="h-px bg-gray-100 my-1 mx-2" />

                            {/* Role specific secondary links */}
                            <button
                              onClick={() => { navigate('community-map'); setProfileMenuOpen(false); }}
                              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-55 transition-all text-left cursor-pointer"
                            >
                              <Compass size={14} className="text-gray-400" />
                              <span>Community Map</span>
                            </button>

                            <button
                              onClick={() => { navigate('community-insights'); setProfileMenuOpen(false); }}
                              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-55 transition-all text-left cursor-pointer"
                            >
                              <Sparkles size={14} className="text-gray-400" />
                              <span>Community Insights</span>
                            </button>

                            {userProfile?.role === 'admin' && (
                              <button
                                onClick={() => { navigate('users'); setProfileMenuOpen(false); }}
                                className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-55 transition-all text-left cursor-pointer"
                              >
                                <Users size={14} className="text-gray-400" />
                                <span>User Directory</span>
                              </button>
                            )}

                            <button
                              onClick={() => { navigate('about'); setProfileMenuOpen(false); }}
                              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-55 transition-all text-left cursor-pointer"
                            >
                              <HelpCircle size={14} className="text-gray-400" />
                              <span>Help & Support</span>
                            </button>

                            <div className="h-px bg-gray-100 my-1 mx-2" />

                            <button
                              onClick={() => { handleLogout(); setProfileMenuOpen(false); }}
                              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-red-650 hover:bg-red-50 transition-all text-left cursor-pointer"
                            >
                              <LogOut size={14} className="text-red-500" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {!currentUser && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('login')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <div className="flex items-center md:hidden gap-2">
              {currentUser && (
                <button
                  onClick={() => navigate('notifications')}
                  className="relative p-2 text-gray-450 hover:text-gray-700 bg-gray-50 border border-gray-150 rounded-lg"
                >
                  <Bell size={14} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-600 text-white font-bold text-[8px] rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-500 hover:text-gray-800 bg-gray-50 border border-gray-150 rounded-lg cursor-pointer"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu dropdown drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-gray-150 bg-white px-4 pt-2 pb-4 space-y-2.5 animate-fade-in shadow-inner">
            <div className="flex flex-col space-y-2">
              {renderNavLinks()}
            </div>

            {currentUser ? (
              <div className="pt-3 border-t border-gray-150 space-y-2.5">
                <div className="flex items-center space-x-2.5 px-1 pb-1">
                  {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-250">
                      {getInitials(userProfile?.fullName)}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900 leading-none">{userProfile?.fullName}</p>
                    <p className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                      {userProfile?.role === 'admin' ? 'Administrator' : 'Citizen'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { navigate('profile'); setMobileMenuOpen(false); }} className="text-center py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-755 font-bold cursor-pointer">Profile</button>
                  <button onClick={() => { navigate('settings'); setMobileMenuOpen(false); }} className="text-center py-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-755 font-bold cursor-pointer">Settings</button>
                </div>

                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center space-x-1.5 bg-red-50 text-red-700 py-2 rounded-lg text-xs font-bold border border-red-100 cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => { navigate('login'); setMobileMenuOpen(false); }}
                  className="flex-grow text-center py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Breadcrumb Navigation */}
      {currentUser && (
        <div className="bg-gray-55/65 border-b border-gray-150 py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1.5 text-[10px] font-bold font-mono text-gray-400 uppercase tracking-wider">
              {getBreadcrumbs().map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-gray-300 font-normal">/</span>}
                  {crumb.path ? (
                    <button
                      onClick={() => navigate(crumb.path)}
                      className="hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-gray-650 font-extrabold">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Container Workspace */}
      <main className="flex-1">
        {renderActiveView()}
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-gray-150 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-mono">
          <div className="flex items-center space-x-2">
            <ShieldCheck size={14} className="text-gray-300" />
            <span>© 2026 FixMyCity • Municipal Portal.</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('about')} className="hover:text-gray-650 cursor-pointer">About Mission</button>
            <button onClick={() => navigate('contact')} className="hover:text-gray-650 cursor-pointer">Municipal Helpdesk</button>
            <button onClick={() => navigate('privacy')} className="hover:text-gray-650 cursor-pointer">Privacy & Data Standards</button>
          </div>
        </div>
      </footer>

      {/* Search Quick Action Overlay */}
      <QuickActionModal
        isOpen={isSearchQuickActionOpen}
        onClose={() => { setIsSearchQuickActionOpen(false); setSelectedSearchIssue(null); }}
        issue={selectedSearchIssue}
        initialTab={searchQuickActionTab}
      />

      {/* Global Shortcut Command Palette Spotlights */}
      <CommandPalette />

    </div>
  );
}
