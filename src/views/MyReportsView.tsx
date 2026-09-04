import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IssueCard } from '../components/IssueCard';
import { Search, Filter, RefreshCw, FileText, PlusCircle } from 'lucide-react';
import { IssueStatus, IssueSeverity } from '../types';

export const MyReportsView: React.FC = () => {
  const { issues, loadingIssues, currentUser, navigate } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');

  // Filter issues reported by current citizen
  const citizenIssues = issues.filter(issue => issue.userId === currentUser?.uid);

  // Apply filters
  const filteredIssues = citizenIssues.filter(issue => {
    const matchesSearch = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === '' || issue.status === statusFilter;
    const matchesCategory = categoryFilter === '' || issue.category === categoryFilter;
    const matchesSeverity = severityFilter === '' || issue.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesSeverity;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setSeverityFilter('');
  };

  const categories = [
    'Road Damage',
    'Sanitation & Waste',
    'Streetlights & Electricity',
    'Water & Sewer',
    'Parks & Recreation',
    'Public Health & Safety',
    'Other'
  ];

  if (loadingIssues) {
    return (
      <div className="bg-gray-50 min-h-screen py-8 font-sans animate-pulse" id="my-reports-view-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <div className="h-7 bg-gray-200 rounded-full w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-full w-80"></div>
            </div>
            <div className="h-9 bg-gray-200 rounded-xl w-32"></div>
          </div>

          {/* Search & Filter Toolbar Skeleton */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs mb-8 h-20"></div>

          {/* Skeletons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs h-[420px] flex flex-col justify-between p-5 space-y-4">
                <div className="h-44 bg-gray-100 rounded-xl animate-pulse"></div>
                <div className="flex-1 space-y-4 mt-2">
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
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8" id="my-reports-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight">
              My Civic Reports
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and track all the community issues you've reported.
            </p>
          </div>
          <button
            onClick={() => navigate('report-issue')}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow-xs text-xs cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Report New Issue</span>
          </button>
        </div>

        {citizenIssues.length === 0 ? (
          <div className="bg-white border border-gray-150 rounded-2xl p-16 text-center max-w-xl mx-auto shadow-xs flex flex-col items-center my-8">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-6">
              <FileText size={48} className="stroke-1.5" />
            </div>
            <h3 className="font-display font-bold text-gray-900 text-lg">No Reports Submitted Yet</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-md">
              You haven't reported any civic issues to the municipality yet. Be the eyes of your community and help keep our city clean, safe, and efficient.
            </p>
            <button
              onClick={() => navigate('report-issue')}
              className="mt-6 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md text-sm transition-all cursor-pointer"
            >
              <PlusCircle size={16} />
              <span>Report Your First Issue</span>
            </button>
          </div>
        ) : (
          <>
            {/* Search & Filter Toolbar */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                
                {/* Search Input */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 font-mono">
                    Search Complaints
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Title, description, address..."
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 font-mono">
                    Status
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
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 font-mono">
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

                {/* Urgency Filter / Reset */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 font-mono">
                      Severity
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

                  {(searchTerm || statusFilter || categoryFilter || severityFilter) && (
                    <button
                      onClick={handleResetFilters}
                      className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 cursor-pointer self-end shrink-0 flex items-center justify-center"
                      title="Reset Filters"
                    >
                      <RefreshCw size={13} />
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Results */}
            {filteredIssues.length === 0 ? (
              <div className="bg-white border border-gray-150 rounded-2xl p-16 text-center max-w-lg mx-auto shadow-xs">
                <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-900 text-sm">No Matching Reports</h3>
                <p className="text-xs text-gray-500 mt-1 leading-normal">
                  We couldn't find any issues matching your search filters. Try clearing some metrics.
                </p>
                {(searchTerm || statusFilter || categoryFilter || severityFilter) && (
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 bg-blue-600 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIssues.map(issue => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
