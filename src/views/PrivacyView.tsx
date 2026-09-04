import React from 'react';
import { useApp } from '../context/AppContext';

export const PrivacyView: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="bg-gray-50 min-h-screen py-12" id="privacy-view">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-8 sm:p-10">
          <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight mb-2">
            Privacy Policy & Data Standards
          </h1>
          <p className="text-xs text-gray-400 font-mono mb-6">Last Revised: June 25, 2026</p>

          <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
            <p>
              FixMyCity ("the Platform") is a smart-city service application built to assist municipal councils and civic teams with identifying and prioritizing infrastructure repairs. This privacy policy describes how citizen reports, descriptions, spatial locations, and uploaded photos are treated.
            </p>

            <h2 className="text-base font-bold text-gray-900 font-display uppercase tracking-wider">
              1. Information We Collect
            </h2>
            <p>
              <strong>Submitted Reports</strong>: When logging an infrastructure concern, we collect the title, detailed description, general category, specified address, and optional uploaded images. These reports are published on citizen feeds to maintain community transparency.
            </p>
            <p>
              <strong>Location Tagging</strong>: The Platform requests general street names or addresses to associate reports with specific repair zones. Coordinates are used strictly for diagnostic routing and public GIS mapping.
            </p>
            <p>
              <strong>Account Authentication</strong>: Firebase Authentication collects email addresses and user names securely. Passwords are encrypted directly on Google server nodes and are invisible to our municipal administrators.
            </p>

            <h2 className="text-base font-bold text-gray-900 font-display uppercase tracking-wider">
              2. How Information is Disclosed & Analyzed
            </h2>
            <p>
              <strong>Intelligent AI Diagnostic Engines</strong>: Submitted issue descriptions are processed securely server-side using advanced AI models. The AI analyzes text strictly to output automated classification fields (category, severity level, technical repair summaries). No personally identifying profile data is shared or transmitted to unauthorized third parties.
            </p>
            <p>
              <strong>Municipal Staff</strong>: Verified municipal engineers, dispatch coordinators, and administrators can review your submission, leaves comments, and re-allocate task priorities on your specific reports.
            </p>

            <h2 className="text-base font-bold text-gray-900 font-display uppercase tracking-wider">
              3. Data Retention & Cache Removal
            </h2>
            <p>
              Civic data reports remain in our Cloud Firestore database for historical logging and predictive urban planning. Citizens can request complete account deletion or report redaction by emailing <strong>systems@fixmycity.gov</strong>.
            </p>
          </div>

          {/* Back Link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button
              onClick={() => navigate('home')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              &larr; Back to Home Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
