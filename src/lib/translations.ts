export type SupportedLanguage = 'en' | 'hi';

export interface TranslationDictionary {
  // Navigation & Branding
  home: string;
  aboutMission: string;
  contactSupport: string;
  privacy: string;
  dashboard: string;
  reportIssue: string;
  myReports: string;
  issues: string;
  issueManagement: string;
  reportsAndInsights: string;
  accountSettings: string;
  notifications: string;
  logout: string;
  profile: string;
  gateway: string;

  // Settings View
  settingsTitle: string;
  settingsSub: string;
  alertTitle: string;
  alertHeading: string;
  alertSub: string;
  langTitle: string;
  langHeading: string;
  langSub: string;
  langSelectLabel: string;
  langEnglish: string;
  langHindi: string;

  // Other UI Labels
  onTrack: string;
  overdue: string;
  activeReports: string;
  actions: string;
  searchPlaceholder: string;
  suggestedShortcuts: string;
  recentSearches: string;
  recentlyViewedInquiries: string;
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    home: "Home",
    aboutMission: "About Mission",
    contactSupport: "Contact Support",
    privacy: "Privacy",
    dashboard: "Dashboard",
    reportIssue: "Report Issue",
    myReports: "My Reports",
    issues: "Issues",
    issueManagement: "Issue Management",
    reportsAndInsights: "Reports & Insights",
    accountSettings: "Account Settings",
    notifications: "Notifications",
    logout: "Log Out",
    profile: "Profile",
    gateway: "FixMyCity",

    settingsTitle: "Account & System Settings",
    settingsSub: "Configure system parameters and notification alerts.",
    alertTitle: "Civic Dispatch Alerts",
    alertHeading: "Email & Status Notifications",
    alertSub: "Receive real-time alerts whenever an administrator reviews your report, assigns a repair crew, or resolves an issue.",
    langTitle: "System Language Selection",
    langHeading: "Display Language",
    langSub: "Choose your localized municipal portal translation.",
    langSelectLabel: "Language",
    langEnglish: "English (US)",
    langHindi: "हिन्दी (Hindi)",

    onTrack: "✅ On Track",
    overdue: "🚨 Overdue",
    activeReports: "Active Reports",
    actions: "Actions",
    searchPlaceholder: "Search title, area, category... (Ctrl+K)",
    suggestedShortcuts: "Suggested Shortcuts",
    recentSearches: "Recent Searches",
    recentlyViewedInquiries: "Recently Viewed Inquiries",
  },
  hi: {
    home: "मुख्य पृष्ठ",
    aboutMission: "मिशन के बारे में",
    contactSupport: "सहायता से संपर्क करें",
    privacy: "गोपनीयता",
    dashboard: "डैशबोर्ड",
    reportIssue: "समस्या रिपोर्ट करें",
    myReports: "मेरी रिपोर्ट",
    issues: "समस्याएं",
    issueManagement: "समस्या प्रबंधन",
    reportsAndInsights: "रिपोर्ट और अंतर्दृष्टि",
    accountSettings: "खाता सेटिंग",
    notifications: "सूचनाएं",
    logout: "लॉग आउट",
    profile: "प्रोफ़ाइल",
    gateway: "FixMyCity",

    settingsTitle: "खाता और सिस्टम सेटिंग्स",
    settingsSub: "सिस्टम पैरामीटर और अधिसूचना अलर्ट कॉन्फ़िगर करें।",
    alertTitle: "नागरिक प्रेषण अलर्ट",
    alertHeading: "ईमेल और स्थिति सूचनाएं",
    alertSub: "जब भी कोई व्यवस्थापक आपकी रिपोर्ट की समीक्षा करता है, मरम्मत दल नियुक्त करता है, या किसी समस्या का समाधान करता है, तो वास्तविक समय में अलर्ट प्राप्त करें।",
    langTitle: "सिस्टम भाषा चयन",
    langHeading: "प्रदर्शित भाषा",
    langSub: "अपना स्थानीयकृत नगरपालिका पोर्टल अनुवाद चुनें।",
    langSelectLabel: "भाषा",
    langEnglish: "English (अंग्रेज़ी)",
    langHindi: "हिन्दी (Hindi)",

    onTrack: "✅ समय पर",
    overdue: "🚨 विलंबित",
    activeReports: "सक्रिय रिपोर्ट",
    actions: "कार्रवाई",
    searchPlaceholder: "शीर्षक, क्षेत्र, श्रेणी खोजें... (Ctrl+K)",
    suggestedShortcuts: "सुझाए गए शॉर्टकट",
    recentSearches: "हाल की खोजें",
    recentlyViewedInquiries: "हाल ही में देखी गई पूछताछ",
  }
};
