import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { IssueReport, IssueStatus, IssueSeverity } from '../types';
import { 
  X, UserCheck, CheckCircle2, History, MapPin, MessageSquare, 
  Send, ShieldAlert, Calendar, Clock, AlertTriangle, ChevronRight, Check
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: IssueReport | null;
  initialTab?: 'assign' | 'status' | 'timeline' | 'map' | 'comment';
  onSuccess?: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  issue,
  initialTab = 'timeline',
  onSuccess
}) => {
  const { userProfile, executeWorkflowAction, addComment, navigate } = useApp();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // Form States
  const [assignedOfficer, setAssignedOfficer] = useState('');
  const [assignedDept, setAssignedDept] = useState('');
  const [newStatus, setNewStatus] = useState<IssueStatus>('reported');
  const [statusComment, setStatusComment] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (issue) {
      setAssignedOfficer(issue.assignedOfficer || '');
      setAssignedDept(issue.assignedDepartment || '');
      setNewStatus(issue.status);
    }
    setActiveTab(initialTab);
    setMessage({ type: '', text: '' });
  }, [issue, initialTab, isOpen]);

  if (!isOpen || !issue) return null;

  const isAdmin = userProfile?.role === 'admin';

  const departments = [
    'Public Works Department',
    'Sanitation & Waste Management',
    'Traffic Control & Lighting',
    'Water & Sewer Authority',
    'Parks & Recreation Department',
    'Department of Public Health & Safety'
  ];

  const officerSuggestions = [
    'Inspector Davis',
    'Officer Jenkins',
    'Engineer Patel',
    'Supervisor Thompson',
    'Officer Ramirez',
    'Supervisor Miller'
  ];

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      if (assignedDept !== issue.assignedDepartment) {
        await executeWorkflowAction(issue.id, 'assign_department', { department: assignedDept });
      }
      await executeWorkflowAction(issue.id, 'assign_officer', { officerName: assignedOfficer });
      setMessage({ type: 'success', text: 'Department and Officer successfully updated.' });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update assignment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      // Execute the respective status action or generic update issue status
      await executeWorkflowAction(issue.id, 'update_status', { 
        comment: statusComment || `Status updated to ${newStatus.replace('_', ' ')}` 
      });
      
      // Let's call the status action mapping
      let actionType: any = 'update_status';
      const params: any = { comment: statusComment };
      
      if (newStatus === 'in_progress') {
        actionType = 'dispatch_repair';
        params.repairDate = new Date().toISOString();
      } else if (newStatus === 'under_review') {
        actionType = 'schedule_inspection';
        params.inspectionDate = new Date().toISOString();
      } else if (newStatus === 'resolved') {
        actionType = 'resolve_issue';
        params.resolutionSummary = statusComment || 'Work completed successfully.';
      } else if (newStatus === 'paused') {
        actionType = 'pause_investigation';
        params.pauseReason = statusComment || 'Awaiting materials/funding.';
      } else if (newStatus === 'reopened') {
        actionType = 'reopen_issue';
      } else if (newStatus === 'closed') {
        actionType = 'close_issue';
      }

      await executeWorkflowAction(issue.id, actionType, params);
      setMessage({ type: 'success', text: `Issue status is now ${newStatus.toUpperCase()}.` });
      setStatusComment('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change status.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      await addComment(issue.id, commentText);
      setCommentText('');
      setMessage({ type: 'success', text: 'Comment posted successfully.' });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add comment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" id="quick-action-modal-overlay">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-gray-150 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up" id="quick-action-modal-container">
        
        {/* Modal Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-150 flex justify-between items-start gap-4 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                ID: {issue.id.substring(0, 8)}...
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                issue.severity === 'critical' ? 'bg-red-50 text-red-700' :
                issue.severity === 'high' ? 'bg-orange-50 text-orange-700' :
                issue.severity === 'medium' ? 'bg-amber-50 text-amber-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {issue.severity} Severity
              </span>
            </div>
            <h3 className="text-sm font-sans font-black text-gray-900 mt-1 line-clamp-1">
              {issue.title}
            </h3>
            <p className="text-[11px] text-gray-450 flex items-center mt-1">
              <MapPin size={11} className="mr-1 shrink-0" />
              <span className="truncate">{issue.location}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-700 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-150 bg-white px-4 py-1.5 overflow-x-auto gap-2 shrink-0 scrollbar-none">
          {isAdmin && (
            <>
              <button
                onClick={() => { setActiveTab('assign'); setMessage({ type: '', text: '' }); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'assign' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <UserCheck size={14} />
                <span>Assign</span>
              </button>
              
              <button
                onClick={() => { setActiveTab('status'); setMessage({ type: '', text: '' }); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'status' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <CheckCircle2 size={14} />
                <span>Status</span>
              </button>
            </>
          )}

          <button
            onClick={() => { setActiveTab('timeline'); setMessage({ type: '', text: '' }); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <History size={14} />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => { setActiveTab('map'); setMessage({ type: '', text: '' }); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'map' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <MapPin size={14} />
            <span>Map / Location</span>
          </button>

          <button
            onClick={() => { setActiveTab('comment'); setMessage({ type: '', text: '' }); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'comment' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <MessageSquare size={14} />
            <span>Comment</span>
          </button>
        </div>

        {/* Tab Contents - Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5" id="quick-action-modal-body">
          {message.text && (
            <div className={`mb-4 p-3 rounded-xl border text-xs font-medium flex items-center space-x-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {message.type === 'success' ? <Check size={14} className="shrink-0" /> : <AlertTriangle size={14} className="shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* 1. ASSIGN TAB (Admin) */}
          {activeTab === 'assign' && isAdmin && (
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Assigned Department
                </label>
                <select
                  value={assignedDept}
                  onChange={(e) => setAssignedDept(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden focus:border-blue-550"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Assigned Lead Officer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    placeholder="Type or select a supervisor"
                    className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden focus:border-blue-550"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {officerSuggestions.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setAssignedOfficer(name)}
                      className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all ${
                        assignedOfficer === name 
                          ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold' 
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1"
                >
                  {isSubmitting ? 'Updating...' : 'Save Dispatch Details'}
                </button>
              </div>
            </form>
          )}

          {/* 2. STATUS TAB (Admin) */}
          {activeTab === 'status' && isAdmin && (
            <form onSubmit={handleStatusChange} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Workflow Dispatch Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'reported', label: 'Reported', color: 'border-blue-200' },
                    { id: 'under_review', label: 'Under Review', color: 'border-amber-200' },
                    { id: 'in_progress', label: 'In Progress', color: 'border-indigo-200' },
                    { id: 'paused', label: 'Investigation Paused', color: 'border-gray-200' },
                    { id: 'reopened', label: 'Reopened', color: 'border-rose-200' },
                    { id: 'resolved', label: 'Resolved & Fixed', color: 'border-emerald-200' },
                    { id: 'closed', label: 'Closed & Archived', color: 'border-gray-250' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNewStatus(item.id as IssueStatus)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                        newStatus === item.id 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                          : 'bg-gray-55/40 text-gray-700 hover:bg-gray-50 ' + item.color
                      }`}
                    >
                      <span>{item.label}</span>
                      {newStatus === item.id && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Workflow State Comment (Optional)
                </label>
                <textarea
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="E.g., Assigned field engineers to complete patch repair by tomorrow morning."
                  className="w-full px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden focus:border-blue-550 h-20 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Updating...' : `Transition State to ${newStatus.replace('_', ' ').toUpperCase()}`}
                </button>
              </div>
            </form>
          )}

          {/* 3. TIMELINE TAB (Admin / Citizen) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <p className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                Full Civic Audit Trail
              </p>
              
              <div className="relative pl-6 border-l-2 border-blue-100 space-y-5 py-2">
                {issue.timeline?.map((event, index) => (
                  <div key={event.id || index} className="relative">
                    {/* Circle Dot Indicator */}
                    <span className="absolute -left-[31px] top-1 bg-white border-2 border-blue-500 rounded-full h-4 w-4 flex items-center justify-center">
                      <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    </span>
                    
                    <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 shadow-2xs">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-gray-900">{event.title}</h4>
                        <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        {event.description}
                      </p>
                      {event.actorName && (
                        <div className="mt-2 text-[9px] font-mono text-gray-400 flex items-center">
                          <span className="font-bold text-gray-600">{event.actorName}</span>
                          <span className="mx-1">•</span>
                          <span className="uppercase">{event.actorRole || 'System'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. MAP TAB (Admin / Citizen) */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Report Location details
                </p>
                <div className="bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800">
                  {/* High contrast custom vector mini map preview mockup */}
                  <div className="h-60 flex flex-col items-center justify-center text-center p-6 bg-slate-950 text-slate-300 relative overflow-hidden">
                    {/* SVG map background abstract lanes */}
                    <svg className="absolute inset-0 opacity-20 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0,20 L100,80 M20,0 L80,100 M0,50 L100,50 M50,0 L50,100" stroke="#475569" strokeWidth="2" />
                      <circle cx="50" cy="50" r="10" stroke="#3b82f6" strokeWidth="1" fill="none" />
                      <circle cx="50" cy="50" r="25" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="2,2" fill="none" />
                    </svg>
                    <div className="bg-blue-600/10 text-blue-400 p-3 rounded-full border border-blue-500/20 mb-3 animate-pulse">
                      <MapPin size={24} />
                    </div>
                    <span className="text-xs font-mono font-black text-white">{issue.location}</span>
                    <span className="text-[10px] font-mono text-slate-500 mt-1.5 uppercase tracking-widest">
                      GPS Precision Target Locked
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-150">
                <h4 className="text-xs font-bold text-gray-950 mb-1">Reporter Details</h4>
                <div className="text-[11px] text-gray-600 font-sans space-y-1">
                  <p><span className="font-semibold">Filed By:</span> {issue.userName}</p>
                  <p><span className="font-semibold">Department Route:</span> {issue.assignedDepartment || 'Pending Route'}</p>
                  <p><span className="font-semibold">Priority Class:</span> <span className="uppercase font-mono font-extrabold text-orange-600">{issue.severity}</span></p>
                </div>
              </div>
            </div>
          )}

          {/* 5. COMMENT TAB (Admin / Citizen) */}
          {activeTab === 'comment' && (
            <div className="space-y-4 flex flex-col h-full">
              <p className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider shrink-0">
                Inquiry Dispatch Discussion ({issue.comments?.length || 0})
              </p>

              {/* Comments Feed */}
              <div className="space-y-3 max-h-[16rem] overflow-y-auto pr-1">
                {(!issue.comments || issue.comments.length === 0) ? (
                  <div className="text-center py-6 text-gray-450 text-xs">
                    No active comments on this ticket. Start the coordination below.
                  </div>
                ) : (
                  issue.comments.map((comment, index) => (
                    <div 
                      key={comment.id || index}
                      className={`p-3 rounded-xl border text-xs max-w-[85%] ${
                        comment.authorRole === 'admin' 
                          ? 'ml-auto bg-blue-50 text-blue-900 border-blue-100' 
                          : 'bg-gray-50 text-gray-900 border-gray-150'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-4 mb-1.5">
                        <span className="font-bold">{comment.authorName}</span>
                        <span className="text-[9px] font-mono text-gray-400">
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                      <span className="block mt-1 text-[8px] font-mono text-gray-400 uppercase tracking-widest">
                        {comment.authorRole}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2 shrink-0 pt-2 border-t border-gray-150">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Post comment to this ticket..."
                  className="flex-1 px-3 py-2 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden focus:border-blue-550"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !commentText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0 disabled:bg-blue-400"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-150 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={() => { if (issue) { navigate('issue-details', { id: issue.id }); onClose(); } }}
            className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Open Complete Inquiry File</span>
            <ChevronRight size={14} />
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-250 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
};
