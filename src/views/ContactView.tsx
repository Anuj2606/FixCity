import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

export const ContactView: React.FC = () => {
  const { navigate } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12" id="contact-view">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">
            Contact Municipal Support
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl mx-auto">
            Need assist with logging accounts or reporting system difficulties? Speak directly with municipal technical administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Card 1 */}
          <div className="bg-white border border-gray-150 rounded-xl p-6 shadow-xs text-center">
            <div className="mx-auto bg-blue-50 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Phone size={20} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Municipal Hotlines</h3>
            <p className="text-xs text-gray-500 mt-2">Civic Call Center: <strong>311</strong></p>
            <p className="text-xs text-gray-500 mt-1">Direct Technical Line: <strong>+1 (555) 311-8900</strong></p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-150 rounded-xl p-6 shadow-xs text-center">
            <div className="mx-auto bg-blue-50 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Mail size={20} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Inquiries & Escalation</h3>
            <p className="text-xs text-gray-500 mt-2">citizens@fixmycity.gov</p>
            <p className="text-xs text-gray-500 mt-1">systems@fixmycity.gov</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-150 rounded-xl p-6 shadow-xs text-center">
            <div className="mx-auto bg-blue-50 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Clock size={20} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Operating Hours</h3>
            <p className="text-xs text-gray-500 mt-2">Mon - Fri: 8:00 AM - 5:00 PM</p>
            <p className="text-xs text-gray-500 mt-1">Emergency Dispatch: <strong>24/7</strong></p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-8 max-w-2xl mx-auto">
          <h2 className="text-lg font-display font-bold text-gray-900 mb-6">Send a Digital Inquiry</h2>
          
          {submitted ? (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 p-6 rounded-xl flex items-start space-x-3">
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Message Sent Successfully</h4>
                <p className="text-xs mt-1 leading-normal text-emerald-700">
                  Your inquiry has been logged in our general ticketing system. A municipal technical representative will email you back within 24 business hours.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-3 text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-250 rounded-lg text-sm bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-250 rounded-lg text-sm bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-250 rounded-lg text-sm bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Problem setting up my citizen account"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Detailed Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-250 rounded-lg text-sm bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Please write your detailed feedback or support request here..."
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Send size={16} />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
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
