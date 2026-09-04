export type UserRole = 'citizen' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  name?: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  avatar?: string;
  notificationsEnabled: boolean;
  createdAt: string;
  lastLogin?: string;
}

export type IssueStatus = 'reported' | 'under_review' | 'in_progress' | 'resolved' | 'reopened' | 'paused' | 'closed';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface TimelineEvent {
  id: string;
  status: string;
  title: string;
  description: string;
  timestamp: string;
  actorName?: string;
  actorRole?: string;
}

export interface IssueComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  timestamp: string;
}

export interface VerificationVote {
  userId: string;
  userName: string;
  voteType: 'confirm' | 'resolve';
  timestamp: string;
}

export interface IssueReport {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  status: IssueStatus;
  severity: IssueSeverity;
  assignedDepartment: string;
  aiSummary: string;
  aiExplanation: string;
  aiConfidenceScore?: number;
  aiConfidenceRating?: string;
  aiPublicImpacts?: string[];
  aiActionPlan?: string[];
  aiEstimatedResolutionTime?: string;
  aiPriorityLevel?: string;
  aiReasoningDetails?: string;
  timeline: TimelineEvent[];
  comments: IssueComment[];
  verifications?: VerificationVote[];
  createdAt: string;
  updatedAt: string;
  isDemoSeed?: boolean;
  
  // Resolution & Workflow Tracking
  assignedOfficer?: string;
  inspectionScheduledAt?: string;
  repairScheduledAt?: string;
  pausedReason?: string;
  resolutionPhotos?: string[];
  resolutionNotes?: string;
  resolutionSummary?: string;
  resolvedAt?: string;
  citizenConfirmation?: 'confirmed' | 'reopened' | null;
  citizenReviewNotes?: string;
  supportedBy?: string[];
  needsAttention?: boolean;
  slaOverdueNotificationSent?: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  issueId?: string;
  category?: string; // 'reports' | 'status_updates' | 'community_activity' | 'admin_actions' | 'system_alerts'
  urgency?: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
}

export interface AIAnalysisResponse {
  category: string;
  severity: IssueSeverity;
  department: string;
  summary: string;
  explanation: string;
  confidenceScore?: number;
  confidenceRating?: string;
  publicImpacts?: string[];
  actionPlan?: string[];
  estimatedResolutionTime?: string;
  priorityLevel?: string;
  reasoning?: string;
}
