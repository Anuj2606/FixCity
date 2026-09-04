import { IssueReport, IssueSeverity, IssueStatus } from '../types';

export const SLA_TARGETS: Record<IssueSeverity, number> = {
  critical: 24 * 60 * 60 * 1000,   // 24 Hours
  high: 48 * 60 * 60 * 1000,       // 48 Hours
  medium: 5 * 24 * 60 * 60 * 1000,  // 5 Days
  low: 10 * 24 * 60 * 60 * 1000,    // 10 Days
};

export interface SLAMetrics {
  slaDurationMs: number;
  deadlineDate: Date;
  isOverdue: boolean;
  timeLabel: string; // "Overdue by..." or "Time Remaining..."
  timeRemainingMs: number;
  colorClass: 'green' | 'orange' | 'red';
  statusLabel: 'On Schedule' | 'Approaching Deadline' | 'Overdue' | 'Met On Time' | 'Overdue';
  actualResolutionTimeMs?: number;
}

export function getSLAMetrics(issue: IssueReport, referenceDate: Date = new Date()): SLAMetrics {
  const createdAt = new Date(issue.createdAt);
  const slaDurationMs = SLA_TARGETS[issue.severity] || SLA_TARGETS.medium;
  const deadlineDate = new Date(createdAt.getTime() + slaDurationMs);
  
  const isResolved = issue.status === 'resolved' || issue.status === 'closed';
  const resolutionDate = issue.resolvedAt ? new Date(issue.resolvedAt) : new Date(issue.updatedAt);
  
  if (isResolved) {
    const actualResolutionTimeMs = resolutionDate.getTime() - createdAt.getTime();
    const metSLA = actualResolutionTimeMs <= slaDurationMs;
    
    // Format duration
    const diffMs = Math.abs(actualResolutionTimeMs);
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const label = `${days > 0 ? `${days}d ` : ''}${hours}h`;

    return {
      slaDurationMs,
      deadlineDate,
      isOverdue: !metSLA,
      timeLabel: metSLA ? `Resolved in ${label} (On Time)` : `Resolved in ${label} (Overdue)`,
      timeRemainingMs: 0,
      colorClass: metSLA ? 'green' : 'red',
      statusLabel: metSLA ? 'Met On Time' : 'Overdue',
      actualResolutionTimeMs,
    };
  }

  // Active Issue
  const nowMs = referenceDate.getTime();
  const deadlineMs = deadlineDate.getTime();
  const timeRemainingMs = deadlineMs - nowMs;
  const isOverdue = timeRemainingMs < 0;

  // Visual indicators
  // Green -> On Schedule
  // Orange -> Approaching Deadline (less than 24h OR less than 20% of SLA time remaining)
  // Red -> Overdue
  let colorClass: 'green' | 'orange' | 'red' = 'green';
  let statusLabel: 'On Schedule' | 'Approaching Deadline' | 'Overdue' = 'On Schedule';

  if (isOverdue) {
    colorClass = 'red';
    statusLabel = 'Overdue';
  } else {
    const isApproaching = timeRemainingMs < 24 * 60 * 60 * 1000 || timeRemainingMs < (slaDurationMs * 0.20);
    if (isApproaching) {
      colorClass = 'orange';
      statusLabel = 'Approaching Deadline';
    } else {
      colorClass = 'green';
      statusLabel = 'On Schedule';
    }
  }

  // Calculate format time string
  const diffMs = Math.abs(timeRemainingMs);
  const totalHours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));

  let timeString = '';
  if (days > 0) {
    timeString = `${days}d ${remainingHours}h`;
  } else if (remainingHours > 0) {
    timeString = `${remainingHours}h ${minutes}m`;
  } else {
    timeString = `${minutes}m`;
  }

  const timeLabel = isOverdue ? `Overdue by ${timeString}` : `Remaining: ${timeString}`;

  return {
    slaDurationMs,
    deadlineDate,
    isOverdue,
    timeLabel,
    timeRemainingMs,
    colorClass,
    statusLabel,
  };
}
