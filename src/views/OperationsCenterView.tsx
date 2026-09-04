import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getSLAMetrics } from '../lib/slaUtils';
import { IssueReport, IssueStatus, IssueSeverity } from '../types';
import { QuickActionModal } from '../components/QuickActionModal';
import { 
  Shield, AlertTriangle, Clock, TrendingUp, Bell, Calendar, PlusCircle, 
  Search, SlidersHorizontal, Trash2, Bookmark, FolderHeart, Activity, CheckCircle2, MapPin, MessageSquare, RefreshCw, Layers, CheckSquare, Eye, PlaySquare, X, UserCheck
} from 'lucide-react';

interface SavedView {
  id: string;
  name: string;
  filters: {
    status: string;
    severity: string;
    category: string;
    department: string;
    isOverdue?: boolean;
  };
}

export const OperationsCenterView: React.FC = () => {
  const { issues, notifications, navigate, userProfile } = useApp();
  const isAdmin = userProfile?.role === 'admin';

  // Visible issues (exclude demo seed filters if needed, let's keep all active issues)
  const activeIssues = issues.filter(i => !i.isDemoSeed && !i.id.startsWith('issue-seed-'));

  // Saved Views State
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  
  // Custom Filter Builder State
  const [filterName, setFilterName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);

  // Quick Action Modal State
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);
  const [quickActionType, setQuickActionType] = useState<'assign' | 'status' | 'timeline' | 'map' | 'comment'>('timeline');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Search/Filter for Active Results Workspace
  const [searchText, setSearchText] = useState('');

  const categories = [
    'Road Damage',
    'Sanitation & Waste',
    'Streetlights & Electricity',
    'Water & Sewer',
    'Parks & Recreation',
    'Public Health & Safety',
    'Other'
  ];

  const departments = [
    'Public Works Department',
    'Sanitation & Waste Management',
    'Traffic Control & Lighting',
    'Water & Sewer Authority',
    'Parks & Recreation Department',
    'Department of Public Health & Safety'
  ];

  // Initialize Default Saved Views & Load custom ones from Local Storage
  useEffect(() => {
    const defaultViews: SavedView[] = [
      {
        id: 'default-high',
        name: '🔥 High Priority Cases',
        filters: { status: '', severity: 'high', category: '', department: '' }
      },
      {
        id: 'default-overdue',
        name: '🚨 Overdue Reports',
        filters: { status: '', severity: '', category: '', department: '', isOverdue: true }
      },
      {
        id: 'default-roads',
        name: '🛣️ Road Infrastructure',
        filters: { status: '', severity: '', category: 'Road Damage', department: '' }
      },
      {
        id: 'default-water',
        name: '💧 Water Department',
        filters: { status: '', severity: '', category: '', department: 'Water & Sewer Authority' }
      }
    ];

    const storageKey = isAdmin ? 'fixmycity_saved_views_admin' : 'fixmycity_saved_views_citizen';
    const localViews = localStorage.getItem(storageKey);
    
    if (localViews) {
      setSavedViews([...defaultViews, ...JSON.parse(localViews)]);
    } else {
      setSavedViews(defaultViews);
    }
  }, [isAdmin]);

  // Handle Save Custom View
  const handleSaveView = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterName.trim()) return;

    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name: `📌 ${filterName}`,
      filters: {
        status: statusFilter,
        severity: severityFilter,
        category: categoryFilter,
        department: deptFilter,
        isOverdue: overdueFilter
      }
    };

    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);

    // Save strictly custom ones back to storage
    const customViews = updatedViews.filter(v => !v.id.startsWith('default-'));
    const storageKey = isAdmin ? 'fixmycity_saved_views_admin' : 'fixmycity_saved_views_citizen';
    localStorage.setItem(storageKey, JSON.stringify(customViews));

    // Reset Form
    setFilterName('');
    setShowFilterBuilder(false);
  };

  // Handle Delete Custom View
  const handleDeleteView = (e: React.MouseEvent, viewId: string) => {
    e.stopPropagation();
    const updatedViews = savedViews.filter(v => v.id !== viewId);
    setSavedViews(updatedViews);

    const customViews = updatedViews.filter(v => !v.id.startsWith('default-'));
    const storageKey = isAdmin ? 'fixmycity_saved_views_admin' : 'fixmycity_saved_views_citizen';
    localStorage.setItem(storageKey, JSON.stringify(customViews));

    if (selectedViewId === viewId) {
      setSelectedViewId(null);
    }
  };

  // Quick Action Launcher helper
  const launchQuickAction = (issue: IssueReport, type: typeof quickActionType) => {
    setSelectedIssue(issue);
    setQuickActionType(type);
    setIsQuickActionOpen(true);
  };

  // SLA Calculation helper
  const getIssuesWithSLA = (issueList: IssueReport[]) => {
    return issueList.map(issue => ({
      issue,
      sla: getSLAMetrics(issue)
    }));
  };

  const issuesWithSLA = getIssuesWithSLA(activeIssues);

  // METRICS & COLUMN QUERIES
  // 1. Overdue SLA Issues: status not resolved/closed, and SLA isOverdue
  const overdueIssues = issuesWithSLA
    .filter(item => !['resolved', 'closed'].includes(item.issue.status) && item.sla.isOverdue)
    .map(item => item.issue);

  // 2. High Priority cases: critical or high severity, not resolved/closed
  const highPriorityIssues = activeIssues
    .filter(issue => ['critical', 'high'].includes(issue.severity) && !['resolved', 'closed'].includes(issue.status));

  // 3. Recently Updated: sorted by updatedAt
  const recentlyUpdatedIssues = [...activeIssues]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // 4. Community Trending: highest supportedBy or comments length, active status
  const trendingIssues = [...activeIssues]
    .filter(issue => !['resolved', 'closed'].includes(issue.status))
    .sort((a, b) => {
      const aScore = (a.supportedBy?.length || 0) * 2 + (a.comments?.length || 0);
      const bScore = (b.supportedBy?.length || 0) * 2 + (b.comments?.length || 0);
      return bScore - aScore;
    })
    .slice(0, 5);

  // 5. Pending Administrative Actions: unassigned or 'reported' status
  const pendingAdminIssues = activeIssues
    .filter(issue => issue.status === 'reported' || !issue.assignedDepartment);

  // 6. Upcoming Inspections / Repairs: has future scheduled inspection or repair date
  const upcomingInspections = activeIssues
    .filter(issue => issue.inspectionScheduledAt || issue.repairScheduledAt)
    .sort((a, b) => {
      const aDate = a.repairScheduledAt || a.inspectionScheduledAt || '';
      const bDate = b.repairScheduledAt || b.inspectionScheduledAt || '';
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });

  // Recent Admin/Citizen relevant notifications
  const recentNotifications = notifications.slice(0, 5);

  // FILTERED WORKSPACE SELECTION & COMPUTATION
  const activeSelectedView = savedViews.find(v => v.id === selectedViewId);

  const workspaceIssues = activeIssues.filter(issue => {
    if (!activeSelectedView) return true;
    const { status, severity, category, department, isOverdue } = activeSelectedView.filters;
    
    const matchesStatus = !status || issue.status === status;
    const matchesSeverity = !severity || issue.severity === severity;
    const matchesCategory = !category || issue.category === category;
    const matchesDept = !department || issue.assignedDepartment === department;
    
    let matchesOverdue = true;
    if (isOverdue) {
      const s = getSLAMetrics(issue);
      matchesOverdue = !['resolved', 'closed'].includes(issue.status) && s.isOverdue;
    }

    return matchesStatus && matchesSeverity && matchesCategory && matchesDept && matchesOverdue;
  });

  const finalWorkspaceIssues = workspaceIssues.filter(issue => {
    if (!searchText.trim()) return true;
    const term = searchText.toLowerCase();
    return (
      issue.title.toLowerCase().includes(term) ||
      issue.description.toLowerCase().includes(term) ||
      issue.location.toLowerCase().includes(term) ||
      issue.assignedDepartment?.toLowerCase().includes(term) ||
      issue.assignedOfficer?.toLowerCase().includes(term) ||
      issue.userName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-gray-55 min-h-screen flex" id="operations-center-hub">
      
      {/* Sidebar - Saved Views panel */}
      <aside className="w-72 bg-white border-r border-gray-150 p-6 flex flex-col shrink-0 hidden lg:flex" id="ops-sidebar">
        <div className="flex items-center space-x-2 pb-5 border-b border-gray-150 mb-6">
          <Layers size={18} className="text-blue-600" />
          <h2 className="text-sm font-display font-black text-gray-900 uppercase tracking-wider">
            Ops Console Views
          </h2>
        </div>

        {/* Saved Views List */}
        <div className="flex-1 overflow-y-auto space-y-5" id="saved-views-sidebar-list">
          <div>
            <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2.5">
              General Presets
            </h3>
            <button
              onClick={() => setSelectedViewId(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedViewId === null 
                  ? 'bg-blue-50 text-blue-700 border border-blue-100/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Activity size={13} />
                <span>📊 Operations Hub</span>
              </div>
              <span className="bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded-md text-[9px] font-mono">
                {activeIssues.length}
              </span>
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                Saved Custom Views
              </h3>
              <button
                onClick={() => setShowFilterBuilder(!showFilterBuilder)}
                className="text-blue-600 hover:text-blue-800 text-[10px] font-black cursor-pointer uppercase flex items-center gap-0.5"
                title="Create a new saved search view"
              >
                <PlusCircle size={11} />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-1">
              {savedViews.map(view => (
                <button
                  key={view.id}
                  onClick={() => setSelectedViewId(view.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold group transition-all cursor-pointer border ${
                    selectedViewId === view.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{view.name}</span>
                  <div className="flex items-center space-x-1 shrink-0">
                    {!view.id.startsWith('default-') && (
                      <button
                        onClick={(e) => handleDeleteView(e, view.id)}
                        className={`p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                          selectedViewId === view.id ? 'hover:bg-blue-700 text-blue-200' : 'hover:bg-red-50 text-red-500'
                        }`}
                        title="Delete view"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Help Tip */}
        <div className="bg-blue-50/40 border border-blue-100/50 p-4 rounded-xl text-xs text-blue-800 shrink-0 mt-6">
          <p className="font-bold flex items-center gap-1">
            <CheckSquare size={13} className="shrink-0" />
            <span>Pro Operational Tip</span>
          </p>
          <p className="mt-1 leading-relaxed text-blue-750 font-normal">
            Press <kbd className="bg-white border border-blue-200 px-1 py-0.5 rounded-sm font-mono font-bold text-[10px] shadow-2xs">Ctrl + K</kbd> anywhere to open the system command palette and instantly warp to key modules.
          </p>
        </div>
      </aside>

      {/* Main Workspace content */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto" id="ops-main-pane">
        
        {/* Saved View Filters Form Overlay */}
        {showFilterBuilder && (
          <div className="mb-8 p-5 bg-white border border-gray-150 rounded-2xl shadow-md animate-scale-up">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <h4 className="text-xs font-display font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark size={14} className="text-blue-600" />
                <span>Save New Filter View</span>
              </h4>
              <button 
                onClick={() => setShowFilterBuilder(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveView} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">
                    View Name
                  </label>
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="E.g., Critical Streetlights"
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden"
                  >
                    <option value="">Any Status</option>
                    <option value="reported">Reported</option>
                    <option value="under_review">Under Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="paused">Paused</option>
                    <option value="reopened">Reopened</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Severity
                  </label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden"
                  >
                    <option value="">Any Severity</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden"
                  >
                    <option value="">Any Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden"
                  >
                    <option value="">Any Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <label className="flex items-center space-x-2 text-xs font-bold text-gray-600">
                  <input
                    type="checkbox"
                    checked={overdueFilter}
                    onChange={(e) => setOverdueFilter(e.target.checked)}
                    className="rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Overdue Only</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFilterBuilder(false)}
                  className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  Save Preset View
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TOP LAYOUT SHIFT: Active Saved View Results Workspace vs Dashboard Hub */}
        {selectedViewId !== null ? (
          <div id="saved-view-results-workspace">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-gray-150 mb-6">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Preset Workspace active
                  </span>
                  <button
                    onClick={() => setSelectedViewId(null)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ← Back to General Operations Hub
                  </button>
                </div>
                <h1 className="text-xl sm:text-2xl font-display font-black text-gray-900 tracking-tight mt-1.5">
                  {activeSelectedView?.name}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Matched <strong className="text-gray-700">{finalWorkspaceIssues.length}</strong> active tickets based on custom saved filters.
                </p>
              </div>

              {/* Mini Search inside results */}
              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Filter workspace by text..."
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-250 rounded-xl text-xs bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Results Output (Grid Table layout) */}
            {finalWorkspaceIssues.length === 0 ? (
              <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center text-gray-450 text-xs">
                <FolderHeart size={32} className="mx-auto text-gray-300 mb-3" />
                No tickets matching these parameters currently exist. Try updating filters or report a new concern.
              </div>
            ) : (
              <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/75 border-b border-gray-150 text-[10px] font-mono font-black text-gray-400 uppercase tracking-wider">
                        <th className="px-5 py-3">Inquiry Case</th>
                        <th className="px-5 py-3">Assigned Team</th>
                        <th className="px-5 py-3">Resolution Status</th>
                        <th className="px-5 py-3">Urgency</th>
                        <th className="px-5 py-3">Resolution Time</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-600">
                      {finalWorkspaceIssues.map(issue => {
                        const sla = getSLAMetrics(issue);
                        return (
                          <tr key={issue.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="font-bold text-gray-900">{issue.title}</div>
                              <div className="text-[11px] text-gray-400 mt-0.5 flex items-center">
                                <MapPin size={11} className="mr-0.5" />
                                <span>{issue.location}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-bold text-gray-800">{issue.assignedDepartment || 'Unassigned'}</div>
                              {issue.assignedOfficer && (
                                <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                                  Lead: {issue.assignedOfficer}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                issue.status === 'resolved' ? 'bg-emerald-50 text-emerald-800' :
                                issue.status === 'in_progress' ? 'bg-indigo-50 text-indigo-800' :
                                issue.status === 'under_review' ? 'bg-amber-50 text-amber-800' :
                                'bg-blue-50 text-blue-800'
                              }`}>
                                {issue.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-mono font-black uppercase text-[10px]">
                              <span className={
                                issue.severity === 'critical' ? 'text-red-600' :
                                issue.severity === 'high' ? 'text-orange-500' :
                                issue.severity === 'medium' ? 'text-amber-600' : 'text-gray-450'
                              }>
                                {issue.severity}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[10px] font-mono font-bold ${
                                sla.isOverdue ? 'text-red-600' : 'text-emerald-600'
                              }`}>
                                {sla.isOverdue ? '🚨 Overdue' : '✅ On Track'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => launchQuickAction(issue, 'timeline')}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-gray-100 rounded-lg transition-colors cursor-pointer"
                                  title="Quick View Details"
                                >
                                  <Eye size={13} />
                                </button>
                                {isAdmin && (
                                  <>
                                    <button
                                      onClick={() => launchQuickAction(issue, 'assign')}
                                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-gray-100 rounded-lg transition-colors cursor-pointer"
                                      title="Assign Officer"
                                    >
                                      <UserCheck size={13} />
                                    </button>
                                    <button
                                      onClick={() => launchQuickAction(issue, 'status')}
                                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-gray-100 rounded-lg transition-colors cursor-pointer"
                                      title="Change Status"
                                    >
                                      <CheckCircle2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div id="general-ops-center-dashboard">
            {/* Welcome Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-150 mb-8">
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-black text-gray-900 tracking-tight">
                  Issue Management Center
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Real-time updates on civic concerns, department resolution times, and community responses.
                </p>
              </div>

              {/* Stat Highlights summary */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <span className="bg-rose-50 text-rose-700 font-bold border border-rose-100 px-3 py-1 rounded-xl text-xs flex items-center gap-1">
                  <AlertTriangle size={13} />
                  <span>{overdueIssues.length} Overdue</span>
                </span>
                <span className="bg-orange-50 text-orange-700 font-bold border border-orange-100 px-3 py-1 rounded-xl text-xs flex items-center gap-1">
                  <Shield size={13} />
                  <span>{highPriorityIssues.length} Critical Cases</span>
                </span>
                <span className="bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 px-3 py-1 rounded-xl text-xs flex items-center gap-1">
                  <Activity size={13} />
                  <span>{activeIssues.length} Total active</span>
                </span>
              </div>
            </div>

            {/* THREE-COLUMN BENTO GRID DASHBOARD LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="ops-columns-grid">
              
              {/* Column 1: OVERDUE & PENDING ACTIONS */}
              <div className="space-y-6">
                
                {/* Overdue Issues Column */}
                <div className="bg-white border border-gray-150 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="p-4 bg-red-50/50 border-b border-gray-150 flex justify-between items-center">
                    <h3 className="text-xs font-display font-black text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-red-650" />
                      <span>Overdue Reports ({overdueIssues.length})</span>
                    </h3>
                    <span className="bg-red-100 text-red-800 font-bold font-mono px-1.5 py-0.5 rounded-md text-[9px]">CRITICAL</span>
                  </div>
                  <div className="p-4 divide-y divide-gray-100 space-y-3.5 max-h-[22rem] overflow-y-auto">
                    {overdueIssues.length === 0 ? (
                      <p className="text-center py-6 text-gray-400 text-xs">All reports are perfectly on track today.</p>
                    ) : (
                      overdueIssues.map(issue => (
                        <div key={issue.id} className="pt-3 first:pt-0 group">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">{issue.category}</span>
                            <span className="text-[9px] font-mono font-extrabold text-red-600">OVERDUE</span>
                          </div>
                          <h4 
                            onClick={() => navigate('issue-details', { id: issue.id })}
                            className="text-xs font-bold text-gray-900 mt-1 cursor-pointer hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {issue.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 flex items-center">
                            <MapPin size={11} className="mr-0.5 text-gray-450 shrink-0" />
                            <span>{issue.location}</span>
                          </p>
                          <div className="flex gap-2 mt-2.5">
                            <button
                              onClick={() => launchQuickAction(issue, 'timeline')}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                            >
                              Timeline
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => launchQuickAction(issue, 'assign')}
                                  className="text-[10px] font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                                >
                                  Assign
                                </button>
                                <button
                                  onClick={() => launchQuickAction(issue, 'status')}
                                  className="text-[10px] font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                                >
                                  Update Status
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pending Actions Column */}
                <div className="bg-white border border-gray-150 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
                    <h3 className="text-xs font-display font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-gray-650" />
                      <span>Pending Routing / Intake ({pendingAdminIssues.length})</span>
                    </h3>
                  </div>
                  <div className="p-4 divide-y divide-gray-100 space-y-3.5 max-h-[22rem] overflow-y-auto">
                    {pendingAdminIssues.length === 0 ? (
                      <p className="text-center py-6 text-gray-400 text-xs">No pending manual dispatch actions.</p>
                    ) : (
                      pendingAdminIssues.map(issue => (
                        <div key={issue.id} className="pt-3 first:pt-0">
                          <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                            Intake Review Needed
                          </span>
                          <h4 
                            onClick={() => navigate('issue-details', { id: issue.id })}
                            className="text-xs font-bold text-gray-900 mt-1.5 cursor-pointer hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {issue.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 flex items-center">
                            <MapPin size={11} className="mr-0.5 shrink-0" />
                            <span>{issue.location}</span>
                          </p>
                          <div className="flex gap-2 mt-2">
                            {isAdmin ? (
                              <button
                                onClick={() => launchQuickAction(issue, 'assign')}
                                className="text-[10px] bg-blue-600 text-white font-bold px-2 py-1 rounded-md hover:bg-blue-700 cursor-pointer"
                              >
                                Route & Assign Officer
                              </button>
                            ) : (
                              <button
                                onClick={() => launchQuickAction(issue, 'timeline')}
                                className="text-[10px] text-blue-600 font-bold"
                              >
                                View State
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Column 2: HIGH PRIORITY & TRENDING ACTIVE CASES */}
              <div className="space-y-6">
                
                {/* High Priority Issues Column */}
                <div className="bg-white border border-gray-150 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="p-4 bg-orange-50/50 border-b border-gray-150 flex justify-between items-center">
                    <h3 className="text-xs font-display font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield size={14} className="text-orange-650" />
                      <span>Critical / High Priority ({highPriorityIssues.length})</span>
                    </h3>
                  </div>
                  <div className="p-4 divide-y divide-gray-100 space-y-3.5 max-h-[22rem] overflow-y-auto">
                    {highPriorityIssues.length === 0 ? (
                      <p className="text-center py-6 text-gray-400 text-xs">No active high priority cases.</p>
                    ) : (
                      highPriorityIssues.map(issue => (
                        <div key={issue.id} className="pt-3 first:pt-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono font-bold text-orange-600 uppercase tracking-wider">
                              Severity: {issue.severity}
                            </span>
                            <span className="text-[9px] font-mono text-gray-400">
                              Dept: {issue.assignedDepartment.split(' ')[0]}
                            </span>
                          </div>
                          <h4 
                            onClick={() => navigate('issue-details', { id: issue.id })}
                            className="text-xs font-bold text-gray-900 mt-1 cursor-pointer hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {issue.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 leading-relaxed">
                            {issue.description}
                          </p>
                          <div className="flex gap-2 mt-2.5">
                            <button
                              onClick={() => launchQuickAction(issue, 'comment')}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-0.5"
                            >
                              <MessageSquare size={10} />
                              <span>Comment ({issue.comments?.length || 0})</span>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => launchQuickAction(issue, 'status')}
                                className="text-[10px] font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                              >
                                State Update
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Trending Active Cases Column */}
                <div className="bg-white border border-gray-150 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
                    <h3 className="text-xs font-display font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-blue-600" />
                      <span>Community Trending Hub</span>
                    </h3>
                    <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full text-[9px] font-mono">POPULAR</span>
                  </div>
                  <div className="p-4 divide-y divide-gray-100 space-y-3.5 max-h-[22rem] overflow-y-auto">
                    {trendingIssues.length === 0 ? (
                      <p className="text-center py-6 text-gray-400 text-xs">No highly voted complaints currently.</p>
                    ) : (
                      trendingIssues.map(issue => (
                        <div key={issue.id} className="pt-3 first:pt-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono font-bold text-blue-600 uppercase tracking-wider">
                              Category: {issue.category}
                            </span>
                            <span className="text-[9px] font-mono text-gray-400 flex items-center gap-1">
                              👍 {issue.supportedBy?.length || 0} supporters
                            </span>
                          </div>
                          <h4 
                            onClick={() => navigate('issue-details', { id: issue.id })}
                            className="text-xs font-bold text-gray-900 mt-1 cursor-pointer hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {issue.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                            {issue.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => launchQuickAction(issue, 'timeline')}
                              className="text-[10px] text-blue-600 font-bold"
                            >
                              Timeline
                            </button>
                            <button
                              onClick={() => launchQuickAction(issue, 'comment')}
                              className="text-[10px] text-gray-500 hover:text-gray-800 font-bold flex items-center gap-0.5"
                            >
                              <MessageSquare size={10} />
                              <span>Discuss ({issue.comments?.length || 0})</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Column 3: SCHEDULES, ALERTS & RECENT UPDATES */}
              <div className="space-y-6">
                
                {/* Schedules Column */}
                <div className="bg-white border border-gray-150 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
                    <h3 className="text-xs font-display font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-600" />
                      <span>Scheduled Field Inspections</span>
                    </h3>
                  </div>
                  <div className="p-4 divide-y divide-gray-100 space-y-3.5 max-h-[14rem] overflow-y-auto">
                    {upcomingInspections.length === 0 ? (
                      <p className="text-center py-6 text-gray-400 text-xs">No physical assessments or repairs currently scheduled.</p>
                    ) : (
                      upcomingInspections.map(issue => (
                        <div key={issue.id} className="pt-3 first:pt-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded-sm uppercase">
                              {issue.repairScheduledAt ? 'Scheduled Repair' : 'Physical Assessment'}
                            </span>
                            <span className="text-[9px] font-mono text-gray-400 flex items-center">
                              <Clock size={10} className="mr-0.5" />
                              {new Date(issue.repairScheduledAt || issue.inspectionScheduledAt || '').toLocaleDateString()}
                            </span>
                          </div>
                          <h4 
                            onClick={() => navigate('issue-details', { id: issue.id })}
                            className="text-xs font-bold text-gray-900 mt-1.5 cursor-pointer hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {issue.title}
                          </h4>
                          <p className="text-[10px] text-gray-550 mt-1 font-mono">
                            Assigned Lead: {issue.assignedOfficer || 'Supervision dispatch pending'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Notifications and Alerts Feed Column */}
                <div className="bg-white border border-gray-150 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
                    <h3 className="text-xs font-display font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Bell size={14} className="text-blue-600" />
                      <span>Activity Stream</span>
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 max-h-[22rem] overflow-y-auto">
                    {recentNotifications.length === 0 ? (
                      <p className="text-center py-6 text-gray-400 text-xs">No recent activities.</p>
                    ) : (
                      recentNotifications.map(item => (
                        <div key={item.id} className="p-3 bg-gray-50/55 border border-gray-100 rounded-xl">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-[11px] text-gray-950 block">{item.title}</span>
                            <span className="text-[8px] font-mono text-gray-400 whitespace-nowrap">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                            {item.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* Global Quick Actions Modal Launcher Hook */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => { setIsQuickActionOpen(false); setSelectedIssue(null); }}
        issue={selectedIssue}
        initialTab={quickActionType}
      />

    </div>
  );
};
