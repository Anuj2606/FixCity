import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, MapPin, Calendar, Clock, Sparkles, AlertTriangle, FileText,
  Send, User, CheckCircle2, ChevronRight, CornerDownRight, ShieldCheck, RefreshCw,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { IssueStatus, IssueSeverity } from '../types';
import { getSLAMetrics } from '../lib/slaUtils';
import { Timer, AlertOctagon, TrendingUp, ShieldAlert } from 'lucide-react';

export const ReportDetailsView: React.FC = () => {
  const { 
    currentRoute, 
    issues, 
    userProfile, 
    currentUser,
    addComment, 
    updateIssueStatus, 
    updateIssueAdminDetails, 
    verifyIssue,
    mergeIssues,
    executeWorkflowAction,
    navigate 
  } = useApp();

  const issueId = currentRoute.params?.id;
  const issue = issues.find(i => i.id === issueId);

  // Form states
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Reasoning collapsible panel
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  // Admin and Operations Workflow states
  const [adminTab, setAdminTab] = useState<'assign' | 'schedule' | 'resolve' | 'govern'>('assign');
  const [adminStatus, setAdminStatus] = useState<IssueStatus>('reported');
  const [adminDept, setAdminDept] = useState('');
  const [adminSeverity, setAdminSeverity] = useState<IssueSeverity>('medium');
  const [adminStatusComment, setAdminStatusComment] = useState('');
  const [adminUpdating, setAdminUpdating] = useState(false);

  const [adminOfficer, setAdminOfficer] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [repairDate, setRepairDate] = useState('');
  const [infoRequest, setInfoRequest] = useState('');
  const [pauseReason, setPauseReason] = useState('');

  // Resolution Evidence States
  const [repairSummary, setRepairSummary] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Citizen Feedback States
  const [citizenFeedback, setCitizenFeedback] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  // Haversine / Distance calculation for Nearby prompt
  const [isNearby, setIsNearby] = useState<boolean | null>(null);

  // Sync admin states when issue loads
  React.useEffect(() => {
    if (issue) {
      setAdminStatus(issue.status);
      setAdminDept(issue.assignedDepartment);
      setAdminSeverity(issue.severity);
      setAdminOfficer(issue.assignedOfficer || '');
      setInspectionDate(issue.inspectionScheduledAt ? new Date(issue.inspectionScheduledAt).toISOString().split('T')[0] : '');
      setRepairDate(issue.repairScheduledAt ? new Date(issue.repairScheduledAt).toISOString().split('T')[0] : '');
      setCompletionDate(issue.resolvedAt ? new Date(issue.resolvedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setRepairSummary(issue.resolutionSummary || '');
      setCompletionNotes(issue.resolutionNotes || '');
      setUploadedPhotos(issue.resolutionPhotos || []);
    }
  }, [issue]);

  React.useEffect(() => {
    if (!issue) return;
    const coordRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const match = issue.location.match(coordRegex);
    if (!match) return;

    const issueLat = parseFloat(match[1]);
    const issueLng = parseFloat(match[2]);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          const dLat = userLat - issueLat;
          const dLng = (userLng - issueLng) * Math.cos(userLat * Math.PI / 180);
          const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;

          setIsNearby(distanceKm <= 1.0); // Within 1 km
        },
        (err) => {
          console.warn("Geolocation warning:", err);
        }
      );
    }
  }, [issue]);

  const formatTimeAgo = (timestampStr?: string) => {
    if (!timestampStr) return '';
    const date = new Date(timestampStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!issue) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 font-display">Complaint Report Not Found</h2>
        <p className="text-xs text-gray-500 mt-2">The requested issue report does not exist or has been archived.</p>
        <button
          onClick={() => navigate(userProfile?.role === 'admin' ? 'admin-dashboard' : 'dashboard')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Calculations for community verifications
  const verifications = issue.verifications || [];
  const confirmCount = verifications.filter(v => v.voteType === 'confirm').length;
  const resolveCount = verifications.filter(v => v.voteType === 'resolve').length;
  const userVote = verifications.find(v => v.userId === currentUser?.uid);
  
  // Find latest verification timestamp
  const latestVerification = verifications.length > 0
    ? verifications.reduce((latest, current) => 
        new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
      , verifications[0])
    : null;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || commentLoading) return;

    setCommentLoading(true);
    try {
      await addComment(issue.id, newComment);
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAdminWorkflowAction = async (
    actionType: 
      | 'assign_department'
      | 'assign_officer'
      | 'schedule_inspection'
      | 'schedule_repair'
      | 'request_additional_info'
      | 'pause_investigation'
      | 'resume_investigation'
      | 'resolve_issue'
      | 'reopen_issue'
      | 'close_issue'
  ) => {
    if (!issue || adminUpdating) return;
    setAdminUpdating(true);
    try {
      const params: any = {};
      switch (actionType) {
        case 'assign_department':
          params.department = adminDept;
          break;
        case 'assign_officer':
          params.officerName = adminOfficer || 'Inspector Davis';
          break;
        case 'schedule_inspection':
          params.inspectionDate = inspectionDate || new Date().toISOString();
          break;
        case 'schedule_repair':
          params.repairDate = repairDate || new Date().toISOString();
          break;
        case 'request_additional_info':
          params.infoRequestNotes = infoRequest || 'Please provide more details.';
          break;
        case 'pause_investigation':
          params.pauseReason = pauseReason || 'Awaiting permits or parts.';
          break;
        case 'resolve_issue':
          params.resolutionSummary = repairSummary || 'Completed infrastructure repair';
          params.resolutionNotes = completionNotes || 'All work conforms to safety and engineering rules.';
          params.resolutionPhotos = uploadedPhotos.length > 0 ? uploadedPhotos : ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=500&q=80'];
          break;
        default:
          break;
      }
      
      await executeWorkflowAction(issue.id, actionType, params);
      
      // Clear specific input fields after action success
      if (actionType === 'assign_officer') setAdminOfficer('');
      if (actionType === 'request_additional_info') setInfoRequest('');
      if (actionType === 'pause_investigation') setPauseReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setAdminUpdating(false);
    }
  };

  const handleCitizenConfirm = async () => {
    if (!issue || isReviewSubmitting) return;
    setIsReviewSubmitting(true);
    try {
      await executeWorkflowAction(issue.id, 'citizen_confirm', {
        citizenReviewNotes: citizenFeedback || 'Resident confirmed successful resolution.'
      });
      setCitizenFeedback('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const handleCitizenReopen = async () => {
    if (!issue || isReviewSubmitting) return;
    setIsReviewSubmitting(true);
    try {
      await executeWorkflowAction(issue.id, 'citizen_reopen', {
        citizenReviewNotes: citizenFeedback || 'Resident rejected resolution and requested re-evaluation.'
      });
      setCitizenFeedback('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  // Drag and drop photo upload simulation
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
            Reported
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
            Under Review
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <span className="h-2 w-2 rounded-full bg-indigo-600 mr-2 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-600 mr-2"></span>
            Resolved (Review Required)
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
            Investigation Paused
          </span>
        );
      case 'reopened':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="h-2 w-2 rounded-full bg-rose-600 mr-2 animate-pulse"></span>
            Reopened
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-150 text-gray-600 border border-gray-250">
            <span className="h-2 w-2 rounded-full bg-gray-500 mr-2"></span>
            Closed & Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-800 border border-gray-200">
            {status.toUpperCase().replace('_', ' ')}
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <span className="text-xs font-bold text-gray-500 uppercase font-mono">Low Priority</span>;
      case 'medium':
        return <span className="text-xs font-bold text-amber-600 uppercase font-mono">Medium Priority</span>;
      case 'high':
        return <span className="text-xs font-bold text-orange-600 uppercase font-mono">High Priority</span>;
      case 'critical':
        return (
          <span className="text-xs font-bold text-red-650 uppercase font-mono flex items-center gap-1">
            <AlertTriangle size={14} className="animate-bounce" />
            Critical Threat
          </span>
        );
      default:
        return null;
    }
  };

  const departmentChoices = [
    'Public Works Department',
    'Sanitation & Waste Management',
    'Traffic Control & Lighting',
    'Water & Sewer Authority',
    'Parks & Recreation Department',
    'Department of Public Health & Safety'
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-8 font-sans" id={`report-details-${issue.id}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Back button */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(userProfile?.role === 'admin' ? 'admin-dashboard' : 'dashboard')}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-600 font-semibold cursor-pointer max-w-max transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => navigate('community-map', { highlightIssueId: issue.id })}
              className="flex items-center space-x-1.5 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-150 transition-all font-bold cursor-pointer"
            >
              <MapPin size={13} />
              <span>View on Map</span>
            </button>
          </div>
          
          <div className="text-xs font-mono text-gray-400">
            Report ID: <span className="text-gray-600 font-semibold uppercase">{issue.id}</span>
          </div>
        </div>

        {/* Issue Title Block */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider font-mono">
                {issue.category}
              </span>
              {getStatusBadge(issue.status)}
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-black text-gray-900 tracking-tight leading-tight">
              {issue.title}
            </h1>
            <div className="flex flex-wrap items-center text-xs text-gray-400 gap-y-1 gap-x-4 mt-2">
              <span className="flex items-center"><MapPin size={13} className="mr-1 shrink-0" />{issue.location}</span>
              <span className="flex items-center"><Calendar size={13} className="mr-1 shrink-0" />Reported: {new Date(issue.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center"><Clock size={13} className="mr-1 shrink-0" />By citizen: <strong className="text-gray-600 ml-1 font-normal">{issue.userName}</strong></span>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 font-mono shrink-0">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Severity Level</span>
            {getSeverityBadge(issue.severity)}
          </div>
        </div>

        {/* Bento Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Expected Resolution Time & Transparency Tracker */}
            {(() => {
              const metrics = getSLAMetrics(issue);
              
              // Progress tracking percentages for visual bar
              let progressPercent = 10;
              if (issue.status === 'under_review') progressPercent = 35;
              if (issue.status === 'in_progress') progressPercent = 70;
              if (issue.status === 'resolved') progressPercent = 90;
              if (issue.status === 'closed') progressPercent = 100;

              return (
                <div className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden">
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <Timer className="text-gray-500 shrink-0" size={18} />
                      <span className="text-xs font-mono font-bold text-gray-700 uppercase tracking-wider">
                        Expected Resolution Time
                      </span>
                    </div>
                    {issue.needsAttention && !['resolved', 'closed'].includes(issue.status) && (
                      <span className="px-2.5 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <AlertOctagon size={11} />
                        Escalated: Needs Attention
                      </span>
                    )}
                  </div>

                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Expected Time Limit */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">
                          Target Window
                        </span>
                        <p className="text-base font-extrabold text-gray-900 leading-tight">
                          {issue.severity === 'critical' ? '24 Hours' : 
                           issue.severity === 'high' ? '48 Hours' : 
                           issue.severity === 'medium' ? '5 Days' : '10 Days'}
                        </p>
                        <span className="text-[11px] text-gray-400 font-medium block">
                          Based on {issue.severity} priority classification
                        </span>
                      </div>

                      {/* Current Status Timer */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">
                          Resolution Status
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            metrics.colorClass === 'green' ? 'bg-emerald-500 animate-pulse' :
                            metrics.colorClass === 'orange' ? 'bg-amber-500 animate-pulse' :
                            'bg-rose-500 animate-pulse'
                          }`}></span>
                          <span className={`text-base font-black ${
                            metrics.colorClass === 'green' ? 'text-emerald-700' :
                            metrics.colorClass === 'orange' ? 'text-amber-700' :
                            'text-rose-700'
                          }`}>
                            {metrics.statusLabel}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-bold block">
                          {metrics.timeLabel}
                        </span>
                      </div>

                      {/* Compliance Status */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">
                          Expected Resolution Status
                        </span>
                        <p className="text-sm font-extrabold text-gray-800 leading-tight">
                          {['resolved', 'closed'].includes(issue.status) ? (
                            !metrics.isOverdue ? (
                              <span className="text-emerald-700">✓ Met Successfully</span>
                            ) : (
                              <span className="text-rose-700">⚠️ Target Time Exceeded</span>
                            )
                          ) : !metrics.isOverdue ? (
                            <span className="text-emerald-650">✓ On-Schedule</span>
                          ) : (
                            <span className="text-rose-650">⚠️ Overdue Priority Review</span>
                          )}
                        </p>
                        <span className="text-[11px] text-gray-400 font-medium block">
                          Subject to active supervisor monitoring
                        </span>
                      </div>

                    </div>

                    {/* Progress Indicator and Stages */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[10px] text-gray-450 uppercase tracking-wider font-bold mb-2">
                        <span>Municipal Response Pipeline Progress</span>
                        <span>{progressPercent}% Complete</span>
                      </div>
                      
                      {/* Visual progress bar */}
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4 border border-gray-150">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            metrics.colorClass === 'red' && !['resolved', 'closed'].includes(issue.status)
                              ? 'bg-red-500' 
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      {/* Pipeline steps */}
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-wider font-mono">
                        <div className={issue.status === 'reported' ? 'text-blue-600' : 'text-gray-400'}>
                          <span>1. Filed</span>
                        </div>
                        <div className={issue.status === 'under_review' ? 'text-blue-600' : 'text-gray-400'}>
                          <span>2. Review</span>
                        </div>
                        <div className={issue.status === 'in_progress' ? 'text-blue-600' : 'text-gray-400'}>
                          <span>3. Repair</span>
                        </div>
                        <div className={['resolved', 'closed'].includes(issue.status) ? 'text-emerald-650' : 'text-gray-400'}>
                          <span>4. Resolved</span>
                        </div>
                      </div>
                    </div>

                    {/* Transparency Notice */}
                    <div className="bg-blue-50/40 border border-blue-100/60 p-4 rounded-xl flex items-start gap-3">
                      <ShieldCheck size={16} className="text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-[11px] leading-relaxed text-blue-900 font-medium">
                        <strong className="font-extrabold uppercase text-[10px] tracking-wider block mb-0.5">Citizen Transparency Resolution Guarantee</strong>
                        This service request is monitored by our digital resolution time tracking system. Expected municipal resolution timelines are bound by city council mandates based on infrastructural severity. Overdue files are automatically escalated.
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* Citizen Resolution Coordinator (Visible when status is 'resolved', 'closed', 'reopened' with citizenConfirmation) */}
            {(issue.status === 'resolved' || issue.status === 'closed' || (issue.status === 'reopened' && issue.citizenConfirmation === 'reopened')) && (
              <div className={`border rounded-2xl shadow-xs p-6 sm:p-8 border-l-4 ${
                issue.status === 'closed' 
                  ? 'bg-emerald-50/20 border-emerald-200 border-l-emerald-600' 
                  : issue.status === 'reopened'
                  ? 'bg-rose-50/20 border-rose-200 border-l-rose-500'
                  : 'bg-indigo-50/25 border-indigo-150 border-l-indigo-600'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 size={20} className={
                      issue.status === 'closed' ? 'text-emerald-600' 
                      : issue.status === 'reopened' ? 'text-rose-500'
                      : 'text-indigo-600'
                    } />
                    <div>
                      <h3 className="text-md font-display font-black text-gray-900 leading-tight">
                        {issue.status === 'closed' ? 'Resolution Confirmed' 
                         : issue.status === 'reopened' ? 'Re-evaluation Requested'
                         : 'Official Resolution Summary'}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {issue.status === 'closed' ? 'This concern was verified by citizen and archived.'
                         : issue.status === 'reopened' ? 'Awaiting administrative re-assessment.'
                         : 'Municipal repair works are completed. Awaiting citizen confirmation.'}
                      </p>
                    </div>
                  </div>
                  {issue.resolvedAt && (
                    <span className="text-[9px] font-mono text-gray-400 bg-white border border-gray-150 px-2 py-0.5 rounded self-start sm:self-center">
                      Completed: {new Date(issue.resolvedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="space-y-5">
                  {/* Summary & Department */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/80 p-4 rounded-xl border border-gray-150">
                      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block mb-0.5">
                        Resolution Summary
                      </span>
                      <p className="text-xs font-bold text-gray-900 leading-snug">
                        {issue.resolutionSummary || 'Repairs completed successfully.'}
                      </p>
                    </div>
                    <div className="bg-white/80 p-4 rounded-xl border border-gray-150">
                      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider block mb-0.5">
                        Responsible Agency
                      </span>
                      <p className="text-xs font-bold text-gray-900 leading-snug flex items-center">
                        <ShieldCheck size={13} className="text-indigo-600 mr-1 shrink-0" />
                        {issue.assignedDepartment || 'Municipal Services'}
                      </p>
                    </div>
                  </div>

                  {/* Before and After Image Comparison */}
                  <div className="bg-white/80 p-4 rounded-xl border border-gray-150 space-y-2.5">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                      Evidence of Repairs (Before & After)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Before (Original) */}
                      <div>
                        <span className="text-[9px] font-mono font-bold text-rose-650 uppercase bg-rose-50 border border-rose-100 px-2 py-0.5 rounded mb-1.5 inline-block">
                          BEFORE REPORT
                        </span>
                        <div className="rounded-lg overflow-hidden border border-gray-150 aspect-video bg-gray-50 flex items-center justify-center">
                          {issue.imageUrl ? (
                            <img src={issue.imageUrl} alt="Before" referrerPolicy="no-referrer" className="object-cover h-full w-full" />
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">No original photo</span>
                          )}
                        </div>
                      </div>
                      {/* After (Resolved) */}
                      <div>
                        <span className="text-[9px] font-mono font-bold text-emerald-700 uppercase bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded mb-1.5 inline-block">
                          AFTER REPAIR
                        </span>
                        <div className="rounded-lg overflow-hidden border border-gray-150 aspect-video bg-gray-50 flex items-center justify-center">
                          {issue.resolutionPhotos && issue.resolutionPhotos.length > 0 ? (
                            <img src={issue.resolutionPhotos[0]} alt="After" referrerPolicy="no-referrer" className="object-cover h-full w-full" />
                          ) : (
                            <div className="text-center p-3">
                              <span className="text-xs text-gray-400 italic block">No photo uploaded</span>
                              <span className="text-[10px] text-gray-400">Supervisor certified via inspection</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Completion Notes */}
                  <div className="bg-white/80 p-4 rounded-xl border border-gray-150">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                      Official Completion Notes
                    </span>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                      {issue.resolutionNotes || 'All operations conform to local engineering regulations. The civic space has been restored to safety.'}
                    </p>
                  </div>

                  {/* Show reviewer details if they exist */}
                  {issue.citizenConfirmation && (
                    <div className={`p-3.5 rounded-xl border ${
                      issue.citizenConfirmation === 'confirmed' 
                        ? 'bg-emerald-50/40 border-emerald-100 text-emerald-950' 
                        : 'bg-rose-50/40 border-rose-100 text-rose-950'
                    }`}>
                      <div className="flex items-center space-x-1.5 mb-1.5">
                        <User size={13} className={issue.citizenConfirmation === 'confirmed' ? 'text-emerald-700' : 'text-rose-600'} />
                        <span className="text-xs font-bold">
                          {issue.citizenConfirmation === 'confirmed' ? 'Resident Verified Resolution' : 'Resident Requested Re-evaluation'}
                        </span>
                      </div>
                      <p className="text-xs italic leading-relaxed">
                        "{issue.citizenReviewNotes || 'Verified without comments.'}"
                      </p>
                    </div>
                  )}

                  {/* Citizen Response Form (Visible when status is 'resolved' and current user is either the author or a citizen) */}
                  {issue.status === 'resolved' && (
                    <div className="pt-4 border-t border-gray-150 space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Verification Feedback / Comments
                        </label>
                        <textarea
                          value={citizenFeedback}
                          onChange={(e) => setCitizenFeedback(e.target.value)}
                          placeholder="e.g., Looks fantastic, thank you! OR: The asphalt is still crumbling..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden text-gray-900 focus:border-blue-500"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={handleCitizenConfirm}
                          disabled={isReviewSubmitting}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} />
                          <span>Confirm Successful Resolution</span>
                        </button>
                        <button
                          onClick={handleCitizenReopen}
                          disabled={isReviewSubmitting || !citizenFeedback.trim()}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <AlertCircle size={13} />
                          <span>Request Re-evaluation (Reopen)</span>
                        </button>
                      </div>
                      {!citizenFeedback.trim() && (
                        <p className="text-[10px] text-gray-400 italic text-center">
                          * Provide feedback comments if you need to request re-evaluation.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active operations / tracking card */}
            {(issue.assignedOfficer || issue.inspectionScheduledAt || issue.repairScheduledAt || issue.pausedReason) && (
              <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6 space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 font-mono flex items-center justify-between">
                  <span>Active Maintenance Tracker</span>
                  <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-mono font-bold uppercase tracking-wider">
                    Resolution Status
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {issue.assignedOfficer && (
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Lead Inspector</span>
                      <p className="text-xs font-extrabold text-gray-800 mt-0.5">{issue.assignedOfficer}</p>
                    </div>
                  )}

                  {issue.inspectionScheduledAt && (
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Inspection Date</span>
                      <p className="text-xs font-extrabold text-gray-800 mt-0.5">
                        {new Date(issue.inspectionScheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )}

                  {issue.repairScheduledAt && (
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Scheduled Repair</span>
                      <p className="text-xs font-extrabold text-gray-800 mt-0.5">
                        {new Date(issue.repairScheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )}

                  {issue.status === 'paused' && issue.pausedReason && (
                    <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg col-span-1 sm:col-span-2 md:col-span-3">
                      <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider block">Reason for Work Suspension</span>
                      <p className="text-xs font-extrabold text-rose-800 mt-0.5 leading-relaxed">{issue.pausedReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Description & Image Card */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6 sm:p-8">
              <h2 className="text-lg font-display font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">
                Issue Description & Details
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-6">
                {issue.description}
              </p>

              {issue.imageUrl ? (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                    Evidence Image Attachment
                  </h3>
                  <div className="rounded-xl overflow-hidden border border-gray-150 bg-gray-50 max-h-96 flex items-center justify-center">
                    <img
                      src={issue.imageUrl}
                      alt={issue.title}
                      referrerPolicy="no-referrer"
                      className="max-h-96 w-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-150 border-dashed p-6 rounded-xl text-center text-gray-450 text-xs">
                  No image attachment was submitted with this complaint.
                </div>
              )}
            </div>

            {/* AI Diagnostic Analysis Section */}
            {(() => {
              const confidenceScore = issue.aiConfidenceScore ?? 92;
              const confidenceRating = issue.aiConfidenceRating ?? (issue.severity === 'critical' ? 'Very High' : 'High');
              const publicImpacts = issue.aiPublicImpacts && issue.aiPublicImpacts.length > 0
                ? issue.aiPublicImpacts 
                : [
                    issue.severity === 'critical' ? "Immediate threat to vehicle & human safety" : "Minor pedestrian navigation impediment",
                    "Reduction in localized municipal service quality",
                    "Secondary damage risks if left unaddressed"
                  ];
              const actionPlan = issue.aiActionPlan && issue.aiActionPlan.length > 0
                ? issue.aiActionPlan
                : [
                    "Validate reported GPS coordinate accuracy",
                    "Erect caution markers or warning signs",
                    `Schedule repair from ${issue.assignedDepartment}`,
                    "Perform post-completion compliance inspection"
                  ];
              const estimatedResolutionTime = issue.aiEstimatedResolutionTime ?? (
                issue.severity === 'critical' ? '12–24 Hours' :
                issue.severity === 'high' ? '2–3 Days' :
                issue.severity === 'medium' ? '1 Week' : '1–2 Weeks'
              );
              const priorityLevel = issue.aiPriorityLevel ?? (
                issue.severity === 'critical' ? 'Critical' :
                issue.severity === 'high' ? 'High' :
                issue.severity === 'medium' ? 'Medium' : 'Low'
              );
              const reasoningDetails = issue.aiReasoningDetails ?? (
                `Analyzed key indicators in issue title "${issue.title}" and description matching typical patterns for ${issue.category}. Routed to ${issue.assignedDepartment} based on standard municipal work protocols.`
              );

              return (
                <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
                  {/* Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
                    <div>
                      <h2 className="text-lg font-display font-bold text-gray-950 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600 shrink-0" />
                        <span>Issue Summary</span>
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Triage and dispatch routing details for service coordination.
                      </p>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-2">
                    {/* Category */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                        Category
                      </span>
                      <span className="text-sm font-bold text-gray-900 block">
                        {issue.category}
                      </span>
                    </div>

                    {/* Priority */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                        Priority Level
                      </span>
                      <span className={`text-sm font-bold block ${
                        priorityLevel.toLowerCase() === 'critical' ? 'text-red-600' :
                        priorityLevel.toLowerCase() === 'high' ? 'text-orange-600' :
                        priorityLevel.toLowerCase() === 'medium' ? 'text-amber-600' :
                        'text-green-600'
                      }`}>
                        {priorityLevel}
                      </span>
                    </div>

                    {/* Department */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                        Responsible Department
                      </span>
                      <span className="text-sm font-bold text-gray-900 block">
                        {issue.assignedDepartment}
                      </span>
                    </div>

                    {/* Resolution Time */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                        Estimated Resolution Time
                      </span>
                      <span className="text-sm font-bold text-gray-900 block">
                        {estimatedResolutionTime}
                      </span>
                    </div>
                  </div>

                  {/* Executive Summary & Actions */}
                  <div className="space-y-4">
                    {/* Executive Summary */}
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
                        Executive Summary
                      </span>
                      <p className="text-sm text-gray-650 leading-relaxed">
                        {issue.aiSummary}
                      </p>
                    </div>

                    {/* Recommended Action */}
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block">
                        Recommended Action
                      </span>
                      <ul className="space-y-2.5">
                        {actionPlan.map((action, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-gray-700 font-medium"
                          >
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-semibold">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed pt-0.5">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Public/Admin Discussion Comments Section */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6 sm:p-8">
              <h2 className="text-lg font-display font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">
                Citizen-Municipal Dialogue
              </h2>

              {/* Leave Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ask a question or leave progress notes here..."
                    className="flex-1 px-3.5 py-2.5 border border-gray-250 rounded-lg text-sm bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>

              {/* Comment Thread */}
              {issue.comments.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs italic bg-gray-50 rounded-xl border border-gray-150 border-dashed">
                  No discussion threads logged on this complaint.
                </div>
              ) : (
                <div className="space-y-4">
                  {issue.comments.map((comment) => (
                    <div 
                      key={comment.id}
                      className={`p-4 rounded-xl border text-sm leading-relaxed ${
                        comment.authorRole === 'admin'
                          ? 'bg-amber-50/50 border-amber-100 pl-4 border-l-4 border-l-amber-500'
                          : 'bg-gray-50 border-gray-150'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center space-x-2">
                          <User size={14} className={comment.authorRole === 'admin' ? 'text-amber-700' : 'text-gray-500'} />
                          <span className="font-bold text-gray-900 text-xs">
                            {comment.authorName}
                          </span>
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold tracking-wider ${
                            comment.authorRole === 'admin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {comment.authorRole}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(comment.timestamp).toLocaleDateString()} at {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-700 text-xs leading-normal whitespace-pre-line">
                        {comment.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (Sidebars: Stepper & Admin Controls) */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Community Confirmation Card */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6" id="community-verification-card">
              <h3 className="text-md font-display font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>Community Confirmation</span>
                {latestVerification && (
                  <span className="text-[10px] font-mono font-medium text-gray-400">
                    Last activity {formatTimeAgo(latestVerification.timestamp)}
                  </span>
                )}
              </h3>

              {/* Progress Summary / Stats info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-650 font-bold text-sm">✔</span>
                    <span className="text-xs font-semibold text-gray-750">
                      {confirmCount} {confirmCount === 1 ? 'resident' : 'residents'} confirmed this exists
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-650 font-bold text-sm">✅</span>
                    <span className="text-xs font-semibold text-gray-750">
                      {resolveCount} {resolveCount === 1 ? 'resident' : 'residents'} reported as resolved
                    </span>
                  </div>
                </div>

                {latestVerification && (
                  <p className="text-[11px] text-gray-400 font-sans italic">
                    Last activity: {latestVerification.userName} ({latestVerification.voteType === 'confirm' ? 'confirmed issue exists' : 'marked as resolved'}) {formatTimeAgo(latestVerification.timestamp)}.
                  </p>
                )}
              </div>

              {/* Citizen Verification Actions */}
              <div className="space-y-3">
                <span className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                  Your Confirmation
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => verifyIssue(issue.id, 'confirm')}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      userVote?.voteType === 'confirm'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs ring-1 ring-emerald-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>✔ Confirm Issue</span>
                  </button>
                  <button
                    onClick={() => verifyIssue(issue.id, 'resolve')}
                    className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      userVote?.voteType === 'resolve'
                        ? 'bg-blue-50 text-blue-800 border-blue-300 shadow-xs ring-1 ring-blue-300'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>✅ Mark Resolved</span>
                  </button>
                </div>
              </div>

              {/* Simple Feedback Summary Bar */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <span className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Community Feedback Progress
                </span>
                <div className="flex justify-between text-xs text-gray-500 mb-1 font-semibold">
                  <span>Confirmed Existing ({confirmCount})</span>
                  <span>Reported Resolved ({resolveCount})</span>
                </div>
                <div className="w-full h-2 bg-gray-150 rounded-full flex overflow-hidden">
                  {confirmCount === 0 && resolveCount === 0 ? (
                    <div className="h-full bg-gray-200 w-full rounded-full"></div>
                  ) : (
                    <>
                      <div 
                        style={{ width: `${(confirmCount / (confirmCount + resolveCount || 1)) * 100}%` }} 
                        className="h-full bg-emerald-500 transition-all duration-300"
                      ></div>
                      <div 
                        style={{ width: `${(resolveCount / (confirmCount + resolveCount || 1)) * 100}%` }} 
                        className="h-full bg-blue-500 transition-all duration-300"
                      ></div>
                    </>
                  )}
                </div>
              </div>

              {/* Subtle Nearby Prompt */}
              {(isNearby || isNearby === null) && (
                <div className="mt-4 p-4 bg-emerald-50/40 border border-emerald-150 rounded-xl space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs">
                    <MapPin size={13} className="text-emerald-600 shrink-0" />
                    <span>Have you recently visited this location?</span>
                  </div>
                  <p className="text-[11px] text-gray-650 leading-relaxed font-medium">
                    Help your community by verifying whether this issue still exists.
                  </p>
                </div>
              )}
            </div>

            {/* Smart Behavior Alert: Admin warning if resolved votes >= 3 (or any resolved votes to make it visible in demo) */}
            {userProfile && userProfile.role === 'admin' && resolveCount >= 1 && (
              <div className="bg-orange-50 border-l-4 border-orange-500 text-orange-850 p-4 rounded-r-xl rounded-l-xs text-xs space-y-1" id="admin-resolved-notice">
                <div className="font-bold flex items-center gap-1.5 text-orange-900">
                  <AlertCircle size={15} />
                  <span>Administrative Review Recommended</span>
                </div>
                <p className="leading-relaxed">
                  Community members indicate this issue may already be resolved. Administrative review is recommended. Administrators remain responsible for final resolution.
                </p>
              </div>
            )}
            
            {/* Admin Controls Panel (ONLY shown to Admins) */}
            {userProfile && userProfile.role === 'admin' && (
              <div className="bg-white border border-amber-200 rounded-2xl shadow-xs p-6 border-t-4 border-t-amber-500 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-sm font-display font-black text-gray-900 flex items-center space-x-2">
                    <ShieldCheck size={18} className="text-amber-600" />
                    <span>Admin Control Hub</span>
                  </h3>
                  <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                    Admin Actions
                  </span>
                </div>

                {/* Horizontal Tab bar */}
                <div className="flex border-b border-gray-150 -mx-6 px-6 overflow-x-auto gap-2">
                  <button
                    onClick={() => setAdminTab('assign')}
                    className={`pb-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                      adminTab === 'assign'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Assignments
                  </button>
                  <button
                    onClick={() => setAdminTab('schedule')}
                    className={`pb-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                      adminTab === 'schedule'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Scheduling
                  </button>
                  <button
                    onClick={() => setAdminTab('resolve')}
                    className={`pb-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                      adminTab === 'resolve'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => setAdminTab('govern')}
                    className={`pb-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                      adminTab === 'govern'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Governance
                  </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-4 pt-1">
                  
                  {/* Tab 1: Assignments */}
                  {adminTab === 'assign' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Assigned Department
                        </label>
                        <select
                          value={adminDept}
                          onChange={(e) => setAdminDept(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white text-gray-900 focus:outline-hidden"
                        >
                          {departmentChoices.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleAdminWorkflowAction('assign_department')}
                          disabled={adminUpdating || adminDept === issue.assignedDepartment}
                          className="col-span-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          {adminUpdating ? 'Saving...' : 'Assign Department'}
                        </button>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Lead Investigating Officer
                        </label>
                        <input
                          type="text"
                          value={adminOfficer}
                          onChange={(e) => setAdminOfficer(e.target.value)}
                          placeholder="e.g., Inspector Davis, Officer Angela"
                          className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white text-gray-900 focus:outline-hidden mb-2"
                        />
                        <button
                          onClick={() => handleAdminWorkflowAction('assign_officer')}
                          disabled={adminUpdating || !adminOfficer.trim() || adminOfficer === issue.assignedOfficer}
                          className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          {adminUpdating ? 'Assigning...' : 'Assign Officer'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Scheduling */}
                  {adminTab === 'schedule' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Schedule Onsite Inspection
                        </label>
                        <input
                          type="date"
                          value={inspectionDate}
                          onChange={(e) => setInspectionDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white text-gray-900 focus:outline-hidden mb-2"
                        />
                        <button
                          onClick={() => handleAdminWorkflowAction('schedule_inspection')}
                          disabled={adminUpdating}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          {adminUpdating ? 'Scheduling...' : 'Set Inspection Date'}
                        </button>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Schedule Repair Work
                        </label>
                        <input
                          type="date"
                          value={repairDate}
                          onChange={(e) => setRepairDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white text-gray-900 focus:outline-hidden mb-2"
                        />
                        <button
                          onClick={() => handleAdminWorkflowAction('schedule_repair')}
                          disabled={adminUpdating}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          {adminUpdating ? 'Scheduling Work...' : 'Schedule Repair Work'}
                        </button>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Request Citizen Clarification
                        </label>
                        <input
                          type="text"
                          value={infoRequest}
                          onChange={(e) => setInfoRequest(e.target.value)}
                          placeholder="e.g. Please clarify exact building number"
                          className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white text-gray-900 focus:outline-hidden mb-2"
                        />
                        <button
                          onClick={() => handleAdminWorkflowAction('request_additional_info')}
                          disabled={adminUpdating || !infoRequest.trim()}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          {adminUpdating ? 'Sending Inquiry...' : 'Send Clarification Request'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Resolve & Submit Evidence */}
                  {adminTab === 'resolve' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Repair Summary Heading
                        </label>
                        <input
                          type="text"
                          value={repairSummary}
                          onChange={(e) => setRepairSummary(e.target.value)}
                          placeholder="e.g., Crumbling pavement cold-patched"
                          className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white text-gray-900 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Detailed Work Completion Notes
                        </label>
                        <textarea
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          placeholder="e.g., Cleaned debris, placed and tamped asphalt, verified drainage"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white text-gray-900 focus:outline-hidden"
                        />
                      </div>

                      {/* Photo upload / preset comparison builder */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Repair Evidence Photograph
                        </label>
                        
                        {/* Drag and drop interactive container */}
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                            dragActive 
                              ? 'border-amber-500 bg-amber-50/40' 
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50'
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="admin-evidence-upload"
                          />
                          <label htmlFor="admin-evidence-upload" className="cursor-pointer block">
                            <span className="text-xs font-bold text-gray-700 block">Drag & Drop Repair Photo</span>
                            <span className="text-[10px] text-gray-400 mt-1 block">or click to choose file</span>
                          </label>
                        </div>

                        {/* Upload Preview if set */}
                        {uploadedPhotos.length > 0 && (
                          <div className="mt-3 relative rounded-lg overflow-hidden border border-gray-200 aspect-video max-h-28">
                            <img src={uploadedPhotos[0]} alt="Upload Preview" className="object-cover w-full h-full" />
                            <button
                              onClick={() => setUploadedPhotos([])}
                              className="absolute top-1 right-1 bg-red-650 hover:bg-red-700 text-white font-black p-1.5 rounded-full text-[9px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleAdminWorkflowAction('resolve_issue')}
                        disabled={adminUpdating}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-2.5 rounded-lg text-xs cursor-pointer transition-colors mt-2"
                      >
                        {adminUpdating ? 'Filing Completion Details...' : 'Resolve Issue & Notify Citizens'}
                      </button>
                    </div>
                  )}

                  {/* Tab 4: Governance */}
                  {adminTab === 'govern' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Pause Work Order Investigation
                        </label>
                        {issue.status !== 'paused' ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={pauseReason}
                              onChange={(e) => setPauseReason(e.target.value)}
                              placeholder="e.g., Awaiting custom replacement parts."
                              className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white text-gray-900 focus:outline-hidden"
                            />
                            <button
                              onClick={() => handleAdminWorkflowAction('pause_investigation')}
                              disabled={adminUpdating || !pauseReason.trim()}
                              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-extrabold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                            >
                              {adminUpdating ? 'Pausing...' : 'Pause Work Order'}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 text-center p-3.5 bg-gray-50 border border-gray-150 rounded-lg">
                            <p className="text-xs text-gray-500 font-medium">Investigation is currently paused.</p>
                            <button
                              onClick={() => handleAdminWorkflowAction('resume_investigation')}
                              disabled={adminUpdating}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                            >
                              {adminUpdating ? 'Resuming...' : 'Resume Work Order'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100 space-y-3">
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                          Permanent Ticket Archival
                        </label>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAdminWorkflowAction('close_issue')}
                            disabled={adminUpdating || issue.status === 'closed'}
                            className="flex-1 bg-gray-700 hover:bg-gray-800 disabled:opacity-50 text-white font-extrabold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            {adminUpdating ? 'Closing...' : 'Close & Archive'}
                          </button>
                          <button
                            onClick={() => handleAdminWorkflowAction('reopen_issue')}
                            disabled={adminUpdating || (issue.status !== 'closed' && issue.status !== 'resolved')}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                          >
                            {adminUpdating ? 'Reopening...' : 'Reopen Ticket'}
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 space-y-3">
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                          Merge Duplicate Ticket Into This Ticket
                        </label>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                          Identify an active duplicate ticket to merge into this primary ticket. Comments and supporters will transfer here, and the duplicate will be closed automatically.
                        </p>
                        
                        {(() => {
                          const mergeCandidates = issues.filter(i => i.id !== issue.id && i.status !== 'closed' && i.status !== 'resolved');
                          
                          if (mergeCandidates.length === 0) {
                            return (
                              <p className="text-xs text-amber-600 font-medium italic">
                                No other active tickets available for merging.
                              </p>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              <select
                                id="merge-source-select"
                                className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white text-gray-900 focus:outline-hidden"
                                defaultValue=""
                                onChange={(e) => {
                                  (window as any)._selectedMergeSource = e.target.value;
                                }}
                              >
                                <option value="" disabled>Select a duplicate ticket...</option>
                                {mergeCandidates.map(cand => (
                                  <option key={cand.id} value={cand.id}>
                                    #{cand.id.substring(0,6)} - {cand.title} ({cand.location})
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={async () => {
                                  const sourceId = (window as any)._selectedMergeSource;
                                  if (!sourceId) {
                                    alert("Please select a duplicate ticket to merge.");
                                    return;
                                  }
                                  if (confirm(`Are you sure you want to merge ticket #${sourceId.substring(0,6)} into this primary ticket? This action will close the duplicate and transfer all data.`)) {
                                    setAdminUpdating(true);
                                    try {
                                      await mergeIssues(sourceId, issue.id);
                                    } catch (err: any) {
                                      alert(err.message || "Failed to merge issues");
                                    } finally {
                                      setAdminUpdating(false);
                                    }
                                  }
                                }}
                                disabled={adminUpdating}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-2 rounded-lg text-xs cursor-pointer transition-colors"
                              >
                                {adminUpdating ? 'Merging...' : 'Execute Ticket Merge'}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Vertical Timeline Tracker Stepper */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6">
              <h3 className="text-md font-display font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>Detailed Resolution Timeline</span>
                <span className="text-[9px] bg-gray-50 border border-gray-150 text-gray-450 px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
                  {issue.timeline.length} events logged
                </span>
              </h3>

              <div className="flow-root">
                <ul className="-mb-8">
                  {issue.timeline.map((event, idx) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {idx !== issue.timeline.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-150" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          {/* Circle Badge Indicator */}
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white shrink-0 ${
                              event.status === 'resolved' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                : event.status === 'reopened'
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : event.status === 'paused'
                                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                                : event.status === 'in_progress'
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                : event.status === 'comment_added'
                                ? 'bg-gray-50 text-gray-500 border border-gray-250'
                                : 'bg-blue-50 text-blue-600 border border-blue-200'
                            }`}>
                              {event.status === 'resolved' ? (
                                <CheckCircle2 size={15} />
                              ) : (
                                <Clock size={14} />
                              )}
                            </span>
                          </div>

                          {/* Content text */}
                          <div className="flex-1 min-w-0 pt-1.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <p className="text-xs font-bold text-gray-900 font-display">
                                {event.title}
                              </p>
                              <span className="text-[9px] font-mono text-gray-400">
                                {new Date(event.timestamp).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                              {event.description}
                            </p>

                            {/* Actor (Responsible Person / Lead) Details */}
                            {event.actorName && (
                              <div className="flex items-center space-x-1.5 mt-2">
                                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Responsible Agent:</span>
                                <span className="inline-flex items-center text-[10px] font-bold text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 font-sans">
                                  {event.actorName} 
                                  {event.actorRole && (
                                    <span className="text-[8px] uppercase font-bold text-blue-600 ml-1 font-mono tracking-wider">
                                      ({event.actorRole})
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
