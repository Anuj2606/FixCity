import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { ShieldCheck, BarChart2, TrendingUp, AlertCircle, MapPin, Clock } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { issues, loadingIssues } = useApp();

  if (loadingIssues) {
    return (
      <div className="bg-gray-50 min-h-screen py-8 font-sans animate-pulse" id="analytics-view-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 shadow-xs mb-8 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded-full w-48 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded-full w-80 animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-white border border-gray-150 rounded-xl p-5 shadow-xs h-24 animate-pulse"></div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map(n => (
              <div key={n} className="bg-white border border-gray-150 rounded-2xl p-6 h-96 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 1. Category Distribution Data
  const categories = [
    'Road Damage',
    'Sanitation & Waste',
    'Streetlights & Electricity',
    'Water & Sewer',
    'Parks & Recreation',
    'Public Health & Safety',
    'Other'
  ];

  const categoryData = categories.map(cat => ({
    name: cat,
    count: issues.filter(i => i.category === cat).length
  })).filter(item => item.count > 0);

  // 2. Severity Split Data
  const severities = ['low', 'medium', 'high', 'critical'];
  const severityColors = {
    low: '#9ca3af',     // slate gray
    medium: '#f59e0b',  // amber yellow
    high: '#ea580c',    // orange
    critical: '#dc2626' // red
  };

  const severityData = severities.map(sev => ({
    name: sev.toUpperCase(),
    value: issues.filter(i => i.severity === sev).length,
    color: severityColors[sev as keyof typeof severityColors]
  })).filter(item => item.value > 0);

  // 3. Status Breakdown Data
  const statuses = [
    { key: 'reported', label: 'Reported', color: '#3b82f6' },
    { key: 'under_review', label: 'Under Review', color: '#f59e0b' },
    { key: 'in_progress', label: 'In Progress', color: '#6366f1' },
    { key: 'resolved', label: 'Resolved', color: '#10b981' }
  ];

  const statusData = statuses.map(stat => ({
    name: stat.label,
    count: issues.filter(i => i.status === stat.key).length,
    color: stat.color
  })).filter(item => item.count > 0);

  // 4. Hotspots (Location occurrences)
  const locationCounts: { [key: string]: number } = {};
  issues.forEach(i => {
    locationCounts[i.location] = (locationCounts[i.location] || 0) + 1;
  });

  const hotspotData = Object.entries(locationCounts)
    .map(([loc, cnt]) => ({ location: loc, reports: cnt }))
    .sort((a, b) => b.reports - a.reports)
    .slice(0, 5);

  return (
    <div className="bg-gray-50 min-h-screen py-8 font-sans" id="analytics-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 max-w-max mb-2">
            <BarChart2 size={12} />
            <span>Smart City Infrastructure Metrics</span>
          </div>
          <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight sm:text-3xl">
            Municipal Reports & Insights
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review citizen report distributions, team response workloads, and problem zones.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Category Chart (Left 2 cols) */}
          <div className="lg:col-span-2 bg-white border border-gray-150 rounded-2xl shadow-xs p-6">
            <h3 className="text-md font-display font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <TrendingUp size={16} className="text-blue-600" />
              <span>Complaints by Infrastructure Category</span>
            </h3>

            {categoryData.length === 0 ? (
              <div className="text-center py-20 text-gray-450 text-xs italic">
                No active complaints registered to chart.
              </div>
            ) : (
              <div className="h-80 w-full text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9ca3af" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontFamily: 'monospace' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Severity Split Pie Chart (Right 1 col) */}
          <div className="lg:col-span-1 bg-white border border-gray-150 rounded-2xl shadow-xs p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-md font-display font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <AlertCircle size={16} className="text-amber-500" />
                <span>Urgency Severity Breakdown</span>
              </h3>

              {severityData.length === 0 ? (
                <div className="text-center py-16 text-gray-450 text-xs italic">No data.</div>
              ) : (
                <div className="h-56 w-full flex items-center justify-center font-mono text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Legend Labels */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100 text-xs font-semibold">
              {severityData.map(item => (
                <div key={item.name} className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600 truncate">{item.name}: <strong className="text-gray-900 font-mono">{item.value}</strong></span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Pipeline distribution */}
          <div className="lg:col-span-1 bg-white border border-gray-150 rounded-2xl shadow-xs p-6">
            <h3 className="text-md font-display font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Clock size={16} className="text-indigo-600" />
              <span>Resolution Pipeline Tracking</span>
            </h3>

            {statusData.length === 0 ? (
              <div className="text-center py-12 text-gray-450 text-xs italic">No pipeline metrics.</div>
            ) : (
              <div className="space-y-4">
                {statusData.map(stat => {
                  const percent = Math.round((stat.count / issues.length) * 100);
                  return (
                    <div key={stat.name} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-gray-700">
                        <span className="font-semibold">{stat.name}</span>
                        <span className="font-mono text-gray-500">{stat.count} ({percent}%)</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%`, backgroundColor: stat.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Location Hotspots (Left 2 cols) */}
          <div className="lg:col-span-2 bg-white border border-gray-150 rounded-2xl shadow-xs p-6">
            <h3 className="text-md font-display font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <MapPin size={16} className="text-red-500" />
              <span>Infrastructure High-Frequency Zones (Hotspots)</span>
            </h3>

            {hotspotData.length === 0 ? (
              <div className="text-center py-16 text-gray-450 text-xs italic">
                No reports cataloged to rank hotspots.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 font-sans text-xs">
                {hotspotData.map((spot, idx) => (
                  <div key={spot.location} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-3">
                      <span className="h-5 w-5 bg-blue-50 text-blue-700 border border-blue-150 rounded-full flex items-center justify-center font-mono font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-gray-800 font-semibold">{spot.location}</span>
                    </div>
                    <span className="font-mono bg-red-50 text-red-700 border border-red-100 font-bold px-2.5 py-0.5 rounded-full">
                      {spot.reports} reports
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
