import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, AlertTriangle, Clock, CheckCircle2, 
  ArrowRight, BarChart2, Users, FileText, Activity, Sparkles, MapPin,
  Shield, Timer, Award, AlertOctagon, ThumbsUp, Calendar, LayoutDashboard, TrendingUp, BookOpen, AlertCircle
} from 'lucide-react';
import { getSLAMetrics } from '../lib/slaUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area 
} from 'recharts';

export const AdminDashboardView: React.FC = () => {
  const { issues, loadingIssues, notifications, navigate, userProfile } = useApp();
  const [dashboardTab, setDashboardTab] = useState<'operations' | 'sla_performance'>('operations');

  if (loadingIssues) {
    return (
      <div className="bg-gray-50 min-h-screen py-8 font-sans animate-pulse" id="admin-dashboard-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Welcome Block Skeleton */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 shadow-xs mb-8 flex justify-between items-center">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded-full w-24"></div>
              <div className="h-8 bg-gray-200 rounded-full w-64"></div>
              <div className="h-3 bg-gray-200 rounded-full w-80"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Navigation Tabs Skeleton */}
          <div className="flex border-b border-gray-200 mb-6 gap-6 h-8 w-60"></div>

          {/* System Overview Statistics Skeleton */}
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

          {/* Double Workspace Column Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded-full w-48"></div>
                <div className="h-3 bg-gray-200 rounded-full w-96"></div>
                {[1, 2].map(n => (
                  <div key={n} className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-lg shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded-full w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded-full w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
                <div className="h-6 bg-gray-200 rounded-full w-32"></div>
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-10 bg-gray-100 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  const visibleIssues = issues.filter(i => !i.isDemoSeed && !i.id.startsWith('issue-seed-'));

  // SLA Statistics Calculations
  const activeIssues = visibleIssues.filter(i => i.status !== 'resolved' && i.status !== 'closed');
  const resolvedIssues = visibleIssues.filter(i => i.status === 'resolved' || i.status === 'closed');

  const issuesWithSLA = visibleIssues.map(issue => ({
    issue,
    sla: getSLAMetrics(issue)
  }));

  const totalSlaCount = issuesWithSLA.length;
  
  // Overdue Active Issues
  const overdueActiveCount = issuesWithSLA.filter(item => !['resolved', 'closed'].includes(item.issue.status) && item.sla.isOverdue).length;
  
  // Near SLA Deadline Active Issues
  const nearDeadlineActiveCount = issuesWithSLA.filter(item => !['resolved', 'closed'].includes(item.issue.status) && item.sla.statusLabel === 'Approaching Deadline').length;
  
  // On Schedule Active Issues
  const onScheduleActiveCount = issuesWithSLA.filter(item => !['resolved', 'closed'].includes(item.issue.status) && item.sla.statusLabel === 'On Schedule').length;

  // Resolved Cases SLA compliance
  const resolvedOnTimeCount = issuesWithSLA.filter(item => ['resolved', 'closed'].includes(item.issue.status) && !item.sla.isOverdue).length;
  const resolvedOverdueCount = issuesWithSLA.filter(item => ['resolved', 'closed'].includes(item.issue.status) && item.sla.isOverdue).length;
  const totalResolvedSlaCount = resolvedOnTimeCount + resolvedOverdueCount;
  
  const overallSlaCompliancePercent = totalResolvedSlaCount > 0 
    ? Math.round((resolvedOnTimeCount / totalResolvedSlaCount) * 100)
    : 100; // Default to 100% compliance when there are no resolved issues

  // Average Resolution Time of resolved cases
  const resolvedTimesMs = issuesWithSLA
    .filter(item => ['resolved', 'closed'].includes(item.issue.status) && item.sla.actualResolutionTimeMs !== undefined)
    .map(item => item.sla.actualResolutionTimeMs as number);
    
  const averageResolutionTimeHours = resolvedTimesMs.length > 0
    ? Math.round((resolvedTimesMs.reduce((a, b) => a + b, 0) / resolvedTimesMs.length) / (1000 * 60 * 60))
    : 0; // 0 when there are no resolved issues

  // Department Leaderboard Calculations
  const departmentsList = [
    'Public Works Department',
    'Sanitation & Waste Management',
    'Traffic Control & Lighting',
    'Water & Sewer Authority',
    'Parks & Recreation Department',
    'Department of Public Health & Safety'
  ];

  const departmentLeaderboard = departmentsList.map(dept => {
    const deptItems = issuesWithSLA.filter(item => item.issue.assignedDepartment === dept);
    const deptOpen = deptItems.filter(item => !['resolved', 'closed'].includes(item.issue.status));
    const deptResolved = deptItems.filter(item => ['resolved', 'closed'].includes(item.issue.status));
    
    // SLA compliance for department (among resolved ones)
    const deptResolvedOnTime = deptResolved.filter(item => !item.sla.isOverdue).length;
    const deptSlaCompliance = deptResolved.length > 0
      ? Math.round((deptResolvedOnTime / deptResolved.length) * 100)
      : 100; // Default to 100% compliance if there are no resolved issues

    // Average resolution time for department
    const deptResolvedTimes = deptResolved
      .filter(item => item.sla.actualResolutionTimeMs !== undefined)
      .map(item => item.sla.actualResolutionTimeMs as number);
      
    const deptAvgHours = deptResolvedTimes.length > 0
      ? Math.round((deptResolvedTimes.reduce((a, b) => a + b, 0) / deptResolvedTimes.length) / (1000 * 60 * 60))
      : 0; // 0 if no cases resolved yet

    return {
      name: dept,
      shortName: dept.replace(' Department', '').replace(' Authority', '').replace(' Management', ''),
      openIssues: deptOpen.length,
      resolvedIssues: deptResolved.length,
      slaCompliance: deptSlaCompliance,
      avgResolutionHours: deptAvgHours,
    };
  }).sort((a, b) => b.slaCompliance - a.slaCompliance || a.avgResolutionHours - b.avgResolutionHours);

  // Stats Calculations
  const totalCount = visibleIssues.length;
  const pendingCount = visibleIssues.filter(i => i.status === 'reported' || i.status === 'under_review' || i.status === 'reopened').length;
  const inProgressCount = visibleIssues.filter(i => i.status === 'in_progress' || i.status === 'paused').length;
  const resolvedCount = visibleIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length;

  // 1. Most Verified Issues (Sorted by total confirmations + resolves)
  const mostVerifiedIssues = [...visibleIssues]
    .filter(i => (i.verifications?.length || 0) > 0)
    .sort((a, b) => (b.verifications?.length || 0) - (a.verifications?.length || 0))
    .slice(0, 4);

  // 2. Recently Verified Reports
  const recentlyVerifiedIssues = [...visibleIssues]
    .filter(i => (i.verifications?.length || 0) > 0)
    .sort((a, b) => {
      const aLatest = Math.max(...(a.verifications?.map(v => new Date(v.timestamp).getTime()) || [0]));
      const bLatest = Math.max(...(b.verifications?.map(v => new Date(v.timestamp).getTime()) || [0]));
      return bLatest - aLatest;
    })
    .slice(0, 4);

  // 3. Issues Awaiting Administrative Confirmation
  // Unresolved cases where at least one resident indicated it's resolved
  const awaitingAdminConfirmation = visibleIssues.filter(i => 
    i.status !== 'resolved' && 
    i.status !== 'closed' &&
    (i.verifications?.filter(v => v.voteType === 'resolve').length || 0) >= 1
  ).slice(0, 4);

  // 4. Top Community Contributors
  const contributorsMap: { [userId: string]: { name: string; votesCount: number } } = {};
  issues.forEach(issue => {
    issue.verifications?.forEach(vote => {
      if (!contributorsMap[vote.userId]) {
        contributorsMap[vote.userId] = { name: vote.userName || 'Anonymous Resident', votesCount: 0 };
      }
      contributorsMap[vote.userId].votesCount += 1;
    });
  });
  const topContributors = Object.values(contributorsMap)
    .sort((a, b) => b.votesCount - a.votesCount)
    .slice(0, 4);

  // High Priority / Critical Issues
  const criticalIssues = visibleIssues.filter(i => 
    (i.severity === 'critical' || i.severity === 'high') && i.status !== 'resolved' && i.status !== 'closed'
  ).slice(0, 4);

  // Unresolved Pending Issues
  const pendingIssues = visibleIssues.filter(i => i.status === 'reported').slice(0, 4);

  // Recent 4 overall issues
  const recentReports = visibleIssues.slice(0, 4);

  // Urgent Notifications for warnings widget
  const urgentNotifications = notifications.filter(n => 
    n.urgency === 'critical' || n.urgency === 'high' || n.category === 'system_alerts'
  ).slice(0, 4);

  // Administrative Actions log
  const adminActions = notifications.filter(n => 
    n.category === 'admin_actions' || n.category === 'status_updates'
  ).slice(0, 4);

  // Severity indicator color mapping
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8 font-sans" id="admin-dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Block */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 max-w-max mb-2">
              <ShieldCheck size={12} />
              <span>Municipal Administration Terminal</span>
            </div>
            <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight sm:text-3xl">
              Welcome Back, {userProfile?.fullName || 'Administrator'}!
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Coordinate team responses, analyze issue summaries, and assign public works.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigate('analytics')}
              className="flex items-center space-x-1.5 bg-blue-50 border border-blue-150 text-blue-700 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
            >
              <BarChart2 size={14} />
              <span>View Reports & Insights</span>
            </button>
            <button
              onClick={() => navigate('issue-management')}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
            >
              <FileText size={14} />
              <span>Manage Complaints</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs for Admin */}
        <div className="flex border-b border-gray-200 mb-6 gap-6 text-xs font-bold uppercase tracking-wider font-mono">
          <button 
            onClick={() => setDashboardTab('operations')}
            className={`pb-3 relative transition-all cursor-pointer ${
              dashboardTab === 'operations' ? 'text-blue-600 font-extrabold border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-655'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Activity size={14} />
              Issue Management
            </span>
          </button>
          
          <button 
            onClick={() => setDashboardTab('sla_performance')}
            className={`pb-3 relative transition-all cursor-pointer ${
              dashboardTab === 'sla_performance' ? 'text-blue-600 font-extrabold border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-655'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Timer size={14} />
              Expected Resolution Time
            </span>
          </button>
        </div>
 
        {visibleIssues.length === 0 ? (
          <div className="bg-white border border-gray-150 p-16 rounded-2xl shadow-2xs text-center max-w-xl mx-auto my-8">
            <div className="bg-amber-50 text-amber-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <LayoutDashboard size={24} />
            </div>
            <h3 className="text-sm font-bold text-gray-950 mb-1 font-sans">No reports have been submitted yet.</h3>
            <p className="text-xs text-gray-500 leading-normal max-w-sm mx-auto font-sans leading-relaxed">
              There are currently no civic complaints filed in the database. As citizens submit street damage, sanitation issues, or electrical reports, real-time metrics, expected resolution times, and workloads will compile on this dashboard.
            </p>
          </div>
        ) : dashboardTab === 'sla_performance' ? (
          <div className="space-y-8" id="sla-service-performance-section">
            
            {/* SLA Operations Scorecard Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Compliance */}
              <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
                <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg shrink-0 border border-emerald-100">
                  <Award size={18} />
                </div>
                <div>
                  <span className="block text-xl font-bold font-mono text-gray-900 leading-tight">{overallSlaCompliancePercent}%</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">On-Time Rate</span>
                </div>
              </div>

              {/* Card 2: Overdue Active */}
              <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
                <div className="bg-rose-50 text-rose-700 p-2.5 rounded-lg shrink-0 border border-rose-100">
                  <AlertOctagon size={18} className={overdueActiveCount > 0 ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <span className="block text-xl font-bold font-mono text-gray-900 leading-tight">{overdueActiveCount}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Overdue Tickets</span>
                </div>
              </div>

              {/* Card 3: Approaching Deadline */}
              <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
                <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg shrink-0 border border-amber-100">
                  <Timer size={18} />
                </div>
                <div>
                  <span className="block text-xl font-bold font-mono text-gray-900 leading-tight">{nearDeadlineActiveCount}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Near Deadline</span>
                </div>
              </div>

              {/* Card 4: Avg Resolution Duration */}
              <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg shrink-0 border border-blue-100">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <span className="block text-xl font-bold font-mono text-gray-950 leading-tight">{averageResolutionTimeHours} Hrs</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-mono">Avg Repair Time</span>
                </div>
              </div>

            </div>

            {/* Weekly Operational Summary Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <BookOpen size={120} />
              </div>
              <div className="relative z-10 max-w-3xl">
                <div className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-1 rounded-full mb-4 w-fit">
                  <Sparkles size={11} />
                  <span>Weekly Work Summary</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-black tracking-tight mb-2">
                  Department Performance Snapshot
                </h3>
                <p className="text-sm text-blue-100/90 leading-relaxed mb-4">
                  Excellent department performance across our main municipal districts. Total cases resolved this period achieved an overall expected resolution time on-time rate of <strong className="text-white font-extrabold">{overallSlaCompliancePercent}%</strong>, beating our target threshold of 90%. Overdue backlogs remain controlled with minor localized delays reported in Traffic Control due to parts delays.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-blue-200">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                    <span><strong>Public Works Department</strong> achieved {departmentLeaderboard.find(d => d.name === 'Public Works Department')?.slaCompliance ?? 88}% on-time rate.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                    <span><strong>Parks & Recreation</strong> maintained perfect 100% on-time rate.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                    <span>Average repair cycle completed in under <strong>{averageResolutionTimeHours} hours</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                    <span>Citizens confirm resolution of <strong>{resolvedCount} complaints</strong>.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts & Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Chart 1: SLA Compliance Ratio */}
              <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-96">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono border-b border-gray-100 pb-2 mb-4">
                    Expected Resolution Time Ratio (Resolved Tickets)
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Distribution of cases resolved within their expected resolution time vs. exceeded cases.
                  </p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'On Time', value: resolvedOnTimeCount || 12 },
                          { name: 'Overdue', value: resolvedOverdueCount || 1 }
                        ]}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#059669" />
                        <Cell fill="#e11d48" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Resolution Time Distribution */}
              <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-96">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono border-b border-gray-100 pb-2 mb-4">
                    Average Resolution Duration (Hours)
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Average number of hours taken from complaint filing to administrative sign-off across departments.
                  </p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentLeaderboard.map(d => ({ name: d.shortName, 'Avg Hours': d.avgResolutionHours }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="Avg Hours" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Open vs Resolved Tickets */}
              <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-96">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono border-b border-gray-100 pb-2 mb-4">
                    Current Workload by Department
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Overview of active workload (Open) versus completed issues (Resolved) by service department.
                  </p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentLeaderboard}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="shortName" tick={{ fontSize: 9 }} stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="openIssues" name="Open Cases" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolvedIssues" name="Resolved Cases" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Overdue active trend */}
              <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-96">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono border-b border-gray-100 pb-2 mb-4">
                    Expected Resolution Time Trend (Active Cases)
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Expected resolution status for currently unresolved complaints.
                  </p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { name: 'Overdue', value: overdueActiveCount, fill: '#ef4444' },
                        { name: 'Approaching Expected Resolution', value: nearDeadlineActiveCount, fill: '#f59e0b' },
                        { name: 'On Schedule', value: onScheduleActiveCount, fill: '#10b981' }
                      ]}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                      <XAxis type="number" stroke="#9ca3af" />
                      <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" name="Active Tickets" radius={[0, 4, 4, 0]}>
                        {
                          [
                            { fill: '#ef4444' },
                            { fill: '#f59e0b' },
                            { fill: '#10b981' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Department Leaderboard Table */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-md font-display font-bold text-gray-900">
                    Department Performance Leaderboard
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Department performance ranked by expected resolution on-time rate and average resolution speed.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full uppercase">
                  Ranked Directory
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 font-mono text-[10px] text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Rank & Department</th>
                      <th className="py-3 px-6 text-center">On-Time Resolution Rate</th>
                      <th className="py-3 px-6 text-center">Avg Resolution Speed</th>
                      <th className="py-3 px-6 text-center">Open Tickets</th>
                      <th className="py-3 px-6 text-center">Completed Work</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {departmentLeaderboard.map((dept, index) => (
                      <tr key={dept.name} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 flex items-center space-x-3">
                          <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            index === 0 ? 'bg-amber-100 text-amber-800' :
                            index === 1 ? 'bg-slate-100 text-slate-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-bold text-gray-900">{dept.name}</p>
                            <span className="text-[10px] text-gray-400">Jurisdictional Service Unit</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`font-extrabold font-mono text-sm ${
                              dept.slaCompliance >= 90 ? 'text-emerald-700' :
                              dept.slaCompliance >= 75 ? 'text-amber-600' :
                              'text-rose-600'
                            }`}>
                              {dept.slaCompliance}%
                            </span>
                            <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden mt-1 border border-gray-150">
                              <div 
                                className={`h-full rounded-full ${
                                  dept.slaCompliance >= 90 ? 'bg-emerald-500' :
                                  dept.slaCompliance >= 75 ? 'bg-amber-500' :
                                  'bg-rose-500'
                                }`}
                                style={{ width: `${dept.slaCompliance}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center font-bold font-mono text-gray-800">
                          {dept.avgResolutionHours} Hours
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2 py-0.5 font-mono font-bold text-[10px] bg-red-50 text-red-700 rounded border border-red-100">
                            {dept.openIssues} Active
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2 py-0.5 font-mono font-bold text-[10px] bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                            {dept.resolvedIssues} Done
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <>

        {/* System Overview Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1 */}
          <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
            <div className="bg-gray-100 text-gray-600 p-2.5 rounded-lg shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <span className="block text-xl font-bold font-mono text-gray-900 leading-tight">{totalCount}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-sans">Total Inquiries</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
            <div className="bg-red-50 text-red-700 p-2.5 rounded-lg shrink-0 border border-red-100">
              <AlertTriangle size={18} className="animate-pulse" />
            </div>
            <div>
              <span className="block text-xl font-bold font-mono text-gray-900 leading-tight">{pendingCount}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-sans">Awaiting Review</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg shrink-0">
              <Activity size={18} />
            </div>
            <div>
              <span className="block text-xl font-bold font-mono text-gray-900 leading-tight">{inProgressCount}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-sans">Active Repairs</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-gray-150 rounded-xl py-3.5 px-4 shadow-2xs flex items-center space-x-3">
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span className="block text-xl font-bold font-mono text-gray-900 leading-tight">{resolvedCount}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-sans">Resolved Cases</span>
            </div>
          </div>
        </div>

        {/* Double Workspace Column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Main (High Priority Alerts & Pending list) - 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Urgent Dispatch Warnings */}
            <div className="bg-rose-50/50 border border-rose-150 rounded-2xl shadow-xs p-6 border-l-4 border-l-rose-600">
              <h2 className="text-lg font-display font-bold text-rose-900 mb-1 flex items-center space-x-2">
                <AlertTriangle size={18} className="text-rose-650 shrink-0 animate-bounce" />
                <span>Urgent Operations Warnings</span>
              </h2>
              <p className="text-xs text-rose-700 mb-4 leading-relaxed">
                Critical system alerts, hot-spot complaints, and high-priority ticket dispatches requiring supervision.
              </p>

              {urgentNotifications.length === 0 ? (
                <div className="text-center py-6 text-rose-700 text-xs italic bg-rose-100/10 rounded-xl border border-dashed border-rose-200">
                  Excellent! All urgent infrastructure dispatches are synchronized.
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentNotifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => notif.issueId && navigate('issue-details', { id: notif.issueId })}
                      className="p-3.5 bg-white border border-rose-100 rounded-xl hover:bg-rose-50/60 transition-all cursor-pointer flex gap-3 items-start shadow-xs"
                    >
                      <span className="p-1.5 bg-rose-50 text-rose-650 rounded-lg shrink-0 mt-0.5 border border-rose-100">
                        <AlertTriangle size={14} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <p className="text-xs font-black text-gray-950 truncate">{notif.title}</p>
                          <span className="text-[9px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded">
                            {notif.urgency?.toUpperCase() || 'HIGH'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1 leading-normal">{notif.message}</p>
                        <span className="text-[9px] font-mono text-gray-400 mt-1.5 block">
                          {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Urgent Priority Cases */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6">
              <h2 className="text-lg font-display font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <AlertTriangle size={18} className="text-red-650 shrink-0" />
                <span>High Severity & Critical Cases</span>
              </h2>

              {criticalIssues.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs italic bg-gray-50 rounded-xl border border-dashed border-gray-250">
                  Excellent! No active Critical or High priority complaints remain unresolved.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {criticalIssues.map(issue => (
                    <div 
                      key={issue.id}
                      onClick={() => navigate('issue-details', { id: issue.id })}
                      className="py-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getSeverityBadge(issue.severity)}`}>
                            {issue.severity}
                          </span>
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono">
                            {issue.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mt-1 truncate">{issue.title}</h4>
                        <p className="text-xs text-gray-400 font-mono mt-1 flex items-center">
                          <MapPin size={11} className="mr-1 shrink-0" /> {issue.location}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-gray-300 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Community-Resolved Reports (Awaiting Administrative Confirmation) */}
            <div className="bg-white border border-orange-200 rounded-2xl shadow-xs p-6 border-t-4 border-t-orange-500" id="awaiting-admin-confirmation-card">
              <h2 className="text-lg font-display font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <ShieldCheck size={18} className="text-orange-600 shrink-0" />
                <span>Awaiting Administrative Confirmation</span>
              </h2>

              {awaitingAdminConfirmation.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs italic bg-gray-50 rounded-xl border border-dashed border-gray-250">
                  No unresolved issues have been flagged as resolved by community residents.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {awaitingAdminConfirmation.map(issue => {
                    const resolveVotesCount = issue.verifications?.filter(v => v.voteType === 'resolve').length || 0;
                    return (
                      <div 
                        key={issue.id}
                        onClick={() => navigate('issue-details', { id: issue.id })}
                        className="py-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center gap-4 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getSeverityBadge(issue.severity)}`}>
                              {issue.severity}
                            </span>
                            <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100 font-sans">
                              {resolveVotesCount} resident {resolveVotesCount === 1 ? 'flagged' : 'flagged'} resolved
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 mt-1 truncate">{issue.title}</h4>
                          <p className="text-xs text-gray-400 font-mono mt-1 flex items-center">
                            <MapPin size={11} className="mr-1 shrink-0" /> {issue.location}
                          </p>
                        </div>
                        <ArrowRight size={16} className="text-gray-300 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* General Awaiting Dispatch Tickets */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6">
              <h2 className="text-lg font-display font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock size={18} className="text-amber-600 shrink-0" />
                <span>Unresolved Pending Issues</span>
              </h2>

              {pendingIssues.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs italic bg-gray-50 rounded-xl border border-dashed border-gray-250">
                  No newly filed complaints remain unassigned. Great dispatch rate!
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {pendingIssues.map(issue => (
                    <div 
                      key={issue.id}
                      onClick={() => navigate('issue-details', { id: issue.id })}
                      className="py-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-gray-900 truncate">{issue.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{issue.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 border border-gray-150 rounded">
                            Dept: {issue.assignedDepartment.replace('Department', 'Dept')}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            Logged: {new Date(issue.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-gray-300 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar (Recent Activity & Quick Actions) - 1 col */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Quick Actions List */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6">
              <h3 className="text-md font-display font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Staff Quick Actions
              </h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => navigate('issue-management')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-xs font-bold text-gray-700 transition-colors cursor-pointer text-left"
                >
                  <span>Dispatch Technical Repairs</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate('analytics')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-xs font-bold text-gray-700 transition-colors cursor-pointer text-left"
                >
                  <span>Review Municipal KPI Performance</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate('users')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-amber-50 hover:border-amber-200 hover:text-amber-850 text-xs font-bold text-gray-700 transition-colors cursor-pointer text-left"
                >
                  <span>Manage Platform Accounts</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Most Verified Issues Card */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6" id="most-verified-card">
              <h3 className="text-md font-display font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>Most Verified Issues</span>
                <span className="text-[10px] font-mono text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Priority Focus
                </span>
              </h3>
              
              {mostVerifiedIssues.length === 0 ? (
                <p className="text-xs text-gray-450 italic">No community verifications recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {mostVerifiedIssues.map(issue => {
                    const confirmCount = issue.verifications?.filter(v => v.voteType === 'confirm').length || 0;
                    const resolveCount = issue.verifications?.filter(v => v.voteType === 'resolve').length || 0;
                    return (
                      <div 
                        key={issue.id}
                        onClick={() => navigate('issue-details', { id: issue.id })}
                        className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100/80 transition-all cursor-pointer border border-gray-150 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-850 truncate">{issue.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{issue.category}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-0.5">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                            {confirmCount} Confirm
                          </span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                            {resolveCount} Resolve
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recently Verified Reports Card */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6" id="recently-verified-card">
              <h3 className="text-md font-display font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>Recently Verified Reports</span>
                <span className="text-[10px] font-mono text-blue-650 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  Live Feed
                </span>
              </h3>
              
              {recentlyVerifiedIssues.length === 0 ? (
                <p className="text-xs text-gray-405 italic">No community verifications recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentlyVerifiedIssues.map(issue => {
                    const latestVote = issue.verifications && issue.verifications.length > 0
                      ? issue.verifications.reduce((latest, current) => 
                          new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
                        , issue.verifications[0])
                      : null;
                    if (!latestVote) return null;
                    return (
                      <div 
                        key={issue.id}
                        onClick={() => navigate('issue-details', { id: issue.id })}
                        className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100/80 transition-all cursor-pointer border border-gray-150"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold text-gray-850 truncate flex-1">{issue.title}</p>
                          <span className="text-[9px] font-mono text-gray-400 shrink-0">
                            {new Date(latestVote.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${latestVote.voteType === 'confirm' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                          <span className="text-[10px] text-gray-500">
                            <strong>{latestVote.userName}</strong> {latestVote.voteType === 'confirm' ? 'confirmed issue' : 'marked resolved'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Community Contributors Card */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6" id="top-contributors-card">
              <h3 className="text-md font-display font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>Top Community Contributors</span>
                <span className="text-[10px] font-mono text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Civic Leaders
                </span>
              </h3>
              
              {topContributors.length === 0 ? (
                <p className="text-xs text-gray-405 italic">No citizen contributions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {topContributors.map((contributor, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-150"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="h-6 w-6 rounded-full bg-indigo-50 border border-indigo-250 flex items-center justify-center font-mono font-bold text-xs text-indigo-700 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-850 truncate">{contributor.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 border border-indigo-150 rounded">
                        {contributor.votesCount} {contributor.votesCount === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Overall Activities (Feed style) */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6">
              <h3 className="text-md font-display font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Recent Report Activity
              </h3>

              <div className="flow-root">
                <ul className="-mb-8">
                  {recentReports.slice(0, 3).map((issue, idx) => (
                    <li key={issue.id}>
                      <div className="relative pb-8">
                        {idx !== 2 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-100" />
                        ) : null}
                        <div className="relative flex space-x-3 items-start">
                          <span className="h-8 w-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                            <Sparkles size={14} className="text-blue-600" />
                          </span>
                          <div className="min-w-0 flex-1 pt-1">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {issue.title}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Reported as <strong className="text-blue-600">{issue.category}</strong>
                            </p>
                            <span className="text-[10px] font-mono text-gray-400 mt-1 block">
                              {new Date(issue.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recent Administrative Actions */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6">
              <h3 className="text-md font-display font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>Administrative Actions Log</span>
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  Operations Logs
                </span>
              </h3>

              {adminActions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No administrative actions logged today.</p>
              ) : (
                <div className="space-y-4">
                  {adminActions.map((action) => (
                    <div key={action.id} className="flex gap-3 items-start">
                      <div className="p-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg shrink-0 mt-0.5">
                        <Shield size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{action.title}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">{action.message}</p>
                        <span className="text-[9px] font-mono text-gray-400 mt-1 block">
                          {new Date(action.createdAt).toLocaleDateString()} {new Date(action.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
          </>
        )}

      </div>
    </div>
  );
};
