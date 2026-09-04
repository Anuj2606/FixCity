import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { QuickActionModal } from './QuickActionModal';
import { IssueReport } from '../types';
import { 
  Search, Compass, Settings, Bell, MapPin, Users, BarChart3, PlusCircle, 
  Terminal, Shield, Eye, UserCheck, CheckCircle2, MessageSquare, History, Map, ArrowRight, CornerDownLeft
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const { navigate, issues, userProfile } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);
  const [activeSubAction, setActiveSubAction] = useState<'none' | 'action-select'>('none');
  
  // Quick Action launcher
  const [modalIssue, setModalIssue] = useState<IssueReport | null>(null);
  const [modalTab, setModalTab] = useState<'assign' | 'status' | 'timeline' | 'map' | 'comment'>('timeline');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIssues = issues.filter(i => !i.isDemoSeed && !i.id.startsWith('issue-seed-'));
  const isAdmin = userProfile?.role === 'admin';

  // Toggle palette shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
        setSelectedIssue(null);
        setActiveSubAction('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Command palette items list computation
  const getNavigationCommands = () => {
    const list = [
      { id: 'nav-dashboard', label: 'Go to Dashboard', icon: Compass, route: isAdmin ? 'admin-dashboard' : 'citizen-dashboard', desc: 'Main municipal summary overview' },
      { id: 'nav-ops', label: 'Go to Operations Center', icon: Shield, route: 'operations-center', desc: 'Central dispatch operations room' },
      { id: 'nav-report', label: 'Report New Civic Concern', icon: PlusCircle, route: 'report-issue', desc: 'File a complaint with municipal routing' },
      { id: 'nav-map', label: 'Go to Community Map', icon: Map, route: 'community-map', desc: 'Interactive geographic complaint view' },
      { id: 'nav-analytics', label: 'Go to Analytics & Metrics', icon: BarChart3, route: 'analytics', desc: 'View dispatch workloads & compliance' },
      { id: 'nav-notif', label: 'Go to My Notifications', icon: Bell, route: 'notifications', desc: 'Review status changes & community activity' },
      { id: 'nav-settings', label: 'Go to Profile Settings', icon: Settings, route: 'settings', desc: 'Customize municipal alerts & portal locale' }
    ];

    if (isAdmin) {
      list.push({ id: 'nav-users', label: 'Manage Portal Users', icon: Users, route: 'users', desc: 'Audit verified citizen accounts' });
    }

    return list;
  };

  const navigationCommands = getNavigationCommands();

  // Matched items based on queries
  const filteredNavs = navigationCommands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(query.toLowerCase())
  );

  const filteredIssues = activeIssues.filter(issue => 
    issue.title.toLowerCase().includes(query.toLowerCase()) ||
    issue.location.toLowerCase().includes(query.toLowerCase()) ||
    issue.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const subActions: Array<{ id: string; label: string; icon: any; tab: 'assign' | 'status' | 'timeline' | 'map' | 'comment' }> = [
    { id: 'act-view', label: 'Open Ticket File Details', icon: Eye, tab: 'timeline' },
    { id: 'act-comment', label: 'Add Command/Comment', icon: MessageSquare, tab: 'comment' },
    { id: 'act-timeline', label: 'Inspect Timeline History', icon: History, tab: 'timeline' },
    { id: 'act-map', label: 'Verify Maps Location', icon: MapPin, tab: 'map' }
  ];

  if (isAdmin) {
    subActions.unshift(
      { id: 'act-assign', label: 'Assign Supervisor Officer', icon: UserCheck, tab: 'assign' },
      { id: 'act-status', label: 'Transition Workflow Status', icon: CheckCircle2, tab: 'status' }
    );
  }

  const itemsCount = activeSubAction === 'action-select' 
    ? subActions.length 
    : filteredNavs.length + filteredIssues.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % itemsCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + itemsCount) % itemsCount);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCurrentSelection();
    } else if (e.key === 'Backspace' && activeSubAction === 'action-select' && query === '') {
      e.preventDefault();
      setActiveSubAction('none');
      setSelectedIssue(null);
      setSelectedIndex(0);
    }
  };

  const executeCurrentSelection = () => {
    // 1. If currently in Sub-Action execution mode
    if (activeSubAction === 'action-select' && selectedIssue) {
      const selectedAction = subActions[selectedIndex];
      if (selectedAction) {
        setModalIssue(selectedIssue);
        setModalTab(selectedAction.tab);
        setIsModalOpen(true);
        setIsOpen(false);
      }
      return;
    }

    // 2. Otherwise we are selecting Navigation or an Issue
    if (selectedIndex < filteredNavs.length) {
      // Execute Navigation
      const cmd = filteredNavs[selectedIndex];
      navigate(cmd.route);
      setIsOpen(false);
    } else {
      // Selected an Issue
      const issueIndex = selectedIndex - filteredNavs.length;
      const issue = filteredIssues[issueIndex];
      if (issue) {
        // Switch to Sub-Action selectors for speed!
        setSelectedIssue(issue);
        setActiveSubAction('action-select');
        setSelectedIndex(0);
        setQuery('');
      }
    }
  };

  if (!isOpen) {
    return (
      <QuickActionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setModalIssue(null); }}
        issue={modalIssue}
        initialTab={modalTab}
      />
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-center pt-24 px-4" id="command-palette-backdrop">
        <div 
          ref={containerRef}
          className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col h-[28rem] animate-scale-up" 
          id="command-palette-panel"
        >
          {/* Query Input Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-gray-150 bg-gray-50/70 shrink-0 gap-3">
            <Search className="text-gray-400" size={18} />
            
            {activeSubAction === 'action-select' && selectedIssue && (
              <span className="bg-blue-55 text-blue-700 font-bold px-2 py-0.5 rounded-lg text-[10px] font-mono shrink-0 uppercase tracking-wide flex items-center gap-1">
                <span>Action:</span>
                <span className="max-w-[8rem] truncate font-bold text-gray-900">{selectedIssue.title}</span>
              </span>
            )}

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder={
                activeSubAction === 'action-select' 
                  ? "Type action name or choose below..." 
                  : "Type navigation or issue target (Ctrl+K)..."
              }
              className="flex-1 bg-transparent border-none text-xs focus:outline-hidden text-gray-900 font-sans"
            />
            
            <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">ESC to exit</span>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5" id="command-palette-results">
            {itemsCount === 0 ? (
              <div className="text-center py-12 text-gray-450 text-xs font-medium">
                <Terminal size={24} className="mx-auto text-gray-300 mb-2" />
                No matching system command, section, or complaint found.
              </div>
            ) : activeSubAction === 'action-select' ? (
              // SUB-ACTIONS WORKFLOW SELECTOR
              <div>
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
                  Choose dispatch action for: "{selectedIssue?.title}"
                </p>
                {subActions.map((act, i) => {
                  const Icon = act.icon;
                  const isChosen = selectedIndex === i;
                  return (
                    <button
                      key={act.id}
                      onClick={() => { setSelectedIndex(i); executeCurrentSelection(); }}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        isChosen ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={14} className={isChosen ? 'text-white' : 'text-blue-500'} />
                        <span>{act.label}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {isChosen && (
                          <span className="text-[10px] font-mono opacity-80 flex items-center gap-0.5">
                            <CornerDownLeft size={10} /> Enter
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              // NAVIGATION & ISSUES SEARCH LIST
              <div>
                {/* 1. Navigation Actions Section */}
                {filteredNavs.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest px-3 mb-1.5">
                      Municipal System Navigation
                    </p>
                    {filteredNavs.map((cmd, i) => {
                      const Icon = cmd.icon;
                      const isChosen = selectedIndex === i;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => { setSelectedIndex(i); executeCurrentSelection(); }}
                          onMouseEnter={() => setSelectedIndex(i)}
                          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer font-bold ${
                            isChosen ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Icon size={13} className={isChosen ? 'text-white' : 'text-blue-500'} />
                              <div>
                                <div>{cmd.label}</div>
                                <div className={`text-[10px] font-normal mt-0.5 ${isChosen ? 'text-blue-100' : 'text-gray-400'}`}>
                                  {cmd.desc}
                                </div>
                              </div>
                            </div>
                            {isChosen && <ArrowRight size={12} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. Issue Complaints Target Section */}
                {filteredIssues.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest px-3 mb-1.5">
                      Active Civil Inquiries / Tickets
                    </p>
                    {filteredIssues.map((issue, i) => {
                      const idx = i + filteredNavs.length;
                      const isChosen = selectedIndex === idx;
                      return (
                        <button
                          key={issue.id}
                          onClick={() => { setSelectedIndex(idx); executeCurrentSelection(); }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer font-bold border border-transparent ${
                            isChosen ? 'bg-blue-600 text-white shadow-xs border-blue-500' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="truncate pr-4">
                              <div className="flex items-center space-x-2">
                                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-sm font-black ${isChosen ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                  #{issue.id.substring(0, 8)}
                                </span>
                                <span className="truncate">{issue.title}</span>
                              </div>
                              <div className={`text-[10px] font-normal mt-0.5 truncate flex items-center ${isChosen ? 'text-blue-100' : 'text-gray-400'}`}>
                                <MapPin size={10} className="mr-0.5 inline shrink-0" />
                                <span>{issue.location}</span>
                              </div>
                            </div>
                            
                            {isChosen ? (
                              <span className="text-[10px] font-mono opacity-85 flex items-center gap-0.5">
                                Action <ArrowRight size={10} />
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono text-gray-400 bg-gray-50 border border-gray-150 px-1 py-0.2 rounded-sm">
                                {issue.status.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Keyboard Help Footer */}
          <div className="bg-gray-50 border-t border-gray-150 px-4 py-2 flex justify-between items-center text-[10px] font-mono text-gray-400 shrink-0">
            <div className="flex space-x-4">
              <span>↑↓ Navigation</span>
              <span>↵ Enter</span>
              <span>ESC Exit</span>
            </div>
            {activeSubAction === 'action-select' && (
              <span>Backspace to Go Back</span>
            )}
          </div>

        </div>
      </div>
    </>
  );
};
