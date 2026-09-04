import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Brain, Cpu, TrendingUp, Compass, Clock, CheckCircle } from 'lucide-react';

export const AboutView: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="bg-gray-50 min-h-screen py-12" id="about-view">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight sm:text-4xl">
            Empowering Smarter Municipalities
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
            FixMyCity connects community members with municipal crews through real-time updates, structured problem tracking, and instant automated summaries.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-8 mb-8">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Civic infrastructure maintenance is often slowed by manual categorization delays, department misrouting, and communication gaps. <strong>FixMyCity</strong> is designed to bypass administrative delays by applying <strong>smart automation and instant issue classification</strong> upon intake. 
          </p>

          <h2 className="text-xl font-display font-bold text-gray-900 mb-4">How Smart Classification Helps</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            When a citizen reports a concern (such as a "deep pothole on Main Street"), our system instantly processes the report to perform several helpful steps:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="flex space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-150">
              <Brain className="text-blue-600 shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Smart Categorization</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Filters text into clear categories like Road Damage, Water/Sewer, or Electricity to prevent human sorting delay.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-150">
              <Cpu className="text-blue-600 shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Urgency Sorting</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Evaluates public hazards on standard criteria, identifying "Critical" risks (e.g., exposed cables) immediately.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-150">
              <Compass className="text-blue-600 shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Department Routing</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Routes complaints to specific municipal departments (e.g., Water & Sewer Department) to minimize runaround.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-150">
              <TrendingUp className="text-blue-600 shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Issue Summary</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Explains potential underlying factors and consequences of delay to guide work prioritizing.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-display font-bold text-gray-900 mb-4">Planned Civic Platform Improvements</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            The database schemas and module structure are built specifically for modular future expansion, preparing our platform to scale without complex overhauls:
          </p>

          <ul className="space-y-3">
            <li className="flex items-start">
              <CheckCircle className="text-emerald-500 mt-0.5 shrink-0 mr-2" size={16} />
              <span className="text-sm text-gray-600">
                <strong>Computer Vision</strong>: Deep learning models to auto-detect asphalt decay and classify severity from uploaded photos automatically.
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="text-emerald-500 mt-0.5 shrink-0 mr-2" size={16} />
              <span className="text-sm text-gray-600">
                <strong>Duplicate Complaint Merging</strong>: AI algorithms to group duplicate reports on nearby coordinates into a single municipal work order.
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="text-emerald-500 mt-0.5 shrink-0 mr-2" size={16} />
              <span className="text-sm text-gray-600">
                <strong>Predictive Analytics & Heatmaps</strong>: Heatmapping infrastructure failure frequencies to help departments plan preventive maintenance.
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="text-emerald-500 mt-0.5 shrink-0 mr-2" size={16} />
              <span className="text-sm text-gray-600">
                <strong>Community Voting & Crowdsourcing</strong>: Letting local neighbors upvote issues to signal high community-demand to council planners.
              </span>
            </li>
          </ul>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('home')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            &larr; Back to Home Page
          </button>
        </div>
      </div>
    </div>
  );
};
