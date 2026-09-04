import React from 'react';
import { IssueReport } from '../types';
import { MapPin, Clock, Calendar, AlertTriangle, ShieldCheck, Sparkles, Timer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSLAMetrics } from '../lib/slaUtils';

interface IssueCardProps {
  issue: IssueReport;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const { navigate } = useApp();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mr-1.5 animate-pulse"></span>
            Reported
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Under Review
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-100">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mr-1.5"></span>
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200 uppercase tracking-wide">
            Low Priority
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wide">
            Medium Priority
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200 uppercase tracking-wide">
            High Priority
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-800 border border-red-200 uppercase tracking-wide animate-bounce">
            <AlertTriangle size={12} className="mr-1 inline" />
            Critical
          </span>
        );
      default:
        return null;
    }
  };

  const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div 
      onClick={() => navigate('issue-details', { id: issue.id })}
      className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
      id={`issue-card-${issue.id}`}
    >
      {/* Evidence Image (If exits, else fallback placeholder) */}
      <div className="h-44 bg-gray-100 relative">
        {issue.imageUrl ? (
          <img 
            src={issue.imageUrl} 
            alt={issue.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <Sparkles size={36} className="text-gray-300 mb-2 group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-mono">No Image Uploaded</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col space-y-1">
          {getStatusBadge(issue.status)}
        </div>
        <div className="absolute top-3 right-3">
          {getSeverityBadge(issue.severity)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col h-56 justify-between">
        <div>
          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span className="font-semibold text-blue-600 uppercase tracking-wide font-mono">
              {issue.category}
            </span>
            <div className="flex items-center font-mono">
              <Calendar size={12} className="mr-1" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-gray-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
            {issue.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-500 line-clamp-1 mt-1.5 leading-relaxed">
            {issue.description}
          </p>

          {/* SLA Status Countdown */}
          {(() => {
            const metrics = getSLAMetrics(issue);
            const badgeColors = 
              metrics.colorClass === 'green' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' :
              metrics.colorClass === 'orange' ? 'bg-amber-50 text-amber-800 border-amber-150' :
              'bg-rose-50 text-rose-800 border-rose-150';

            return (
              <div className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold font-mono ${badgeColors} w-fit`}>
                <Timer size={11} className="shrink-0" />
                <span>{metrics.timeLabel}</span>
                {issue.needsAttention && !['resolved', 'closed'].includes(issue.status) && (
                  <span className="ml-1 px-1 bg-red-600 text-white rounded text-[8px] tracking-wide uppercase font-extrabold animate-pulse">Escalated</span>
                )}
              </div>
            );
          })()}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-gray-100 mt-3 flex flex-col space-y-2">
          {/* Location */}
          <div className="flex items-center text-xs text-gray-500">
            <MapPin size={13} className="text-gray-400 mr-1.5 shrink-0" />
            <span className="truncate">{issue.location}</span>
          </div>

          {/* AI Analyzed Label */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-gray-400 truncate text-[11px] max-w-[100px]">
              Dept: <strong className="text-gray-700">{issue.assignedDepartment.replace('Department', 'Dept')}</strong>
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('community-map', { highlightIssueId: issue.id });
                }}
                className="flex items-center space-x-1 text-[11px] font-bold text-emerald-750 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-150 transition-colors cursor-pointer"
                title="View on Community Map"
              >
                <MapPin size={10} />
                <span>Map</span>
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
