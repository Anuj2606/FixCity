import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  UserProfile, 
  IssueReport, 
  NotificationItem, 
  IssueStatus, 
  IssueSeverity, 
  TimelineEvent, 
  IssueComment, 
  UserRole,
  AIAnalysisResponse
} from '../types';
import { getSLAMetrics } from '../lib/slaUtils';
import { getCleanName } from '../lib/utils';
import { SupportedLanguage } from '../lib/translations';

interface AppContextType {
  // Language Localization
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;

  // Routing
  currentRoute: { path: string; params?: any };
  navigate: (path: string, params?: any) => void;
  
  // Auth
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loadingAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<UserProfile | null>;
  register: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  
  // Issues
  issues: IssueReport[];
  loadingIssues: boolean;
  createIssue: (title: string, description: string, category: string, location: string, imageUrl?: string, precomputedAiAnalysis?: any, latitude?: number, longitude?: number) => Promise<string>;
  addComment: (issueId: string, text: string) => Promise<void>;
  updateIssueStatus: (issueId: string, status: IssueStatus, comment?: string) => Promise<void>;
  updateIssueAdminDetails: (issueId: string, department: string, severity: IssueSeverity) => Promise<void>;
  verifyIssue: (issueId: string, voteType: 'confirm' | 'resolve') => Promise<void>;
  supportIssue: (issueId: string) => Promise<void>;
  mergeIssues: (sourceId: string, targetId: string) => Promise<void>;
  executeWorkflowAction: (
    issueId: string,
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
      | 'citizen_confirm'
      | 'citizen_reopen',
    params: {
      department?: string;
      officerName?: string;
      inspectionDate?: string;
      repairDate?: string;
      infoRequestNotes?: string;
      pauseReason?: string;
      comment?: string;
      resolutionSummary?: string;
      resolutionNotes?: string;
      resolutionPhotos?: string[];
      citizenReviewNotes?: string;
    }
  ) => Promise<void>;
  
  // Notifications
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationsAsRead: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  
  // Registered Users list (formerly demoUsers)
  demoUsers: UserProfile[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language Localization State
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('fixmycity_language');
    return (saved === 'hi' ? 'hi' : 'en') as SupportedLanguage;
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('fixmycity_language', lang);
  };

  // Router
  const [currentRoute, setCurrentRoute] = useState<{ path: string; params?: any }>({ path: 'home' });

  // Local Demo Mode is disabled for production deployment
  const isLocalDemo = false;
  const setIsLocalDemo = (val: boolean) => {};

  // Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Issues State
  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Users Directory (Admin Only)
  const [demoUsers, setDemoUsers] = useState<UserProfile[]>([]);

  // Navigation helper
  const navigate = (path: string, params?: any) => {
    setCurrentRoute({ path, params });
    window.location.hash = path + (params && params.id ? `/${params.id}` : '');
  };

  // Sync hash with route on load
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setCurrentRoute({ path: 'home' });
        return;
      }
      
      const parts = hash.split('/');
      const path = parts[0];
      const id = parts[1];
      
      setCurrentRoute({ 
        path, 
        params: id ? { id } : undefined 
      });
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on initial mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle Google redirect sign-in results on app load
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          // Synchronize/Create user profile
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          let profile: UserProfile;
          if (userDoc && userDoc.exists()) {
            profile = userDoc.data() as UserProfile;
            let needsUpdate = false;
            const updatedFields: Partial<UserProfile> = {};
            
            const cleanName = getCleanName(profile.fullName || profile.name || user.displayName, user.email);
            if (!profile.fullName || profile.fullName !== cleanName) {
              updatedFields.fullName = cleanName;
              needsUpdate = true;
            }
            if (!profile.name || profile.name !== cleanName) {
              updatedFields.name = cleanName;
              needsUpdate = true;
            }
            if (!profile.email && user.email) {
              updatedFields.email = user.email;
              needsUpdate = true;
            }
            if (user.photoURL && (!profile.avatarUrl || profile.avatarUrl !== user.photoURL)) {
              updatedFields.avatarUrl = user.photoURL;
              needsUpdate = true;
            }
            if (user.photoURL && (!profile.avatar || profile.avatar !== user.photoURL)) {
              updatedFields.avatar = user.photoURL;
              needsUpdate = true;
            }
            const currentTimestamp = new Date().toISOString();
            if (!profile.lastLogin || profile.lastLogin.substring(0, 13) !== currentTimestamp.substring(0, 13)) {
              updatedFields.lastLogin = currentTimestamp;
              needsUpdate = true;
            }
            
            if (needsUpdate) {
              profile = { ...profile, ...updatedFields };
              await updateDoc(userDocRef, updatedFields);
            }
          } else {
            const isDemoAdmin = user.email === 'admin@fixmycity.gov' || user.email === 'anujsawant26@gmail.com';
            const cleanName = getCleanName(user.displayName, user.email);
            profile = {
              uid: user.uid,
              email: user.email || '',
              fullName: cleanName,
              name: cleanName,
              role: isDemoAdmin ? 'admin' : 'citizen',
              avatarUrl: user.photoURL || undefined,
              avatar: user.photoURL || undefined,
              notificationsEnabled: true,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            };
            await setDoc(userDocRef, profile);
          }
          setUserProfile(profile);
          if (profile.role === 'admin') {
            navigate('issue-management');
          } else {
            navigate('dashboard');
          }
        }
      } catch (error) {
        console.error("Error handling Google Sign-In redirect result:", error);
      }
    };
    handleRedirectResult();
  }, []);

  // Listen for Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoadingAuth(true);
      if (user) {
        setCurrentUser(user);
        
        // Fetch or create user profile
        const userDocRef = doc(db, 'users', user.uid);
        let userDoc;
        try {
          userDoc = await getDoc(userDocRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          setLoadingAuth(false);
          return;
        }
        
        if (userDoc && userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          let needsUpdate = false;
          const updatedFields: Partial<UserProfile> = {};
          
          const cleanName = getCleanName(profileData.fullName || profileData.name || user.displayName, user.email);
          if (!profileData.fullName || profileData.fullName !== cleanName) {
            updatedFields.fullName = cleanName;
            needsUpdate = true;
          }
          if (!profileData.name || profileData.name !== cleanName) {
            updatedFields.name = cleanName;
            needsUpdate = true;
          }
          if (!profileData.email && user.email) {
            updatedFields.email = user.email;
            needsUpdate = true;
          }
          if (user.photoURL && (!profileData.avatarUrl || profileData.avatarUrl !== user.photoURL)) {
            updatedFields.avatarUrl = user.photoURL;
            needsUpdate = true;
          }
          if (user.photoURL && (!profileData.avatar || profileData.avatar !== user.photoURL)) {
            updatedFields.avatar = user.photoURL;
            needsUpdate = true;
          }
          
          const currentTimestamp = new Date().toISOString();
          if (!profileData.lastLogin || profileData.lastLogin.substring(0, 13) !== currentTimestamp.substring(0, 13)) {
            updatedFields.lastLogin = currentTimestamp;
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            const mergedProfile = { ...profileData, ...updatedFields };
            try {
              await updateDoc(userDocRef, updatedFields);
            } catch (error) {
              console.error("Error updating missing profile fields in Firestore during Auth Change:", error);
            }
            setUserProfile(mergedProfile);
          } else {
            setUserProfile(profileData);
          }
        } else {
          // Fallback if registering outside normal flow or first time login
          const isDemoAdmin = user.email === 'admin@fixmycity.gov' || user.email === 'anujsawant26@gmail.com';
          const cleanName = getCleanName(user.displayName, user.email);
          const defaultProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            fullName: cleanName,
            name: cleanName,
            role: isDemoAdmin ? 'admin' : 'citizen',
            avatarUrl: user.photoURL || undefined,
            avatar: user.photoURL || undefined,
            notificationsEnabled: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          try {
            await setDoc(userDocRef, defaultProfile);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
          }
          setUserProfile(defaultProfile);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen for Issues real-time changes
  useEffect(() => {
    if (!currentUser) {
      setIssues([]);
      setLoadingIssues(false);
      return;
    }

    const issuesQuery = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(issuesQuery, (snapshot) => {
      const fetchedIssues: IssueReport[] = [];
      snapshot.forEach((doc) => {
        fetchedIssues.push({ id: doc.id, ...doc.data() } as IssueReport);
      });
      setIssues(fetchedIssues);
      setLoadingIssues(false);
    }, (error) => {
      setLoadingIssues(false);
      handleFirestoreError(error, OperationType.LIST, 'issues');
    });

    return () => unsubscribe();
  }, [currentUser, isLocalDemo]);

  // Listen for Notifications real-time changes
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const fetchedNotifications: NotificationItem[] = [];
      snapshot.forEach((doc) => {
        fetchedNotifications.push({ id: doc.id, ...doc.data() } as NotificationItem);
      });
      setNotifications(fetchedNotifications);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen for Users list changes (For Admin View)
  useEffect(() => {
    if (!currentUser || userProfile?.role !== 'admin') {
      setDemoUsers([]);
      return;
    }

    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const fetchedUsers: UserProfile[] = [];
      snapshot.forEach((doc) => {
        fetchedUsers.push(doc.data() as UserProfile);
      });
      setDemoUsers(fetchedUsers);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  // Resolution Target Background Checker
  useEffect(() => {
    if (!issues || issues.length === 0 || !currentUser) return;

    const checkSLAs = async () => {
      const now = new Date();
      let updatedIssues = [...issues];
      let hasUpdates = false;

      for (const issue of issues) {
        const isResolved = issue.status === 'resolved' || issue.status === 'closed';
        if (isResolved) continue;

        const metrics = getSLAMetrics(issue, now);
        if (metrics.isOverdue && !issue.needsAttention) {
          hasUpdates = true;
          
          const escalationEvent: TimelineEvent = {
            id: `t-${Date.now()}-escalation`,
            status: issue.status,
            title: 'Resolution Window Overdue - Escalated',
            description: `This ticket has exceeded its expected response window of ${issue.severity === 'critical' ? '24 Hours' : issue.severity === 'high' ? '48 Hours' : issue.severity === 'medium' ? '5 Days' : '10 Days'} and has been escalated as "Needs Attention" to departmental supervisors.`,
            timestamp: now.toISOString(),
            actorName: 'System Resolution Monitor',
            actorRole: 'admin',
          };

          const updatedTimeline = [...issue.timeline, escalationEvent];

          const updates = {
            needsAttention: true,
            slaOverdueNotificationSent: true,
            timeline: updatedTimeline,
            updatedAt: now.toISOString(),
          };

          if (isLocalDemo) {
            updatedIssues = updatedIssues.map(i => i.id === issue.id ? { ...i, ...updates } : i);
          } else {
            try {
              await updateDoc(doc(db, 'issues', issue.id), updates);
            } catch (err) {
              console.error("Failed to escalate issue over Firestore:", err);
            }
          }

          // Generate alert notifications
          await sendAdminNotification(
            "Resolution Window Overdue: Escalation Alert",
            `Ticket #${issue.id.substring(0, 6)} "${issue.title}" assigned to ${issue.assignedDepartment} is OVERDUE and needs attention.`,
            issue.id,
            'system_alerts',
            'critical'
          );

          await sendNotification(
            issue.userId,
            "Response Period Extended",
            `Your report "${issue.title}" has exceeded the expected municipal response window. It has been escalated to departmental directors for prioritized review.`,
            issue.id,
            'system_alerts',
            'high'
          );
        }
      }

      if (isLocalDemo && hasUpdates) {
        setIssues(updatedIssues);
        localStorage.setItem('local_issues', JSON.stringify(updatedIssues));
      }
    };

    // Run immediately on load and then every 30 seconds
    checkSLAs();
    const interval = setInterval(checkSLAs, 30000);
    return () => clearInterval(interval);
  }, [issues, currentUser, isLocalDemo]);

  // Auth Operations
  const login = async (email: string, password: string) => {
    setLoadingAuth(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setLoadingAuth(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setLoadingAuth(true);
    try {
      // 1. Sign out any existing Firebase authentication session
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.warn("Pre-auth signout failed or was ignored:", signOutError);
      }

      // 2. Clear any cached local/session states if appropriate
      localStorage.removeItem('isLocalDemo');
      localStorage.removeItem('local_demo_role');
      setCurrentUser(null);
      setUserProfile(null);

      const provider = new GoogleAuthProvider();
      
      // 3. Configure the GoogleAuthProvider to always prompt account selection
      provider.setCustomParameters({
        prompt: "select_account"
      });

      let userCredential;
      try {
        userCredential = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        // Gracefully handle cancelled popup
        if (popupError.code === 'auth/popup-closed-by-user' || popupError.code === 'auth/cancelled-popup-request') {
          setLoadingAuth(false);
          return null;
        }
        console.warn("Google signInWithPopup failed, was blocked, or is unsupported in this environment. Attempting signInWithRedirect:", popupError);
        await signInWithRedirect(auth, provider);
        return null; // Redirect flow will handle everything on page load
      }

      if (!userCredential || !userCredential.user) {
        setLoadingAuth(false);
        return null;
      }

      const user = userCredential.user;
      
      // Fetch or create user profile
      const userDocRef = doc(db, 'users', user.uid);
      let userDoc;
      try {
        userDoc = await getDoc(userDocRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        setLoadingAuth(false);
        throw error;
      }

      let profile: UserProfile;
      if (userDoc && userDoc.exists()) {
        profile = userDoc.data() as UserProfile;
        let needsUpdate = false;
        const updatedFields: Partial<UserProfile> = {};
        
        const cleanName = getCleanName(profile.fullName || profile.name || user.displayName, user.email);
        if (!profile.fullName || profile.fullName !== cleanName) {
          updatedFields.fullName = cleanName;
          needsUpdate = true;
        }
        if (!profile.name || profile.name !== cleanName) {
          updatedFields.name = cleanName;
          needsUpdate = true;
        }
        if (!profile.email && user.email) {
          updatedFields.email = user.email;
          needsUpdate = true;
        }
        if (user.photoURL && (!profile.avatarUrl || profile.avatarUrl !== user.photoURL)) {
          updatedFields.avatarUrl = user.photoURL;
          needsUpdate = true;
        }
        if (user.photoURL && (!profile.avatar || profile.avatar !== user.photoURL)) {
          updatedFields.avatar = user.photoURL;
          needsUpdate = true;
        }
        
        const currentTimestamp = new Date().toISOString();
        if (!profile.lastLogin || profile.lastLogin.substring(0, 13) !== currentTimestamp.substring(0, 13)) {
          updatedFields.lastLogin = currentTimestamp;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          profile = { ...profile, ...updatedFields };
          try {
            await updateDoc(userDocRef, updatedFields);
          } catch (error) {
            console.error("Error updating missing profile fields in Firestore during Google Login:", error);
          }
        }
      } else {
        // Default role is citizen for first-time Google sign-ins, unless bootstrapped admin
        const isDemoAdmin = user.email === 'admin@fixmycity.gov' || user.email === 'anujsawant26@gmail.com';
        const cleanName = getCleanName(user.displayName, user.email);
        profile = {
          uid: user.uid,
          email: user.email || '',
          fullName: cleanName,
          name: cleanName,
          role: isDemoAdmin ? 'admin' : 'citizen',
          avatarUrl: user.photoURL || undefined,
          avatar: user.photoURL || undefined,
          notificationsEnabled: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        try {
          await setDoc(userDocRef, profile);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
          throw error;
        }
      }
      setUserProfile(profile);
      setLoadingAuth(false);
      return profile;
    } catch (error: any) {
      setLoadingAuth(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string, role: UserRole) => {
    setLoadingAuth(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      const cleanName = getCleanName(fullName, email);
      const profile: UserProfile = {
        uid,
        email,
        fullName: cleanName,
        role,
        notificationsEnabled: true,
        createdAt: new Date().toISOString(),
      };
      
      try {
        await setDoc(doc(db, 'users', uid), profile);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
      }
      setUserProfile(profile);
    } catch (error: any) {
      setLoadingAuth(false);
      throw error;
    }
  };

  const logout = async () => {
    if (isLocalDemo) {
      setIsLocalDemo(false);
      localStorage.removeItem('isLocalDemo');
      localStorage.removeItem('local_demo_role');
      setCurrentUser(null);
      setUserProfile(null);
      navigate('home');
      return;
    }
    await signOut(auth);
    navigate('home');
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    const updated = { ...userProfile, ...data };

    if (isLocalDemo) {
      setUserProfile(updated);
      
      const localUsers = localStorage.getItem('local_users');
      if (localUsers) {
        const usersArray = JSON.parse(localUsers) as UserProfile[];
        const updatedUsers = usersArray.map(u => u.uid === currentUser.uid ? { ...u, ...data } : u);
        localStorage.setItem('local_users', JSON.stringify(updatedUsers));
        setDemoUsers(updatedUsers);
      }
    } else {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), data);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
      setUserProfile(updated);
    }
  };

  // Helper: Send internal database notification
  const sendNotification = async (
    userId: string, 
    title: string, 
    message: string, 
    issueId?: string, 
    category?: string, 
    urgency?: 'low' | 'medium' | 'high' | 'critical' | 'urgent'
  ) => {
    const newNotification: NotificationItem = {
      id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      issueId: issueId || undefined,
      category: category || 'reports',
      urgency: urgency || 'low',
    };

    if (isLocalDemo) {
      // Since notifications state is locally updated in local demo:
      setNotifications(prev => [newNotification, ...prev]);
      
      // Update localStorage
      const localNotifications = localStorage.getItem('local_notifications');
      const existingNotifs = localNotifications ? JSON.parse(localNotifications) : [];
      localStorage.setItem('local_notifications', JSON.stringify([newNotification, ...existingNotifs]));
    } else {
      // In live mode, notifications are handled securely by backend Firebase Cloud Functions (Admin SDK)
      console.log(`Notification creation bypassed client-side for user ${userId}. Managed securely by Firebase Cloud Functions on backend triggers.`);
    }
  };

  // Helper: Send notification to all administrators
  const sendAdminNotification = async (
    title: string, 
    message: string, 
    issueId?: string, 
    category?: string, 
    urgency?: 'low' | 'medium' | 'high' | 'critical' | 'urgent'
  ) => {
    // Notify local demo admin
    await sendNotification('demo-admin-uid', title, message, issueId, category, urgency);
    
    // Notify default admin account in sandbox if exists
    await sendNotification('demo-admin-uid', title, message, issueId, category, urgency);

    // In live mode, send to other profiles with 'admin' role from our lists
    if (!isLocalDemo && demoUsers.length > 0) {
      const admins = demoUsers.filter(u => u.role === 'admin');
      for (const admin of admins) {
        if (admin.uid !== 'demo-admin-uid') {
          await sendNotification(admin.uid, title, message, issueId, category, urgency);
        }
      }
    }
  };

  // Issue Operations
  const createIssue = async (
    title: string,
    description: string,
    category: string,
    location: string,
    imageUrl?: string,
    precomputedAiAnalysis?: any,
    latitude?: number,
    longitude?: number
  ): Promise<string> => {
    if (!currentUser || !userProfile) {
      throw new Error("Must be logged in to report an issue");
    }

    // 1. Call AI classification server-side endpoint or use precomputed analysis
    let aiAnalysis: AIAnalysisResponse;

    if (precomputedAiAnalysis) {
      aiAnalysis = {
        category: precomputedAiAnalysis.category || category || 'Other',
        severity: precomputedAiAnalysis.severity || 'medium',
        department: precomputedAiAnalysis.assignedDepartment || 'Public Works Department',
        summary: precomputedAiAnalysis.summary || 'Issue reported and awaiting municipal dispatch.',
        explanation: 'Issue Summary preview verified during the smart confirmation stage.',
        confidenceScore: 92,
        confidenceRating: 'High',
        publicImpacts: [],
        actionPlan: precomputedAiAnalysis.actionPlan || ['Dispatch field crew for inspection'],
        estimatedResolutionTime: precomputedAiAnalysis.estimatedResolutionTime || '3-5 Days',
        priorityLevel: precomputedAiAnalysis.priorityLevel || 'Medium',
        reasoning: 'Analyzed during pre-submission validation.'
      };
    } else {
      aiAnalysis = {
        category: category || 'Other',
        severity: 'medium',
        department: 'Public Works Department',
        summary: 'Issue reported and awaiting municipal dispatch.',
        explanation: 'AI classification model diagnostic explaining potential factors of wear-and-tear.',
        confidenceScore: 85,
        confidenceRating: 'High',
        publicImpacts: ['Pedestrian hazard', 'Municipal service disruption'],
        actionPlan: ['Dispatch field crew for inspection', 'Coordinate resolution with public works'],
        estimatedResolutionTime: '3-5 Days',
        priorityLevel: 'Medium',
        reasoning: 'Analyzed report content for infrastructure and safety keywords.',
      };

      try {
        const response = await fetch('/api/analyze-issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, category }),
        });
        
        if (response.ok) {
          const data = await response.json();
          aiAnalysis = data as AIAnalysisResponse;
        } else {
          console.warn("AI analysis endpoint returned an error, falling back to defaults.");
        }
      } catch (e) {
        console.error("Network error analyzing complaint with AI:", e);
      }
    }

    // 2. Build the issue report document
    const now = new Date().toISOString();
    const timeline: TimelineEvent[] = [
      {
        id: `t-${Date.now()}-1`,
        status: 'reported',
        title: 'Report Submitted',
        description: `Civic report logged by citizen ${userProfile.fullName || 'Anonymous Citizen'} and registered in the FixMyCity system.`,
        timestamp: now,
      }
    ];

    // Ensure severity is strictly lowercase and valid
    const rawSeverity = (aiAnalysis.severity || 'medium').toLowerCase();
    const severity = ['low', 'medium', 'high', 'critical'].includes(rawSeverity) 
      ? rawSeverity 
      : 'medium';

    const issueDoc: Omit<IssueReport, 'id'> = {
      userId: currentUser.uid,
      userName: userProfile.fullName || 'Anonymous Citizen',
      title: title || 'Untitled Issue',
      description: description || 'No description provided.',
      category: aiAnalysis.category || category || 'Other',
      location: location || 'Unknown Location',
      latitude: latitude !== undefined ? latitude : undefined,
      longitude: longitude !== undefined ? longitude : undefined,
      imageUrl: imageUrl || undefined,
      status: 'reported',
      severity: severity as IssueSeverity,
      assignedDepartment: aiAnalysis.department || 'Public Works Department',
      aiSummary: aiAnalysis.summary || 'Issue reported and awaiting municipal dispatch.',
      aiExplanation: aiAnalysis.explanation || 'Smart diagnostic assessment pending review.',
      aiConfidenceScore: aiAnalysis.confidenceScore !== undefined ? aiAnalysis.confidenceScore : 90,
      aiConfidenceRating: aiAnalysis.confidenceRating || 'High',
      aiPublicImpacts: aiAnalysis.publicImpacts || [],
      aiActionPlan: aiAnalysis.actionPlan || [],
      aiEstimatedResolutionTime: aiAnalysis.estimatedResolutionTime || '3-5 Days',
      aiPriorityLevel: aiAnalysis.priorityLevel || 'Medium',
      aiReasoningDetails: aiAnalysis.reasoning || 'Heuristic-based civic dispatch protocols.',
      timeline,
      comments: [],
      createdAt: now,
      updatedAt: now,
    };

    // 3. Save to Firestore or LocalStorage
    let docRefId;
    if (isLocalDemo) {
      docRefId = `local-issue-${Date.now()}`;
      const newIssue: IssueReport = {
        id: docRefId,
        ...issueDoc
      };
      const updatedIssues = [newIssue, ...issues];
      setIssues(updatedIssues);
      localStorage.setItem('local_issues', JSON.stringify(updatedIssues));
    } else {
      try {
        const docRef = await addDoc(collection(db, 'issues'), issueDoc);
        docRefId = docRef.id;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'issues');
        throw error;
      }
    }
    
    // 4. Send citizen notification
    await sendNotification(
      currentUser.uid,
      "Complaint Submitted Successfully",
      `Your report "${title}" has been submitted and auto-diagnosed. Category: ${issueDoc.category}, Severity: ${issueDoc.severity.toUpperCase()}.`,
      docRefId,
      'reports',
      'low'
    );

    // 5. Send general admin notification
    await sendAdminNotification(
      `New Ticket: ${title}`,
      `A new civic concern has been reported by citizen ${userProfile.fullName}. Category: ${issueDoc.category}, Assigned: ${issueDoc.assignedDepartment}.`,
      docRefId,
      'reports',
      'low'
    );

    // 6. Admin Alert: High priority issue submitted
    if (issueDoc.severity === 'high' || issueDoc.severity === 'critical') {
      await sendAdminNotification(
        `Urgent Alert: High Priority Issue Submitted`,
        `Immediate inspection required for "${title}". Severity level: ${issueDoc.severity.toUpperCase()}.`,
        docRefId,
        'system_alerts',
        issueDoc.severity === 'critical' ? 'critical' : 'high'
      );
    }

    // 7. Parse coordinates and trigger spatial/temporal warnings
    const coordRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const match = location.match(coordRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      let duplicateLocationCount = 0;
      let areaComplaintCount = 0;
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const nowMs = Date.now();

      issues.forEach(existingIssue => {
        const existMatch = existingIssue.location.match(coordRegex);
        if (existMatch) {
          const eLat = parseFloat(existMatch[1]);
          const eLng = parseFloat(existMatch[2]);
          const dLat = lat - eLat;
          const dLng = (lng - eLng) * Math.cos(lat * Math.PI / 180);
          const distanceMeters = Math.sqrt(dLat * dLat + dLng * dLng) * 111000;

          // Repeated reports detected in same location (within ~150 meters)
          if (distanceMeters <= 150 && existingIssue.status !== 'resolved') {
            duplicateLocationCount++;
          }
          // Large increase in complaints in one area (within ~600m and last 7 days)
          if (distanceMeters <= 600 && (nowMs - new Date(existingIssue.createdAt).getTime()) < SEVEN_DAYS_MS) {
            areaComplaintCount++;
          }
        }
      });

      if (duplicateLocationCount >= 2) {
        await sendAdminNotification(
          `Alert: Repeated Reports in Location`,
          `Multiple complaints (${duplicateLocationCount + 1}) have been reported in close proximity at ${location}. Potential recurring infrastructure failure.`,
          docRefId,
          'system_alerts',
          'high'
        );
      }

      if (areaComplaintCount >= 3) {
        await sendAdminNotification(
          `Alert: District Complaint Spike`,
          `Complaint surge detected! ${areaComplaintCount + 1} complaints have been logged in this sector within the past 7 days.`,
          docRefId,
          'system_alerts',
          'critical'
        );
      }
    }

    return docRefId;
  };

  const addComment = async (issueId: string, text: string) => {
    if (!currentUser || !userProfile) return;

    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    const comment: IssueComment = {
      id: `c-${Date.now()}`,
      authorName: userProfile.fullName,
      authorRole: userProfile.role,
      text,
      timestamp: new Date().toISOString(),
    };

    const updatedTimelineEvent: TimelineEvent = {
      id: `t-${Date.now()}`,
      status: 'comment_added',
      title: 'Comment Added',
      description: `${userProfile.fullName} (${userProfile.role === 'admin' ? 'Administrator' : 'Citizen'}) left a comment.`,
      timestamp: new Date().toISOString(),
    };

    const updatedComments = [...issue.comments, comment];
    const updatedTimeline = [...issue.timeline, updatedTimelineEvent];

    if (isLocalDemo) {
      const updatedIssues = issues.map(i => {
        if (i.id === issueId) {
          return {
            ...i,
            comments: updatedComments,
            timeline: updatedTimeline,
            updatedAt: new Date().toISOString()
          };
        }
        return i;
      });
      setIssues(updatedIssues);
      localStorage.setItem('local_issues', JSON.stringify(updatedIssues));
    } else {
      try {
        await updateDoc(doc(db, 'issues', issueId), {
          comments: updatedComments,
          timeline: updatedTimeline,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `issues/${issueId}`);
      }
    }

    // Notify respective parties
    if (userProfile.role === 'admin') {
      // Notify citizen who reported the issue
      await sendNotification(
        issue.userId,
        "Municipal Comment Added",
        `An administrator commented on your report "${issue.title}": "${text.substring(0, 45)}..."`,
        issueId,
        'admin_actions',
        'medium'
      );
    } else {
      // Notify admins that a citizen added a comment
      await sendAdminNotification(
        `New Comment on: ${issue.title}`,
        `Resident ${userProfile.fullName} commented: "${text.substring(0, 45)}..."`,
        issueId,
        'community_activity',
        'low'
      );
    }
  };

  const verifyIssue = async (issueId: string, voteType: 'confirm' | 'resolve') => {
    if (!currentUser || !userProfile) return;

    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    const existingVerifications = issue.verifications || [];
    const userVoteIdx = existingVerifications.findIndex(v => v.userId === currentUser.uid);

    let updatedVerifications = [...existingVerifications];
    const now = new Date().toISOString();

    let timelineText = '';
    let timelineDesc = '';

    if (userVoteIdx > -1) {
      const prevVote = existingVerifications[userVoteIdx];
      if (prevVote.voteType === voteType) {
        return; // Already voted this way
      }
      updatedVerifications[userVoteIdx] = {
        ...prevVote,
        voteType,
        timestamp: now
      };
      
      if (voteType === 'confirm') {
        timelineText = `${userProfile.fullName} confirmed this issue.`;
        timelineDesc = `Community verification count increased.`;
      } else {
        timelineText = `${userProfile.fullName} marked the issue as resolved.`;
        timelineDesc = `Community feedback indicates the issue has been resolved.`;
      }
    } else {
      updatedVerifications.push({
        userId: currentUser.uid,
        userName: userProfile.fullName,
        voteType,
        timestamp: now
      });

      if (voteType === 'confirm') {
        timelineText = `${userProfile.fullName} confirmed this issue.`;
        timelineDesc = `Community verification count increased.`;
      } else {
        timelineText = `${userProfile.fullName} marked the issue as resolved.`;
        timelineDesc = `Community feedback indicates the issue has been resolved.`;
      }
    }

    const updatedTimelineEvent: TimelineEvent = {
      id: `t-${Date.now()}`,
      status: voteType === 'confirm' ? 'under_review' : 'resolved',
      title: timelineText,
      description: timelineDesc,
      timestamp: now,
    };

    const updatedTimeline = [...issue.timeline, updatedTimelineEvent];

    if (isLocalDemo) {
      const updatedIssues = issues.map(i => {
        if (i.id === issueId) {
          return {
            ...i,
            verifications: updatedVerifications,
            timeline: updatedTimeline,
            updatedAt: now
          };
        }
        return i;
      });
      setIssues(updatedIssues);
      localStorage.setItem('local_issues', JSON.stringify(updatedIssues));
    } else {
      try {
        await updateDoc(doc(db, 'issues', issueId), {
          verifications: updatedVerifications,
          timeline: updatedTimeline,
          updatedAt: now,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `issues/${issueId}`);
      }
    }

    // Send notifications for community verification
    const confirmVotes = updatedVerifications.filter(v => v.voteType === 'confirm').length;
    const resolveVotes = updatedVerifications.filter(v => v.voteType === 'resolve').length;

    // 1. Notify reporting citizen
    if (issue.userId !== currentUser.uid) {
      if (voteType === 'confirm') {
        await sendNotification(
          issue.userId,
          "Issue Verified by Community",
          `Your reported issue "${issue.title}" was verified by ${userProfile.fullName}. Total confirmations: ${confirmVotes}.`,
          issueId,
          'community_activity',
          'low'
        );
      } else if (voteType === 'resolve') {
        await sendNotification(
          issue.userId,
          "Issue Reported Resolved",
          `${userProfile.fullName} marked your reported issue "${issue.title}" as resolved.`,
          issueId,
          'community_activity',
          'medium'
        );
      }
    }

    // 2. Notify admins when community reports an issue as resolved
    if (voteType === 'resolve') {
      await sendAdminNotification(
        `Community Reports Resolved`,
        `Resident ${userProfile.fullName} reported "${issue.title}" as resolved. Awaiting administrative inspection.`,
        issueId,
        'community_activity',
        'medium'
      );
    }

    // 3. Notify admins when multiple community verifications are received
    if (confirmVotes === 3 || confirmVotes === 5) {
      await sendAdminNotification(
        `Multiple Verifications Received`,
        `The issue "${issue.title}" has received ${confirmVotes} community confirmations.`,
        issueId,
        'community_activity',
        'medium'
      );
    }
  };

  const supportIssue = async (issueId: string) => {
    if (!currentUser || !userProfile) return;

    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    const supportedBy = issue.supportedBy || [];
    if (supportedBy.includes(currentUser.uid)) {
      return; // Already supported
    }

    const updatedSupportedBy = [...supportedBy, currentUser.uid];
    
    const timelineEvent: TimelineEvent = {
      id: `t-${Date.now()}-support`,
      status: 'under_review',
      title: `${userProfile.fullName} supported this report`,
      description: `Citizen supported this existing issue. Overlapping report prevented.`,
      timestamp: new Date().toISOString(),
    };

    const updatedTimeline = [...issue.timeline, timelineEvent];

    if (isLocalDemo) {
      const updatedIssues = issues.map(i => {
        if (i.id === issueId) {
          return {
            ...i,
            supportedBy: updatedSupportedBy,
            timeline: updatedTimeline,
            updatedAt: new Date().toISOString()
          };
        }
        return i;
      });
      setIssues(updatedIssues);
      localStorage.setItem('local_issues', JSON.stringify(updatedIssues));
    } else {
      try {
        await updateDoc(doc(db, 'issues', issueId), {
          supportedBy: updatedSupportedBy,
          timeline: updatedTimeline,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `issues/${issueId}`);
      }
    }

    // Notify respective parties
    if (issue.userId !== currentUser.uid) {
      await sendNotification(
        issue.userId,
        "Your Report Received Support",
        `Resident ${userProfile.fullName} supported your report "${issue.title}".`,
        issueId,
        'community_activity',
        'low'
      );
    }

    await sendAdminNotification(
      `Issue Gained Support: ${issue.title}`,
      `Resident ${userProfile.fullName} supported ticket "${issue.title}". Total supporters: ${updatedSupportedBy.length}.`,
      issueId,
      'community_activity',
      'low'
    );
  };

  const mergeIssues = async (sourceId: string, targetId: string) => {
    if (!currentUser || !userProfile || userProfile.role !== 'admin') {
      throw new Error("Only administrators can merge issues");
    }

    const sourceIssue = issues.find(i => i.id === sourceId);
    const targetIssue = issues.find(i => i.id === targetId);
    if (!sourceIssue || !targetIssue) return;

    const now = new Date().toISOString();

    const sourceTimelineEvent: TimelineEvent = {
      id: `t-${Date.now()}-merge-source`,
      status: 'closed',
      title: 'Closed as Duplicate',
      description: `Ticket closed and merged into primary ticket "${targetIssue.title}" (${targetIssue.id}) by administrator ${userProfile.fullName}.`,
      timestamp: now,
      actorName: userProfile.fullName,
      actorRole: 'admin',
    };

    const updatedSourceTimeline = [...sourceIssue.timeline, sourceTimelineEvent];
    const sourceUpdates = {
      status: 'closed' as IssueStatus,
      timeline: updatedSourceTimeline,
      updatedAt: now,
    };

    const transferredComments = sourceIssue.comments.map(c => ({
      ...c,
      text: `[Transferred from merged duplicate #${sourceIssue.id}] ${c.text}`
    }));
    const combinedComments = [...targetIssue.comments, ...transferredComments];

    const sourceSupporters = sourceIssue.supportedBy || [];
    const targetSupporters = targetIssue.supportedBy || [];
    const combinedSupporters = Array.from(new Set([
      ...targetSupporters,
      ...sourceSupporters,
      sourceIssue.userId
    ]));

    const targetTimelineEvent: TimelineEvent = {
      id: `t-${Date.now()}-merge-target`,
      status: targetIssue.status,
      title: 'Merged with Duplicate Ticket',
      description: `Ticket merged with duplicate ticket "${sourceIssue.title}" (${sourceIssue.id}). Comments and supporters transferred.`,
      timestamp: now,
      actorName: userProfile.fullName,
      actorRole: 'admin',
    };
    const updatedTargetTimeline = [...targetIssue.timeline, targetTimelineEvent];

    const targetUpdates = {
      comments: combinedComments,
      supportedBy: combinedSupporters,
      timeline: updatedTargetTimeline,
      updatedAt: now,
    };

    if (isLocalDemo) {
      const updatedIssues = issues.map(i => {
        if (i.id === sourceId) {
          return { ...i, ...sourceUpdates };
        }
        if (i.id === targetId) {
          return { ...i, ...targetUpdates };
        }
        return i;
      });
      setIssues(updatedIssues);
      localStorage.setItem('local_issues', JSON.stringify(updatedIssues));
    } else {
      try {
        await updateDoc(doc(db, 'issues', sourceId), sourceUpdates);
        await updateDoc(doc(db, 'issues', targetId), targetUpdates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `issues/${sourceId} or ${targetId}`);
        throw error;
      }
    }

    await sendNotification(
      sourceIssue.userId,
      "Your Report Merged as Duplicate",
      `Your report "${sourceIssue.title}" was identified as a duplicate and merged into "${targetIssue.title}". You are now following the primary report.`,
      targetId,
      'status_updates',
      'medium'
    );

    await sendAdminNotification(
      "Tickets Merged Successfully",
      `Administrator ${userProfile.fullName} merged duplicate ticket "${sourceIssue.title}" (#${sourceIssue.id}) into primary ticket "${targetIssue.title}" (#${targetIssue.id}).`,
      targetId,
      'admin_actions',
      'low'
    );
  };

  const updateIssueStatus = async (issueId: string, status: IssueStatus, comment?: string) => {
    if (!currentUser || !userProfile || userProfile.role !== 'admin') {
      throw new Error("Only administrators can update complaint statuses");
    }

    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    const now = new Date().toISOString();
    
    let statusTitle = '';
    let statusDesc = '';

    switch (status) {
      case 'under_review':
        statusTitle = 'Municipal Review Initiated';
        statusDesc = 'The department supervisor is actively assessing the logistics for repairing the reported issue.';
        break;
      case 'in_progress':
        statusTitle = 'Work Order Dispatched';
        statusDesc = `Repair team dispatched under the assigned ${issue.assignedDepartment}.`;
        break;
      case 'resolved':
        statusTitle = 'Civic Concern Resolved';
        statusDesc = 'Public safety technicians have completed all repairs. Local site restored.';
        break;
      default:
        statusTitle = 'Status Updated';
        statusDesc = `The complaint status was updated to ${status}.`;
    }

    const statusTimelineEvent: TimelineEvent = {
      id: `t-${Date.now()}`,
      status,
      title: statusTitle,
      description: comment || statusDesc,
      timestamp: now,
    };

    const updatedTimeline = [...issue.timeline, statusTimelineEvent];
    const updateData: any = {
      status,
      timeline: updatedTimeline,
      updatedAt: now,
    };

    if (comment) {
      const adminComment: IssueComment = {
        id: `c-${Date.now()}`,
        authorName: userProfile.fullName,
        authorRole: 'admin',
        text: `Status change comment: ${comment}`,
        timestamp: now,
      };
      updateData.comments = [...issue.comments, adminComment];
    }

    if (isLocalDemo) {
      const updatedIssues = issues.map(i => {
        if (i.id === issueId) {
          return {
            ...i,
            ...updateData
          };
        }
        return i;
      });
      setIssues(updatedIssues);
      localStorage.setItem('local_issues', JSON.stringify(updatedIssues));
    } else {
      try {
        await updateDoc(doc(db, 'issues', issueId), updateData);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `issues/${issueId}`);
      }
    }

    // Determine transition types
    const isReopened = issue.status === 'resolved' && status !== 'resolved';
    const isMarkedResolved = status === 'resolved' && issue.status !== 'resolved';

    if (isReopened) {
      // Notify citizen of reopen
      await sendNotification(
        issue.userId,
        "Issue Reopened",
        `Your report "${issue.title}" has been reopened by an administrator for further review. Status set to: ${status.replace('_', ' ').toUpperCase()}.`,
        issueId,
        'status_updates',
        'medium'
      );
      // Notify admins of reopen
      await sendAdminNotification(
        `Issue Reopened: ${issue.title}`,
        `An administrator has reopened the ticket "${issue.title}". Status: ${status.replace('_', ' ').toUpperCase()}.`,
        issueId,
        'admin_actions',
        'medium'
      );
    } else if (isMarkedResolved) {
      // Notify citizen of resolution
      await sendNotification(
        issue.userId,
        "Issue Marked as Resolved",
        `Great news! Public works technicians have resolved your concern: "${issue.title}". ${comment ? `Supervisor comments: ${comment}` : ''}`,
        issueId,
        'status_updates',
        'medium'
      );
      // Notify admins
      await sendAdminNotification(
        `Issue Resolved: ${issue.title}`,
        `The ticket "${issue.title}" has been successfully marked as resolved.`,
        issueId,
        'admin_actions',
        'low'
      );
    } else {
      // General status change
      await sendNotification(
        issue.userId,
        `Issue Status: ${status.replace('_', ' ').toUpperCase()}`,
        `Your report "${issue.title}" is now ${status.replace('_', ' ')}. ${comment ? `Details: ${comment}` : ''}`,
        issueId,
        'status_updates',
        'low'
      );
    }
  };

  const updateIssueAdminDetails = async (issueId: string, department: string, severity: IssueSeverity) => {
    if (!currentUser || !userProfile || userProfile.role !== 'admin') {
      throw new Error("Only administrators can reassign issues");
    }

    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    const now = new Date().toISOString();
    const updates: any = {
      updatedAt: now,
    };

    const timelineEvents: TimelineEvent[] = [];

    if (issue.assignedDepartment !== department) {
      updates.assignedDepartment = department;
      timelineEvents.push({
        id: `t-${Date.now()}-dept`,
        status: 'assigned',
        title: 'Department Reassigned',
        description: `Responsibility transferred to ${department}.`,
        timestamp: now,
      });
    }

    if (issue.severity !== severity) {
      updates.severity = severity;
      timelineEvents.push({
        id: `t-${Date.now()}-sev`,
        status: 'under_review',
        title: 'Severity Adjusted',
        description: `Priority adjusted from ${issue.severity.toUpperCase()} to ${severity.toUpperCase()}.`,
        timestamp: now,
      });
    }

    if (timelineEvents.length > 0) {
      updates.timeline = [...issue.timeline, ...timelineEvents];
      
      if (isLocalDemo) {
        const updatedIssues = issues.map(i => {
          if (i.id === issueId) {
            return {
              ...i,
              ...updates
            };
          }
          return i;
        });
        setIssues(updatedIssues);
        localStorage.setItem('local_issues', JSON.stringify(updatedIssues));
      } else {
        try {
          await updateDoc(doc(db, 'issues', issueId), updates);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `issues/${issueId}`);
        }
      }

      // Notify citizen of the shift
      await sendNotification(
        issue.userId,
        "Issue Assignment Updated",
        `Your report details have been revised by an administrator. Department: ${department}, Severity: ${severity.toUpperCase()}`,
        issueId,
        'admin_actions',
        'low'
      );

      // Notify other admins of reassignment
      await sendAdminNotification(
        `Issue Reassigned: ${issue.title}`,
        `An administrator updated assignment: Department: ${department}, Severity: ${severity.toUpperCase()}`,
        issueId,
        'admin_actions',
        'low'
      );
    }
  };

  const executeWorkflowAction = async (
    issueId: string,
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
      | 'citizen_confirm'
      | 'citizen_reopen',
    params: {
      department?: string;
      officerName?: string;
      inspectionDate?: string;
      repairDate?: string;
      infoRequestNotes?: string;
      pauseReason?: string;
      comment?: string;
      resolutionSummary?: string;
      resolutionNotes?: string;
      resolutionPhotos?: string[];
      citizenReviewNotes?: string;
    }
  ) => {
    if (!currentUser || !userProfile) {
      throw new Error("User must be authenticated");
    }

    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;

    // Check permissions
    const isCitizenAction = actionType === 'citizen_confirm' || actionType === 'citizen_reopen';
    if (!isCitizenAction) {
      if (userProfile.role !== 'admin') {
        throw new Error("Only administrators can perform administrative workflow actions");
      }
    }

    const now = new Date().toISOString();
    const updates: any = {
      updatedAt: now,
    };

    let timelineTitle = '';
    let timelineDesc = '';
    let statusForTimeline = issue.status;
    
    // Notification parameters
    let citizenNotificationTitle = '';
    let citizenNotificationMsg = '';
    let adminNotificationTitle = '';
    let adminNotificationMsg = '';
    let notificationCategory = 'admin_actions';
    let notificationUrgency: 'low' | 'medium' | 'high' | 'critical' | 'urgent' = 'low';

    switch (actionType) {
      case 'assign_department': {
        const dept = params.department || 'Public Works';
        updates.assignedDepartment = dept;
        timelineTitle = 'Assigned to Public Works';
        timelineDesc = `Ticket routed to ${dept} department for logistics and resource dispatch.`;
        statusForTimeline = 'under_review';
        
        citizenNotificationTitle = 'Department Assigned';
        citizenNotificationMsg = `Your reported issue "${issue.title}" has been assigned to the ${dept} department.`;
        adminNotificationTitle = 'Ticket Reassigned';
        adminNotificationMsg = `Ticket "${issue.title}" has been routed to the ${dept} department.`;
        break;
      }
      case 'assign_officer': {
        const officer = params.officerName || 'Inspector Davis';
        updates.assignedOfficer = officer;
        timelineTitle = 'Officer Assigned';
        timelineDesc = `Municipal supervisor ${officer} assigned as the lead officer.`;
        statusForTimeline = 'under_review';

        citizenNotificationTitle = 'Officer Assigned';
        citizenNotificationMsg = `Supervisor ${officer} is now personally responsible for managing your report "${issue.title}".`;
        break;
      }
      case 'schedule_inspection': {
        const dateStr = params.inspectionDate || now;
        updates.inspectionScheduledAt = dateStr;
        updates.status = 'under_review';
        timelineTitle = 'Inspection Scheduled';
        timelineDesc = `Onsite physical assessment scheduled for ${new Date(dateStr).toLocaleDateString()} by ${userProfile.fullName}.`;
        statusForTimeline = 'under_review';

        citizenNotificationTitle = 'Inspection Scheduled';
        citizenNotificationMsg = `A site inspection has been scheduled for your report "${issue.title}" on ${new Date(dateStr).toLocaleDateString()}.`;
        notificationCategory = 'status_updates';
        break;
      }
      case 'schedule_repair': {
        const dateStr = params.repairDate || now;
        updates.repairScheduledAt = dateStr;
        updates.status = 'in_progress';
        timelineTitle = 'Repair Team Dispatched';
        timelineDesc = `Contractor dispatch and field crew scheduled to begin repairs on ${new Date(dateStr).toLocaleDateString()} under supervision.`;
        statusForTimeline = 'in_progress';

        citizenNotificationTitle = 'Repair Scheduled';
        citizenNotificationMsg = `Great news! Field crew dispatch has been scheduled to repair "${issue.title}" on ${new Date(dateStr).toLocaleDateString()}.`;
        notificationCategory = 'status_updates';
        notificationUrgency = 'medium';
        break;
      }
      case 'request_additional_info': {
        const notes = params.infoRequestNotes || 'Please provide more details.';
        timelineTitle = 'Request Additional Information';
        timelineDesc = `Administrative inquiry: "${notes}"`;
        statusForTimeline = 'under_review';

        citizenNotificationTitle = 'Information Requested';
        citizenNotificationMsg = `The city administration needs more information for your report "${issue.title}": "${notes}"`;
        notificationCategory = 'status_updates';
        notificationUrgency = 'medium';
        break;
      }
      case 'pause_investigation': {
        const reason = params.pauseReason || 'Awaiting permits or parts.';
        updates.status = 'paused';
        updates.pausedReason = reason;
        timelineTitle = 'Investigation Paused';
        timelineDesc = `Work order temporarily suspended. Reason: ${reason}`;
        statusForTimeline = 'paused';

        citizenNotificationTitle = 'Investigation Paused';
        citizenNotificationMsg = `Resolution for "${issue.title}" is temporarily paused: ${reason}`;
        notificationCategory = 'status_updates';
        break;
      }
      case 'resume_investigation': {
        updates.status = 'under_review';
        updates.pausedReason = null;
        timelineTitle = 'Investigation Resumed';
        timelineDesc = 'Investigation and field logistics actively resumed.';
        statusForTimeline = 'under_review';

        citizenNotificationTitle = 'Investigation Resumed';
        citizenNotificationMsg = `Investigation has resumed for your report "${issue.title}".`;
        notificationCategory = 'status_updates';
        break;
      }
      case 'resolve_issue': {
        updates.status = 'resolved';
        updates.resolvedAt = now;
        updates.resolutionSummary = params.resolutionSummary || 'Completed infrastructure repair';
        updates.resolutionNotes = params.resolutionNotes || 'All work conforms to safety and engineering rules.';
        updates.resolutionPhotos = params.resolutionPhotos || [];
        updates.citizenConfirmation = null;
        
        timelineTitle = 'Repair Completed';
        timelineDesc = `Field repairs completed: "${params.resolutionSummary}". Notes: ${params.resolutionNotes}`;
        statusForTimeline = 'resolved';
        break;
      }
      case 'citizen_confirm': {
        updates.status = 'closed';
        updates.citizenConfirmation = 'confirmed';
        updates.citizenReviewNotes = params.citizenReviewNotes || 'Confirmed as resolved.';
        timelineTitle = 'Citizen Confirmed';
        timelineDesc = `Resident confirmed successful resolution: "${params.citizenReviewNotes || 'No comment provided'}"`;
        statusForTimeline = 'closed';

        adminNotificationTitle = 'Citizen Confirmed Resolution';
        adminNotificationMsg = `Resident ${userProfile.fullName} confirmed resolution for "${issue.title}".`;
        notificationCategory = 'community_activity';
        break;
      }
      case 'citizen_reopen': {
        updates.status = 'reopened';
        updates.citizenConfirmation = 'reopened';
        updates.citizenReviewNotes = params.citizenReviewNotes || 'Requested re-evaluation.';
        timelineTitle = 'Citizen Reopened';
        timelineDesc = `Resident requested re-evaluation and reopened the ticket: "${params.citizenReviewNotes}"`;
        statusForTimeline = 'reopened';

        adminNotificationTitle = 'Citizen Reopened Issue';
        adminNotificationMsg = `Resident ${userProfile.fullName} rejected the resolution for "${issue.title}" and reopened the ticket. Reason: "${params.citizenReviewNotes}"`;
        notificationCategory = 'community_activity';
        notificationUrgency = 'high';
        break;
      }
      case 'reopen_issue': {
        updates.status = 'reopened';
        updates.citizenConfirmation = null;
        timelineTitle = 'Issue Reopened';
        timelineDesc = `Issue reopened by supervisor ${userProfile.fullName}. Notes: ${params.comment || 'Reviewing work order.'}`;
        statusForTimeline = 'reopened';

        citizenNotificationTitle = 'Issue Reopened';
        citizenNotificationMsg = `Your report "${issue.title}" has been reopened by city administration for further review.`;
        notificationCategory = 'status_updates';
        notificationUrgency = 'medium';
        break;
      }
      case 'close_issue': {
        updates.status = 'closed';
        timelineTitle = 'Issue Closed';
        timelineDesc = `Ticket officially archived and closed by ${userProfile.fullName}.`;
        statusForTimeline = 'closed';

        citizenNotificationTitle = 'Issue Closed';
        citizenNotificationMsg = `Your report "${issue.title}" has been closed and archived.`;
        notificationCategory = 'status_updates';
        break;
      }
      default:
        break;
    }

    // Prepare timeline event
    const mainTimelineEvent: TimelineEvent = {
      id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: statusForTimeline,
      title: timelineTitle,
      description: timelineDesc,
      timestamp: now,
      actorName: userProfile.fullName,
      actorRole: userProfile.role,
    };

    let updatedTimeline = [...issue.timeline, mainTimelineEvent];

    if (actionType === 'resolve_issue') {
      const verificationTimelineEvent: TimelineEvent = {
        id: `t-${Date.now()}-verification`,
        status: 'resolved',
        title: 'Administrative Verification',
        description: `Ticket finalized by supervisor ${userProfile.fullName} and submitted for citizen confirmation.`,
        timestamp: now,
        actorName: userProfile.fullName,
        actorRole: userProfile.role,
      };
      updatedTimeline.push(verificationTimelineEvent);
    }

    updates.timeline = updatedTimeline;

    // Persist changes
    if (isLocalDemo) {
      const updatedIssues = issues.map(i => {
        if (i.id === issueId) {
          return {
            ...i,
            ...updates
          };
        }
        return i;
      });
      setIssues(updatedIssues);
      localStorage.setItem('local_issues', JSON.stringify(updatedIssues));
    } else {
      try {
        await updateDoc(doc(db, 'issues', issueId), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `issues/${issueId}`);
      }
    }

    // Trigger Notifications
    if (citizenNotificationTitle && citizenNotificationMsg && issue.userId !== currentUser.uid) {
      await sendNotification(
        issue.userId,
        citizenNotificationTitle,
        citizenNotificationMsg,
        issueId,
        notificationCategory,
        notificationUrgency
      );
    }

    if (actionType === 'resolve_issue') {
      await sendNotification(
        issue.userId,
        "Issue Resolved - Review Required",
        `Public works completed repairs on "${issue.title}". Please review and confirm resolution.`,
        issueId,
        'status_updates',
        'high'
      );
      await sendAdminNotification(
        `Issue Resolved: ${issue.title}`,
        `Supervisor ${userProfile.fullName} marked ticket as resolved. Awaiting citizen confirmation.`,
        issueId,
        'admin_actions',
        'low'
      );
    }

    if (adminNotificationTitle && adminNotificationMsg) {
      await sendAdminNotification(
        adminNotificationTitle,
        adminNotificationMsg,
        issueId,
        notificationCategory,
        notificationUrgency
      );
    }
  };

  // Notifications
  const markNotificationsAsRead = async () => {
    if (!currentUser) return;

    if (isLocalDemo) {
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      localStorage.setItem('local_notifications', JSON.stringify(updated));
      return;
    }

    // Batch update read status for unread notifications
    const unread = notifications.filter(n => !n.read);
    const promises = unread.map(async (n) => {
      try {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `notifications/${n.id}`);
      }
    });
    await Promise.all(promises);
  };

  const markNotificationAsRead = async (id: string) => {
    if (!currentUser) return;

    if (isLocalDemo) {
      const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
      setNotifications(updated);
      localStorage.setItem('local_notifications', JSON.stringify(updated));
    } else {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
      }
    }
  };

  const deleteNotification = async (id: string) => {
    if (!currentUser) return;

    if (isLocalDemo) {
      const updated = notifications.filter(n => n.id !== id);
      setNotifications(updated);
      localStorage.setItem('local_notifications', JSON.stringify(updated));
    } else {
      try {
        await deleteDoc(doc(db, 'notifications', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
      }
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currentRoute,
        navigate,
        currentUser,
        userProfile,
        loadingAuth,
        login,
        loginWithGoogle,
        register,
        logout,
        updateUserProfile,
        issues,
        loadingIssues,
        createIssue,
        addComment,
        updateIssueStatus,
        updateIssueAdminDetails,
        verifyIssue,
        supportIssue,
        mergeIssues,
        executeWorkflowAction,
        notifications,
        unreadNotificationsCount,
        markNotificationsAsRead,
        markNotificationAsRead,
        deleteNotification,
        demoUsers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
