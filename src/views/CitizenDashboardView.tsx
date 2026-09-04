import React from 'react';
import { useApp } from '../context/AppContext';
import { IssueCard } from '../components/IssueCard';
import { 
  Sparkles, PlusCircle, AlertTriangle, CheckCircle, 
  Clock, FileText, Bell, ChevronRight, CornerDownRight,
  RefreshCw, Users, Shield
} from 'lucide-react';

export const CitizenDashboardView: React.FC = () => {
  const { 
    userProfile, 
    issues, 
    loadingIssues,
    currentUser, 
    notifications, 
    navigate 
  } = useApp();

  // Filter issues reported by current citizen
  const citizenIssues = issues.filter(issue => issue.userId === currentUser?.uid);

  // Community Contributions calculations
  const verifiedIssuesCount = issues.filter(issue => 
    issue.verifications?.some(v => v.userId === currentUser?.uid)
  ).length;

  const helpfulContributionsCount = issues.filter(issue => 
    issue.status === 'resolved' && 
    issue.verifications?.some(v => v.userId === currentUser?.uid)
  ).length;

  // Status stats
  const reportedCount = citizenIssues.filter(i => i.status === 'reported' || i.status === 'reopened').length;
  const inProgressCount = citizenIssues.filter(i => i.status === 'in_progress' || i.status === 'paused').length;
  const underReviewCount = citizenIssues.filter(i => i.status === 'under_review').length;
  const resolvedCount = citizenIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length;

  // Recent 3 reports
  const recentIssues = citizenIssues.slice(0, 3);

  // Recent 3 notifications
  const recentNotifications = notifications.slice(0, 3);

  if (loadingIssues) {
    return (
      <div className="bg-gray-50 min-h-screen py-8 font-sans animate-pulse" id="citizen-dashboard-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Banner Skeleton */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
            <div className="h-4 bg-gray-200 rounded-full w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded-full w-64 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded-full w-80"></div>
          </div>

          {/* Quick Statistics Grid Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-gray-150 rounded-xl p-5 shadow-xs flex items-center space-x-4">
                <div className="bg-gray-100 h-11 w-11 rounded-lg shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                  <div className="h-3 bg-gray-200 rounded-full w-20"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Double Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column Feed Skeleton */}
            <div className="lg:col-span-2 space-y-4">
              <div className="h-6 bg-gray-200 rounded-full w-40 mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs h-[420px] flex flex-col justify-between">
                    <div className="h-44 bg-gray-100 animate-pulse"></div>
                    <div className="p-5 space-y-4 flex-1">
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-200 rounded-full w-16"></div>
                        <div className="h-3 bg-gray-200 rounded-full w-20"></div>
                      </div>
                      <div className="h-5 bg-gray-200 rounded-full w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded-full w-full"></div>
                      <div className="h-3 bg-gray-200 rounded-full w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column Sidebar Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded-full w-32"></div>
                <div className="bg-white border border-gray-150 rounded-xl shadow-xs p-4 space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex gap-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-lg shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded-full w-2/3"></div>
                        <div className="h-3 bg-gray-200 rounded-full w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8" id="citizen-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Banner */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 max-w-max mb-2">
              <Sparkles size={12} />
              <span>Civic Account Active</span>
            </div>
            <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight sm:text-3xl">
              Welcome Back, {userProfile?.fullName}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Track your reports, receive municipal updates, and contribute to improving your community.
            </p>
          </div>
          <button
            onClick={() => navigate('report-issue')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-sm shrink-0"
            id="dash-report-btn"
          >
            <PlusCircle size={18} />
            <span>Report New Issue</span>
          </button>
        </div>

        {/* Quick Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1 */}
          <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <span className="block text-xl font-bold font-mono text-gray-900 leading-tight">{citizenIssues.length}</span>
              <span className="text-[10px] text-gray-400 font-bold font-sans uppercase tracking-wider">Total Filed</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <span className="block text-xl font-bold font-mono text-gray-900 leading-tight">{reportedCount + underReviewCount}</span>
              <span className="text-[10px] text-gray-400 font-bold font-sans uppercase tracking-wider">Pending Review</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg shrink-0">
              <CornerDownRight size={18} />
            </div>
            <div>
              <span className="block text-xl font-bold font-mono text-gray-900 leading-tight">{inProgressCount}</span>
              <span className="text-[10px] text-gray-400 font-bold font-sans uppercase tracking-wider">In Progress</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg shrink-0">
              <CheckCircle size={18} />
            </div>
            <div>
              <span className="block text-xl font-bold font-mono text-gray-900 leading-tight">{resolvedCount}</span>
              <span className="text-[10px] text-gray-400 font-bold font-sans uppercase tracking-wider">Resolved</span>
            </div>
          </div>
        </div>

        {/* Double Column: Recent Reports & Live Notification Ticker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column Left (Issues Feed) - takes 2 cols */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-display font-bold text-gray-900">Your Recent Reports</h2>
              {citizenIssues.length > 3 && (
                <button
                  onClick={() => navigate('my-reports')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center cursor-pointer"
                >
                  <span>View All {citizenIssues.length}</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>

            {citizenIssues.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-250 rounded-xl p-10 text-center flex flex-col items-center">
                <FileText size={48} className="text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-900 text-sm">No reports have been submitted yet.</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  Report infrastructure safety risks such as potholes, dark streets, or leaks, and track updates transparently.
                </p>
                <button
                  onClick={() => navigate('report-issue')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs cursor-pointer"
                >
                  Report Your First Issue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentIssues.map(issue => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            )}
          </div>

          {/* Column Right (Notifications List & AI Panels) - takes 1 col */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-display font-bold text-gray-900">Notifications</h2>
                {notifications.length > 0 && (
                  <button
                    onClick={() => navigate('notifications')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center cursor-pointer"
                  >
                    <span>All Notifications</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <div className="bg-white border border-gray-150 rounded-xl shadow-xs overflow-hidden">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Bell size={28} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-xs font-mono">No New Alerts</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentNotifications.map(notification => {
                      // Category-specific icons
                      const cat = notification.category || 'reports';
                      const IconComponent = cat === 'reports' ? FileText
                        : cat === 'status_updates' ? RefreshCw
                        : cat === 'community_activity' ? Users
                        : cat === 'admin_actions' ? Shield
                        : AlertTriangle;
                      
                      const iconColor = cat === 'reports' ? 'text-blue-500 bg-blue-50'
                        : cat === 'status_updates' ? 'text-emerald-500 bg-emerald-50'
                        : cat === 'community_activity' ? 'text-indigo-500 bg-indigo-50'
                        : cat === 'admin_actions' ? 'text-amber-500 bg-amber-50'
                        : 'text-rose-500 bg-rose-50';

                      return (
                        <div 
                          key={notification.id} 
                          onClick={() => notification.issueId && navigate('issue-details', { id: notification.issueId })}
                          className={`p-4 hover:bg-gray-50/70 transition-colors cursor-pointer flex gap-3 ${!notification.read ? 'bg-blue-50/15' : ''}`}
                        >
                          <div className={`p-1.5 h-8 w-8 rounded-lg border border-gray-100 flex items-center justify-center shrink-0 ${iconColor}`}>
                            <IconComponent size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className={`text-xs font-bold leading-tight block truncate ${!notification.read ? 'text-blue-700 font-extrabold' : 'text-gray-900'}`}>
                                {notification.title}
                              </span>
                              {!notification.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-550 mt-0.5 line-clamp-2 leading-snug">
                              {notification.message}
                            </p>
                            <span className="text-[9px] font-mono text-gray-400 mt-1 block">
                              {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Community Contributions Card */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs" id="community-contributions-card">
              <h3 className="font-display font-bold text-gray-900 mb-4 text-sm flex items-center justify-between">
                <span>Community Confirmation</span>
                <span className="text-[10px] font-mono font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Citizen Partner
                </span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Metric 1 */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="text-emerald-700 font-bold mb-1 flex items-center gap-1.5 text-xs">
                    <CheckCircle size={14} />
                    <span>Confirmed</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-bold font-mono text-emerald-800">{verifiedIssuesCount}</span>
                    <span className="text-[10px] text-gray-400 font-medium font-sans uppercase tracking-wider block mt-0.5">
                      Issues Confirmed
                    </span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex flex-col justify-between">
                  <div className="text-blue-700 font-bold mb-1 flex items-center gap-1.5 text-xs">
                    <Sparkles size={14} />
                    <span>Helpful</span>
                  </div>
                  <div>
                    <span className="block text-2xl font-bold font-mono text-blue-800">{helpfulContributionsCount}</span>
                    <span className="text-[10px] text-gray-400 font-medium font-sans uppercase tracking-wider block mt-0.5">
                      Confirmed Helpful
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 mt-4 leading-relaxed font-sans border-t border-gray-100 pt-3">
                Collaboratively confirming civic complaints helps municipal staff assign and resolve public issues faster.
              </p>
            </div>

            {/* Helpful Service Routing Panel */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                    <Shield size={14} className="text-white" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-100 font-sans">Municipal Services</span>
                </div>
                <h4 className="text-base font-display font-bold leading-tight mb-2">Automated Ticket Routing</h4>
                <p className="text-blue-100 text-xs leading-relaxed mb-4">
                  Your submitted reports are automatically routed to the responsible city departments (such as Road Maintenance, Public Utilities, or Sanitation) based on the location and issue type.
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] border border-white/20">Roads</span>
                  <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] border border-white/20">Utilities</span>
                </div>
              </div>
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            {/* Neighborhood Status Panel */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-xs">
              <h3 className="font-display font-bold text-gray-900 mb-4 text-sm">Neighborhood Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-500">Resolution Speed</span>
                    <span className="text-emerald-600">+12% vs last month</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[78%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-500">Reporting Accuracy</span>
                    <span className="text-blue-600">High Confidence</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[92%] rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="mt-5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0 animate-ping"></div>
                  <span className="text-xs text-gray-600 font-medium leading-relaxed">
                    Water utility maintenance scheduled for your area this Sunday.
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
