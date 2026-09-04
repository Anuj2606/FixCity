import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NotificationItem } from '../types';
import { 
  Bell, 
  Check, 
  Clock, 
  ExternalLink, 
  Trash, 
  FileText, 
  RefreshCw, 
  Users, 
  Shield, 
  AlertTriangle, 
  Filter, 
  CheckSquare, 
  X,
  ChevronRight,
  Info
} from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.FC<{ size?: number; className?: string }>; color: string; border: string; bg: string }> = {
  reports: { label: 'Reports', icon: FileText, color: 'text-blue-600', border: 'border-blue-100', bg: 'bg-blue-50' },
  status_updates: { label: 'Status Update', icon: RefreshCw, color: 'text-emerald-600', border: 'border-emerald-100', bg: 'bg-emerald-50' },
  community_activity: { label: 'Community', icon: Users, color: 'text-indigo-600', border: 'border-indigo-100', bg: 'bg-indigo-50' },
  admin_actions: { label: 'Admin Action', icon: Shield, color: 'text-amber-600', border: 'border-amber-100', bg: 'bg-amber-50' },
  system_alerts: { label: 'System Alert', icon: AlertTriangle, color: 'text-rose-600', border: 'border-rose-100', bg: 'bg-rose-50' },
};

const URGENCY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  low: { label: 'Low', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  medium: { label: 'Medium', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  high: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  critical: { label: 'Critical', bg: 'bg-rose-100 text-rose-800 border-rose-200', text: 'text-rose-800', border: 'border-rose-200' },
  urgent: { label: 'Urgent', bg: 'bg-rose-100 text-rose-800 border-rose-200', text: 'text-rose-800', border: 'border-rose-200' },
};

export const NotificationsView: React.FC = () => {
  const { 
    notifications, 
    markNotificationsAsRead, 
    markNotificationAsRead, 
    deleteNotification, 
    navigate,
    userProfile 
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeUrgency, setActiveUrgency] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Mark all unread notifications as read when landing on the view, or wait for user to click
  // Let's do a prompt-requested option: mark all as read is a button, but marking as read can also happen automatically.
  // To keep it super interactive and let users see unread highlighting, we will let them mark manually or mark all as read.
  
  const handleMarkAllAsRead = async () => {
    await markNotificationsAsRead();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const handleMarkOneAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await markNotificationAsRead(id);
  };

  // Filter notification list
  const filteredNotifications = notifications.filter(notif => {
    // 1. Category Filter
    if (activeCategory !== 'all' && notif.category !== activeCategory) {
      return false;
    }
    // 2. Urgency Filter
    if (activeUrgency !== 'all' && notif.urgency !== activeUrgency) {
      return false;
    }
    // 3. Read Status Filter
    if (readFilter === 'unread' && notif.read) return false;
    if (readFilter === 'read' && !notif.read) return false;

    return true;
  });

  // Grouping by Date Helper
  const groupNotificationsByDate = (notifs: NotificationItem[]) => {
    const groups: Record<string, NotificationItem[]> = {
      'Today': [],
      'Yesterday': [],
      'Earlier this Week': [],
      'Older': [],
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    notifs.forEach(n => {
      const d = new Date(n.createdAt);
      if (d >= today) {
        groups['Today'].push(n);
      } else if (d >= yesterday) {
        groups['Yesterday'].push(n);
      } else if (d >= oneWeekAgo) {
        groups['Earlier this Week'].push(n);
      } else {
        groups['Older'].push(n);
      }
    });

    return Object.keys(groups).reduce((acc, key) => {
      if (groups[key].length > 0) {
        acc[key] = groups[key];
      }
      return acc;
    }, {} as Record<string, NotificationItem[]>);
  };

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  const totalUnreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-gray-50 min-h-screen py-8 font-sans" id="notifications-view">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="md:flex md:items-center md:justify-between mb-8 border-b border-gray-200 pb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight sm:text-4xl">
              Notifications & Activity Center
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Track real-time status reviews, agency dispatch reassignments, municipal updates, and verification milestones.
            </p>
          </div>

          <div className="mt-4 flex flex-shrink-0 md:mt-0 md:ml-4 gap-3">
            {totalUnreadCount > 0 && (
              <button
                type="button"
                id="btn-mark-all-read"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-xs text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <CheckSquare className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
                Mark all as read
              </button>
            )}
            <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Bell className="mr-2 h-4 w-4 animate-swing" />
              {totalUnreadCount} Unread
            </span>
          </div>
        </div>

        {/* Outer Dashboard-like Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center mb-4">
                <Filter size={14} className="mr-2" />
                Filter Feed
              </h2>

              {/* Read/Unread Filters */}
              <div className="space-y-1 mb-6">
                <span className="text-xs text-gray-500 block mb-2 font-semibold">Status</span>
                <button
                  onClick={() => setReadFilter('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex justify-between items-center transition-all ${
                    readFilter === 'all' 
                      ? 'bg-blue-50/70 text-blue-700 font-bold' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>All Alerts</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {notifications.length}
                  </span>
                </button>
                <button
                  onClick={() => setReadFilter('unread')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex justify-between items-center transition-all ${
                    readFilter === 'unread' 
                      ? 'bg-blue-50/70 text-blue-700 font-bold' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>Unread</span>
                  {totalUnreadCount > 0 && (
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold font-mono">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setReadFilter('read')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex justify-between items-center transition-all ${
                    readFilter === 'read' 
                      ? 'bg-blue-50/70 text-blue-700 font-bold' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>Read</span>
                  <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {notifications.length - totalUnreadCount}
                  </span>
                </button>
              </div>

              {/* Category Filter */}
              <div className="space-y-1 mb-6">
                <span className="text-xs text-gray-500 block mb-2 font-semibold">Category</span>
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center transition-all ${
                    activeCategory === 'all' 
                      ? 'bg-gray-100 text-gray-900 font-bold' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Bell size={14} className="mr-2 text-gray-400" />
                  <span>All Categories</span>
                </button>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center transition-all ${
                        activeCategory === key 
                          ? `${config.bg} ${config.color} font-bold` 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent size={14} className="mr-2" />
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Urgency Filter */}
              <div className="space-y-1">
                <span className="text-xs text-gray-500 block mb-2 font-semibold">Urgency Level</span>
                <button
                  onClick={() => setActiveUrgency('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeUrgency === 'all' ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Priority Levels
                </button>
                {Object.entries(URGENCY_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setActiveUrgency(key)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                      activeUrgency === key 
                        ? 'bg-gray-100 text-gray-900 font-bold' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{config.label}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${key === 'critical' || key === 'urgent' ? 'bg-red-500' : key === 'high' ? 'bg-orange-400' : key === 'medium' ? 'bg-blue-400' : 'bg-gray-300'}`} />
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Main Feed Column */}
          <div className="lg:col-span-3 space-y-6">
            
            {filteredNotifications.length === 0 ? (
              <div className="bg-white border border-gray-150 rounded-2xl p-16 text-center shadow-xs">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="font-bold text-gray-900 text-lg">No Notifications Found</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed max-w-sm mx-auto">
                  We couldn't find any notifications matching your current filters. Clear your filters or explore other categories.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setActiveUrgency('all');
                    setReadFilter('all');
                  }}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedNotifications).map(([groupTitle, notifs]) => (
                  <div key={groupTitle} className="space-y-3">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">
                      {groupTitle}
                    </h3>

                    <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden divide-y divide-gray-100">
                      {notifs.map((notif) => {
                        const cat = notif.category || 'reports';
                        const catConfig = CATEGORY_CONFIG[cat] || { label: 'Alert', icon: Bell, color: 'text-gray-600', border: 'border-gray-100', bg: 'bg-gray-50' };
                        const urg = notif.urgency || 'low';
                        const urgConfig = URGENCY_CONFIG[urg];
                        const IconComponent = catConfig.icon;

                        return (
                          <div 
                            key={notif.id}
                            onClick={() => notif.issueId && navigate('issue-details', { id: notif.issueId })}
                            className={`p-5 flex items-start gap-4 hover:bg-gray-50/70 transition-all cursor-pointer relative group ${
                              !notif.read ? 'bg-gradient-to-r from-blue-50/15 via-blue-50/5 to-transparent border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                            }`}
                          >
                            {/* Icon Indicator */}
                            <div className={`p-2.5 rounded-xl shrink-0 border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                              <IconComponent size={18} />
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-sm font-bold truncate ${
                                  !notif.read ? 'text-gray-900 font-extrabold' : 'text-gray-700'
                                }`}>
                                  {notif.title}
                                </span>

                                {/* Category Badge */}
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}>
                                  {catConfig.label}
                                </span>

                                {/* Urgency Badge */}
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${urgConfig.bg} ${urgConfig.text} ${urgConfig.border}`}>
                                  {urgConfig.label} Priority
                                </span>

                                {/* New/Unread Glow Badge */}
                                {!notif.read && (
                                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse ml-auto" />
                                )}
                              </div>

                              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                                {notif.message}
                              </p>

                              <div className="flex items-center space-x-4 mt-3 text-[10px] text-gray-400 font-mono">
                                <span className="flex items-center">
                                  <Clock size={11} className="mr-1 text-gray-400" />
                                  {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                
                                {notif.issueId && (
                                  <span className="text-blue-600 hover:underline flex items-center font-bold">
                                    Track Ticket Details 
                                    <ChevronRight size={10} className="ml-0.5" />
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions overlay for individual items (mark read / delete) */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                              {!notif.read && (
                                <button
                                  type="button"
                                  title="Mark as read"
                                  onClick={(e) => handleMarkOneAsRead(e, notif.id)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                title="Delete alert"
                                onClick={(e) => handleDelete(e, notif.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash size={14} />
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Smart Information Callout */}
            <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
              <Info className="text-blue-600 mt-0.5 shrink-0" size={16} />
              <div className="text-xs text-blue-800 leading-relaxed">
                <p className="font-bold">Real-time Push Alerts</p>
                <p className="mt-0.5 opacity-90">To receive immediate browser sound alerts or automated notification updates on critical infrastructure events, ensure notifications are enabled inside your profile setting tab.</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
