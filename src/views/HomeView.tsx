import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, ArrowRight, Sparkles, AlertTriangle, 
  CheckCircle, Clock, MapPin, FileText, BarChart2
} from 'lucide-react';
import { FixMyCityLogo } from '../components/FixMyCityLogo';

export const HomeView: React.FC = () => {
  const { userProfile, navigate } = useApp();

  return (
    <div className="bg-gray-50 flex flex-col min-h-screen" id="home-view">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="relative z-10 lg:max-w-2xl">
            <main className="mx-auto max-w-7xl px-4 sm:px-6 md:mt-16 lg:px-8">
              <div className="sm:text-center lg:text-left">
                {/* AI Badge */}
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 text-sm font-semibold tracking-wide mb-6">
                  <Sparkles size={16} />
                  <span>Official Municipal Service Portal</span>
                </div>
                
                <h1 className="text-4xl tracking-tight font-display font-black text-gray-900 sm:text-5xl md:text-6xl leading-none">
                  <span className="block">Fix Your City.</span>
                  <span className="block text-blue-600 mt-1">Direct Dispatch Pipeline.</span>
                </h1>
                
                <p className="mt-4 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 leading-relaxed">
                  Bridge the gap between citizens and local government. Report public infrastructure issues and get automated triage, severity mapping, and department routing in seconds.
                </p>

                {/* Main Action Buttons */}
                <div className="mt-8 sm:flex sm:justify-center lg:justify-start gap-4">
                  {userProfile ? (
                    <button
                      onClick={() => navigate(userProfile.role === 'admin' ? 'admin-dashboard' : 'dashboard')}
                      className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 md:text-lg cursor-pointer shadow-xs transition-colors"
                    >
                      Go to Your Dashboard
                      <ArrowRight size={18} className="ml-2" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate('login')}
                        className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 md:text-lg cursor-pointer shadow-xs transition-colors"
                      >
                        File a Report
                        <ArrowRight size={18} className="ml-2" />
                      </button>
                      <button
                        onClick={() => navigate('about')}
                        className="mt-3 sm:mt-0 flex items-center justify-center px-6 py-3 border border-gray-200 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 md:text-lg cursor-pointer transition-colors"
                      >
                        How It Works
                      </button>
                    </>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Right Hero Image Column (Clean, geometric, municipal-themed background) */}
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-gray-50 flex items-center justify-center px-8 py-12 lg:p-16 border-l border-gray-100">
          <div className="w-full max-w-md bg-white rounded-2xl border border-gray-150 p-6 shadow-md relative">
            <div className="absolute -top-3 -right-3 bg-emerald-100 text-emerald-800 p-2 rounded-lg border border-emerald-200 shadow-sm animate-pulse">
              <CheckCircle size={18} />
            </div>

            {/* Simulated Live Report Header */}
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-mono">REPORT #FMC-8941</div>
                <div className="text-sm font-bold text-gray-900">Broken Water Pipe</div>
              </div>
            </div>

            {/* Simulated AI Output Card */}
            <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-150">
                  SMART DISPATCH
                </span>
                <span className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-50 border border-red-150 px-1.5 py-0.5 rounded uppercase">
                  Critical
                </span>
              </div>
              <h4 className="text-xs font-bold text-gray-800">Assigned: Water & Sewer Department</h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-normal">
                "Subsurface water pipe fracture with high-pressure discharge. Requires immediate isolation of water line to prevent pavement collapse."
              </p>
            </div>

            {/* Quick Stats Grid inside Mockup */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100/50 text-center">
                <span className="block text-xs text-blue-600 font-bold font-mono">94.8%</span>
                <span className="text-[10px] text-gray-500 font-medium">Issue Resolution</span>
              </div>
              <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100/50 text-center">
                <span className="block text-xs text-indigo-600 font-bold font-mono">&lt; 2.5 Hrs</span>
                <span className="text-[10px] text-gray-500 font-medium">Average Response</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process Pipeline Overview */}
      <div className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-display font-extrabold text-gray-900 tracking-tight">
              Smarter Civic Routing Pipeline
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-gray-500 text-sm">
              How smart automation accelerates community complaints from reporting to active municipal resolution.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-150 relative">
              <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold absolute -top-4 left-6">
                1
              </div>
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mt-2">
                <FileText size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">1. Citizen Reports</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Citizens submit descriptions, categories, exact addresses, and evidence photos of damaged public infrastructure through our streamlined, mobile-responsive portal.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-150 relative">
              <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold absolute -top-4 left-6">
                2
              </div>
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mt-2">
                <Sparkles size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">2. Automated Analysis</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Our system instantly processes the report to determine urgency, suggest the appropriate responsible department, and outline any public safety risks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-150 relative">
              <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold absolute -top-4 left-6">
                3
              </div>
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mt-2">
                <BarChart2 size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">3. Rapid Resolution</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                Administrators review automated suggestions, dispatch municipal crews, schedule repairs, and provide live status updates to the reporter.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <FixMyCityLogo size={28} textColorClass="text-white" />
            <span className="text-xs bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded-full border border-gray-700 font-mono">
              v1.0.0
            </span>
          </div>
          <div className="flex space-x-6 text-sm">
            <button onClick={() => navigate('about')} className="hover:text-white transition-colors cursor-pointer">About Us</button>
            <button onClick={() => navigate('contact')} className="hover:text-white transition-colors cursor-pointer">Contact Municipal Support</button>
            <button onClick={() => navigate('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
          </div>
          <div className="text-xs text-gray-500">
            &copy; 2026 FixMyCity. Built for digital smart city transformation.
          </div>
        </div>
      </footer>
    </div>
  );
};
