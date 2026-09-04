import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IssueCard } from '../components/IssueCard';
import { Search, Filter, RefreshCw, Sparkles, SlidersHorizontal, Table, Grid } from 'lucide-react';
import { IssueStatus, IssueSeverity } from '../types';

export const IssueManagementView: React.FC = () => {
  const { issues, navigate } = useApp();

  const visibleIssues = issues.filter(i => !i.isDemoSeed && !i.id.startsWith('issue-seed-'));

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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

  // Apply search and filter logic
  const filteredIssues = visibleIssues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || issue.status === statusFilter;
    const matchesCategory = categoryFilter === '' || issue.category === categoryFilter;
    const matchesSeverity = severityFilter === '' || issue.severity === severityFilter;
    const matchesDept = deptFilter === '' || issue.assignedDepartment === deptFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesSeverity && matchesDept;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setSeverityFilter('');
    setDeptFilter('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">Reported</span>;
      case 'under_review':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Review</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">In Progress</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Resolved</span>;
      case 'paused':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">Paused</span>;
      case 'reopened':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">Reopened</span>;
      case 'closed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-150 text-gray-600 border border-gray-250">Closed</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-850 border border-gray-200">{status}</span>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-gray-500 font-bold';
      case 'medium': return 'text-amber-600 font-bold';
      case 'high': return 'text-orange-600 font-bold';
      case 'critical': return 'text-red-600 font-black animate-pulse';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8 font-sans" id="issue-management-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight">
              Civic Inquiries & Dispatch
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Search complaints, adjust hazard urgencies, and review automatic AI classifications.
            </p>
          </div>

          {/* Toggle view layout */}
          <div className="flex items-center space-x-1.5 bg-gray-200/60 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-450 hover:text-gray-700'}`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-450 hover:text-gray-700'}`}
              title="Table View"
            >
              <Table size={15} />
            </button>
          </div>
        </div>

        {/* Dense Filters panel */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            
            {/* Search Input */}
            <div className="sm:col-span-1">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Search text/reporter
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden"
                  placeholder="ID, Title, Street, Citizen..."
                />
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Dispatch Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden"
              >
                <option value="">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="paused">Investigation Paused</option>
                <option value="reopened">Reopened</option>
                <option value="closed">Closed & Archived</option>
              </select>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Severity Selector */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Urgency/Severity
              </label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Department Selector */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Assigned Team
                </label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {(searchTerm || statusFilter || categoryFilter || severityFilter || deptFilter) && (
                <button
                  onClick={handleResetFilters}
                  className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 cursor-pointer self-end shrink-0"
                  title="Reset filters"
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Content displays */}
        {visibleIssues.length === 0 ? (
          <div className="bg-white border border-gray-150 rounded-2xl p-16 text-center max-w-lg mx-auto shadow-sm">
            <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <SlidersHorizontal size={32} />
            </div>
            <h3 className="font-bold text-gray-950 text-md">No Active Reports Registered</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
              There are currently no active civic complaints logged in the system. As standard citizens submit issues, they will appear here for dispatch and resolution.
            </p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-white border border-gray-150 rounded-2xl p-16 text-center max-w-lg mx-auto">
            <RefreshCw size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="font-bold text-gray-900 text-sm">No Tickets Found</h3>
            <p className="text-xs text-gray-500 mt-1">
              We couldn't find any complaints matching the parameters you defined. Try selecting other filters.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIssues.map(issue => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        ) : (
          /* Table View layout */
          <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-150 text-left text-xs text-gray-500">
                <thead className="bg-gray-50 text-[10px] font-mono text-gray-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4 font-mono">Location</th>
                    <th className="px-6 py-4">Assigned Department</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Report Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredIssues.map((issue) => (
                    <tr 
                      key={issue.id}
                      onClick={() => navigate('issue-details', { id: issue.id })}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-bold text-gray-900">
                        <span className="block font-sans">{issue.title}</span>
                        <span className="block font-mono text-[9px] text-gray-400 uppercase mt-0.5">By {issue.userName}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-650">{issue.category}</td>
                      <td className={`px-6 py-4 uppercase font-mono text-[10px] ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-400 truncate max-w-[150px]">{issue.location}</td>
                      <td className="px-6 py-4 text-gray-650 font-medium">
                        {issue.assignedDepartment.replace('Department', 'Dept')}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(issue.status)}</td>
                      <td className="px-6 py-4 font-mono text-gray-400">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
