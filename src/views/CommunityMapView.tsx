import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, Search, Filter, Compass, AlertCircle, RefreshCw, 
  ArrowRight, Shield, BarChart3, Clock, CheckCircle, Sparkles, AlertTriangle, Play
} from 'lucide-react';
import { IssueReport, IssueStatus, IssueSeverity } from '../types';

// Default city center: San Francisco Civic Center
const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

interface GPSCoords {
  lat: number;
  lng: number;
}

// Deterministic mock coordinate assignment for demo / seed issues that don't have explicit coords in their string.
export function getIssueCoordinates(issue: IssueReport): GPSCoords {
  if (issue.latitude !== undefined && issue.longitude !== undefined) {
    return {
      lat: issue.latitude,
      lng: issue.longitude
    };
  }
  const coordRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
  const match = issue.location.match(coordRegex);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2])
    };
  }

  let latOffset = 0;
  let lngOffset = 0;

  if (issue.id === 'issue-seed-1') {
    latOffset = 0.0035;
    lngOffset = -0.0042;
  } else if (issue.id === 'issue-seed-2') {
    latOffset = -0.0028;
    lngOffset = 0.0051;
  } else if (issue.id === 'issue-seed-3') {
    latOffset = 0.0012;
    lngOffset = 0.0018;
  } else {
    // Deterministic hashing
    let hash = 0;
    for (let i = 0; i < issue.id.length; i++) {
      hash = issue.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    latOffset = ((hash % 120) / 10000) - 0.006;
    lngOffset = (((hash >> 4) % 120) / 10000) - 0.006;
  }

  return {
    lat: DEFAULT_CENTER.lat + latOffset,
    lng: DEFAULT_CENTER.lng + lngOffset
  };
}

// Haversine distance calculation in kilometers
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const CommunityMapView: React.FC = () => {
  const { issues, loadingIssues, userProfile, currentRoute, navigate } = useApp();

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // User Current Location State
  const [userLocation, setUserLocation] = useState<GPSCoords | null>(null);
  const [locating, setLocating] = useState(false);

  // Map viewport states
  const [mapCenter, setMapCenter] = useState<GPSCoords>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [visibleBounds, setVisibleBounds] = useState<L.LatLngBounds | null>(null);

  // Selected Marker State
  const [selectedIssue, setSelectedIssue] = useState<IssueReport | null>(null);

  // Search & Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // 'week', 'month', 'all'

  // Categories list
  const categories = [
    'Road Damage',
    'Sanitation & Waste',
    'Streetlights & Electricity',
    'Water & Sewer',
    'Parks & Recreation',
    'Public Health & Safety',
    'Other'
  ];

  // Departments list
  const departments = [
    'Public Works Department',
    'Sanitation & Waste Management',
    'Traffic Control & Lighting',
    'Water & Sewer Authority',
    'Parks & Recreation Department',
    'Department of Public Health & Safety'
  ];

  // Geolocation detection on mount
  useEffect(() => {
    handleLocateMe(false); // Initial prompt, don't force if they reject
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Create Map Instance
      const map = L.map(mapContainerRef.current, {
        center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });

      // Add Tile Layer using OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Create Layer Groups
      markerLayerRef.current = L.layerGroup().addTo(map);
      userLocationLayerRef.current = L.layerGroup().addTo(map);

      // Listen to Map Viewport Boundaries
      map.on('zoomend', () => {
        setMapZoom(map.getZoom());
      });

      map.on('moveend', () => {
        setMapZoom(map.getZoom());
        setMapCenter({
          lat: map.getCenter().lat,
          lng: map.getCenter().lng
        });
        setVisibleBounds(map.getBounds());
      });

      // Save map instance
      mapInstanceRef.current = map;

      // Force initial bounds check
      setVisibleBounds(map.getBounds());
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerLayerRef.current = null;
        userLocationLayerRef.current = null;
      }
    };
  }, []);

  // Handle Route Params for highlighting a specific issue
  useEffect(() => {
    const highlightId = currentRoute.params?.highlightIssueId;
    if (highlightId && issues.length > 0 && mapInstanceRef.current) {
      const match = issues.find(i => i.id === highlightId);
      if (match) {
        setSelectedIssue(match);
        const coords = getIssueCoordinates(match);
        mapInstanceRef.current.setView([coords.lat, coords.lng], 16);
        
        // Let markers render first then trigger popup open
        setTimeout(() => {
          const marker = markersRef.current[match.id];
          if (marker) {
            marker.openPopup();
          }
        }, 150);
      }
    }
  }, [currentRoute.params?.highlightIssueId, issues]);

  // Handle selectedIssue change programmatically (e.g., from nearby list clicks)
  useEffect(() => {
    if (selectedIssue && mapInstanceRef.current) {
      const coords = getIssueCoordinates(selectedIssue);
      mapInstanceRef.current.setView([coords.lat, coords.lng], 16);
      const marker = markersRef.current[selectedIssue.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedIssue]);

  // Retrieve Location Permission and Coordinates
  const handleLocateMe = (showError = true) => {
    if (!navigator.geolocation) {
      if (showError) alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setMapCenter(coords);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([coords.lat, coords.lng], 15);
        }
        setLocating(false);
      },
      (error) => {
        console.warn("Geolocation access denied:", error);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // 1. Filtered Issues based on Search & Toolbar input
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      // Search matching title, description, and location text
      const matchesSearch = 
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === '' || issue.category === categoryFilter;
      const matchesPriority = priorityFilter === '' || issue.severity === priorityFilter;
      const matchesStatus = statusFilter === '' || issue.status === statusFilter;
      const matchesDepartment = departmentFilter === '' || issue.assignedDepartment === departmentFilter;

      // Verification Level Filter:
      // 'high' (>=3 verifications), 'some' (1-2), 'none' (0)
      const verifications = issue.verifications || [];
      const totalVerifications = verifications.length;
      let matchesVerification = true;
      if (verificationFilter === 'high') {
        matchesVerification = totalVerifications >= 3;
      } else if (verificationFilter === 'some') {
        matchesVerification = totalVerifications >= 1 && totalVerifications < 3;
      } else if (verificationFilter === 'none') {
        matchesVerification = totalVerifications === 0;
      }

      // Date Filter
      let matchesDate = true;
      if (dateFilter === 'week') {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = new Date(issue.createdAt) >= oneWeekAgo;
      } else if (dateFilter === 'month') {
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = new Date(issue.createdAt) >= oneMonthAgo;
      }

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesDepartment && matchesVerification && matchesDate;
    });
  }, [issues, searchTerm, categoryFilter, priorityFilter, statusFilter, departmentFilter, verificationFilter, dateFilter]);

  // 2. Custom Distance-Based Dynamic Clustering
  const clusteredItems = useMemo(() => {
    if (mapZoom >= 15) {
      // Zoomed in close: do not cluster, just show individual markers
      return filteredIssues.map(issue => ({
        isCluster: false,
        id: `issue-${issue.id}`,
        center: getIssueCoordinates(issue),
        issuesList: [issue]
      }));
    }

    // Proximity threshold (in degrees of lat/lng) depending on Zoom Level
    let threshold = 0.015; // default zoom 12
    if (mapZoom >= 14) threshold = 0.003;
    else if (mapZoom >= 13) threshold = 0.007;
    else if (mapZoom <= 10) threshold = 0.04;

    const clusters: Array<{
      isCluster: boolean;
      id: string;
      center: GPSCoords;
      issuesList: IssueReport[];
    }> = [];

    filteredIssues.forEach(issue => {
      const coords = getIssueCoordinates(issue);
      
      // Find matching cluster
      let found = false;
      for (let i = 0; i < clusters.length; i++) {
        const c = clusters[i];
        const dist = Math.sqrt(
          Math.pow(c.center.lat - coords.lat, 2) + 
          Math.pow(c.center.lng - coords.lng, 2)
        );
        if (dist < threshold) {
          c.issuesList.push(issue);
          // Update centroid to keep it accurate
          const len = c.issuesList.length;
          c.center = {
            lat: (c.center.lat * (len - 1) + coords.lat) / len,
            lng: (c.center.lng * (len - 1) + coords.lng) / len
          };
          c.isCluster = true;
          found = true;
          break;
        }
      }

      if (!found) {
        clusters.push({
          isCluster: false,
          id: `cluster-${issue.id}`,
          center: coords,
          issuesList: [issue]
        });
      }
    });

    return clusters;
  }, [filteredIssues, mapZoom]);

  // 3. Nearby Community Issues Panel Calculations
  const sortedNearbyIssues = useMemo(() => {
    const origin = userLocation || mapCenter;
    return filteredIssues
      .map(issue => {
        const coords = getIssueCoordinates(issue);
        const distance = getDistanceKm(origin.lat, origin.lng, coords.lat, coords.lng);
        return { issue, distance };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [filteredIssues, userLocation, mapCenter]);

  // 4. Administrator Insights Calculations
  const adminInsights = useMemo(() => {
    // Filter issues that are actually visible in the current viewport bounds
    const visibleIssues = filteredIssues.filter(issue => {
      if (!visibleBounds) return true; // fallback
      const coords = getIssueCoordinates(issue);
      return visibleBounds.contains([coords.lat, coords.lng]);
    });

    // Department Workload
    const deptWorkload: { [key: string]: number } = {};
    visibleIssues.forEach(i => {
      deptWorkload[i.assignedDepartment] = (deptWorkload[i.assignedDepartment] || 0) + 1;
    });

    // High Priority count
    const highPriorityCount = visibleIssues.filter(i => i.severity === 'high' || i.severity === 'critical').length;

    // Recently Reported List
    const recentIssues = [...visibleIssues]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);

    return {
      densityCount: visibleIssues.length,
      highPriorityCount,
      deptWorkload,
      recentIssues
    };
  }, [filteredIssues, visibleBounds]);

  const getPriorityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#EF4444'; // Red
      case 'high': return '#F97316';     // Orange
      case 'medium': return '#F59E0B';   // Yellow
      case 'low': return '#10B981';      // Green (requested: 🟢 Low)
      default: return '#6B7280';         // Gray
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-blue-50 text-blue-700 border-blue-150';
      case 'under_review': return 'bg-amber-50 text-amber-700 border-amber-150';
      case 'in_progress': return 'bg-indigo-50 text-indigo-700 border-indigo-150';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      default: return 'bg-gray-50 text-gray-700 border-gray-150';
    }
  };

  // Synchronize dynamic marker layers in Leaflet when clusters or filter states change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerLayerRef.current) return;

    // Clear previous markers
    markerLayerRef.current.clearLayers();
    markersRef.current = {};

    clusteredItems.forEach(cluster => {
      if (cluster.isCluster) {
        const count = cluster.issuesList.length;
        let worstSeverity: IssueSeverity = 'low';
        if (cluster.issuesList.some(i => i.severity === 'critical')) worstSeverity = 'critical';
        else if (cluster.issuesList.some(i => i.severity === 'high')) worstSeverity = 'high';
        else if (cluster.issuesList.some(i => i.severity === 'medium')) worstSeverity = 'medium';

        const color = getPriorityColor(worstSeverity);

        const clusterIcon = L.divIcon({
          className: 'custom-cluster-marker',
          html: `
            <div class="h-8 w-8 rounded-full text-white font-bold flex items-center justify-center text-xs border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-110" style="background-color: ${color};">
              ${count}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        L.marker([cluster.center.lat, cluster.center.lng], { icon: clusterIcon })
          .on('click', () => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([cluster.center.lat, cluster.center.lng], Math.min(mapInstanceRef.current.getZoom() + 2, 16));
            }
          })
          .addTo(markerLayerRef.current!);
      } else {
        const issue = cluster.issuesList[0];
        const priorityColor = getPriorityColor(issue.severity);
        const isHighlighted = selectedIssue?.id === issue.id;

        const singleIcon = L.divIcon({
          className: 'custom-single-marker',
          html: `
            <div class="flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-115" style="transform: ${isHighlighted ? 'scale(1.25)' : 'none'}">
              <div class="h-6 w-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-black" style="background-color: ${priorityColor}">
                ${issue.severity.charAt(0).toUpperCase()}
              </div>
              <div class="h-1.5 w-1.5 rounded-full border border-white -mt-0.5 shadow-sm" style="background-color: ${priorityColor}"></div>
            </div>
          `,
          iconSize: [24, 28],
          iconAnchor: [12, 28]
        });

        const totalVerifications = issue.verifications?.length || 0;
        const resolvedVotes = issue.verifications?.filter(v => v.voteType === 'resolve').length || 0;
        
        let verificationHTML = '';
        if (totalVerifications > 0) {
          if (issue.status !== 'resolved' && resolvedVotes >= 1) {
            verificationHTML = `
              <div class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2 text-[10px] leading-normal font-semibold mt-1">
                ⚠️ Community reports indicate this issue may already be resolved. Awaiting administrative confirmation.
              </div>
            `;
          } else if (totalVerifications >= 3) {
            verificationHTML = `
              <div class="bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-lg p-2 text-[10px] leading-normal font-bold mt-1">
                ✔️ Highly Verified: ${totalVerifications} Residents Confirmed
              </div>
            `;
          } else {
            verificationHTML = `
              <div class="bg-blue-50 border border-blue-100 text-blue-800 rounded-lg p-2 text-[10px] leading-normal font-semibold mt-1">
                ✔️ ${totalVerifications} Residents Confirmed
              </div>
            `;
          }
        }

        const popupContent = `
          <div class="p-3 max-w-[280px] space-y-2 text-left font-sans">
            <div class="flex items-center justify-between gap-2 border-b border-gray-100 pb-1.5">
              <span class="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                ${issue.category}
              </span>
              <span class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border font-mono ${
                issue.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                issue.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-250' :
                issue.severity === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-250' :
                'bg-emerald-50 text-emerald-700 border-emerald-250'
              }">
                ${issue.severity}
              </span>
            </div>

            <div>
              <h4 class="font-bold text-gray-900 text-sm leading-tight">
                ${issue.title}
              </h4>
              <p class="text-[10px] text-gray-400 mt-0.5 font-mono line-clamp-1">
                📍 ${issue.location}
              </p>
            </div>

            <div class="bg-gray-50 border border-gray-150 rounded-lg p-2 space-y-1">
              <p class="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-medium">
                ${issue.aiSummary || issue.description}
              </p>
              <div class="flex justify-between items-center text-[9px] text-gray-400 font-mono border-t border-gray-100 pt-1 mt-1">
                <span>Status: <strong class="text-gray-600">${issue.status.replace('_', ' ')}</strong></span>
                <span>Dept: <strong class="text-gray-600">${issue.assignedDepartment.replace('Department', 'Dept')}</strong></span>
              </div>
            </div>

            ${verificationHTML}

            <button
              data-issue-id="${issue.id}"
              class="view-report-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-all shadow-2xs mt-2"
            >
              <span>View Full Details</span>
              <span>&rarr;</span>
            </button>
          </div>
        `;

        const marker = L.marker([cluster.center.lat, cluster.center.lng], { icon: singleIcon })
          .bindPopup(popupContent, { maxWidth: 300 })
          .on('click', () => {
            setSelectedIssue(issue);
          })
          .addTo(markerLayerRef.current!);

        // Save reference
        markersRef.current[issue.id] = marker;
      }
    });
  }, [clusteredItems, selectedIssue]);

  // Handle User Location Layer syncing
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocationLayerRef.current) return;

    userLocationLayerRef.current.clearLayers();

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div class="relative flex h-5 w-5 items-center justify-center">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span class="relative inline-flex h-3 w-3 rounded-full bg-blue-600 border border-white"></span>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .bindPopup("<b class='font-sans text-xs text-gray-800'>📍 Your Current Location</b>")
        .addTo(userLocationLayerRef.current);
    }
  }, [userLocation]);

  // Click handler listener for custom popup buttons
  useEffect(() => {
    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.view-report-btn');
      if (btn) {
        const issueId = btn.getAttribute('data-issue-id');
        if (issueId) {
          navigate('issue-details', { id: issueId });
        }
      }
    };

    document.addEventListener('click', handlePopupClick);
    return () => {
      document.removeEventListener('click', handlePopupClick);
    };
  }, [navigate]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setPriorityFilter('');
    setStatusFilter('');
    setDepartmentFilter('');
    setVerificationFilter('');
    setDateFilter('');
  };

  if (loadingIssues) {
    return (
      <div className="bg-gray-50 min-h-screen py-6 font-sans animate-pulse" id="community-map-page-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Block */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="space-y-2">
              <div className="h-7 bg-gray-200 rounded-full w-56 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-full w-96 animate-pulse"></div>
            </div>
            <div className="h-10 w-28 bg-gray-200 rounded-xl"></div>
          </div>

          {/* Filters Toolbar */}
          <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-xs mb-6 h-20 animate-pulse"></div>

          {/* Master Map Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-200 border border-gray-150 rounded-2xl animate-pulse animate-pulse" style={{ height: '550px' }}></div>
              <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-5 h-44 animate-pulse animate-pulse"></div>
            </div>
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-gray-150 rounded-2xl p-5 h-96 animate-pulse animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6 font-sans" id="community-map-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Compass className="text-blue-600 shrink-0" size={26} />
              <span>Community Map Portal</span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Visualize real-time, AI-triaged civic reports across the municipality using OpenStreetMap.
            </p>
          </div>
          
          <button
            onClick={() => handleLocateMe(true)}
            disabled={locating}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white font-bold px-4 py-2 rounded-xl shadow-xs text-xs cursor-pointer transition-all shrink-0"
            id="locate-me-btn"
          >
            <Compass size={14} className={locating ? "animate-spin" : ""} />
            <span>{locating ? "Locating..." : "Locate Me"}</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-xs mb-6 space-y-3" id="map-filters-toolbar">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Filter size={13} />
              <span>Map Display Controls</span>
            </span>
            {(searchTerm || categoryFilter || priorityFilter || statusFilter || departmentFilter || verificationFilter || dateFilter) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 text-[11px] font-bold text-gray-500 hover:text-red-650 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-150 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                <RefreshCw size={11} />
                <span>Reset Map Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Search */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 font-mono">
                Keyword Search
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400">
                  <Search size={12} />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden focus:border-blue-500"
                  placeholder="Street, category, issue..."
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 font-mono">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-1.5 py-1 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden text-gray-700"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 font-mono">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-1.5 py-1 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden text-gray-700"
              >
                <option value="">All Priorities</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 font-mono">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-1.5 py-1 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden text-gray-700"
              >
                <option value="">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 font-mono">
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-1.5 py-1 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden text-gray-700"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Verification */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 font-mono">
                Verification
              </label>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="w-full px-1.5 py-1 border border-gray-250 rounded-lg text-xs bg-white focus:outline-hidden text-gray-700"
              >
                <option value="">Any Level</option>
                <option value="high">Verified (3+ votes)</option>
                <option value="some">Supported (1-2 votes)</option>
                <option value="none">No Votes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Master Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Map Canvas Box (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs relative" style={{ height: '550px' }} id="map-container-box">
              {/* Native Leaflet Map div */}
              <div ref={mapContainerRef} className="w-full h-full z-0"></div>

              {/* Float map legends */}
              <div className="absolute bottom-4 left-4 bg-white/95 border border-gray-150 p-2.5 rounded-xl shadow-md z-[1000] text-[10px] space-y-2 font-mono">
                <div>
                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[9px] mb-1">Priority Levels</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-xs"></span>
                      <span className="text-gray-600">🔴 Critical</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-white shadow-xs"></span>
                      <span className="text-gray-600">🟠 High</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-xs"></span>
                      <span className="text-gray-600">🟡 Medium</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white shadow-xs"></span>
                      <span className="text-gray-600">🟢 Low</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-1.5">
                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[9px] mb-1">Community Confirmation</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-300"></span>
                      <span className="text-gray-600">Highly Verified</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300"></span>
                      <span className="text-gray-600">Under Review</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-300"></span>
                      <span className="text-gray-600">Resolved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel: Nearby Community Issues */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-5" id="nearby-community-panel">
              <h2 className="text-md font-display font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                <span>Nearby Community Issues</span>
                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                  {userLocation ? "Sorted by GPS distance" : "Sorted from city center"}
                </span>
              </h2>

              {sortedNearbyIssues.length === 0 ? (
                <div className="text-center py-12 text-gray-450 text-xs italic bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center space-y-2">
                  <AlertCircle className="text-gray-300" size={28} />
                  <span>No community issues have been reported in this area yet.</span>
                  <span className="text-[10px] text-gray-400 font-sans not-italic">Encourage users to report issues when necessary.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedNearbyIssues.slice(0, 4).map(({ issue, distance }) => {
                    const confirmCount = issue.verifications?.filter(v => v.voteType === 'confirm').length || 0;
                    return (
                      <div 
                        key={issue.id}
                        onClick={() => {
                          setSelectedIssue(issue);
                        }}
                        className={`p-3 border rounded-xl hover:bg-blue-50/40 transition-all cursor-pointer flex flex-col justify-between ${
                          selectedIssue?.id === issue.id ? 'border-blue-500 bg-blue-50/20 shadow-xs' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 text-[9px] font-mono text-gray-400 mb-1">
                            <span className="text-blue-600 font-bold uppercase">{issue.category}</span>
                            <span className="font-bold bg-white border border-gray-150 px-1.5 py-0.5 rounded shrink-0">
                              {distance.toFixed(2)} km away
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-gray-800 line-clamp-1">{issue.title}</h4>
                          <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 font-medium">{issue.location}</p>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border tracking-wide font-mono ${getStatusBadgeClass(issue.status)}`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] text-gray-400 font-semibold font-mono flex items-center gap-1">
                            <CheckCircle size={10} className="text-emerald-500" />
                            <span>{confirmCount} votes</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Insights Panel: Dynamic based on Administrator/Citizen roles) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Conditional Insights header */}
            {userProfile?.role === 'admin' ? (
              // ADMIN CONTROL CENTER
              <div className="space-y-6" id="admin-map-tools">
                {/* Visual statistics card */}
                <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs border-t-4 border-t-amber-500">
                  <h3 className="text-md font-display font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-1.5">
                    <Shield className="text-amber-500" size={18} />
                    <span>Regional Hotspots & Workload</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <span className="block text-2xl font-bold font-mono text-gray-800">{adminInsights.densityCount}</span>
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold block mt-0.5">Visible Issues</span>
                    </div>
                    <div className="bg-red-550/20 border border-red-200 rounded-xl p-3 text-center">
                      <span className="block text-2xl font-bold font-mono text-red-700">{adminInsights.highPriorityCount}</span>
                      <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold block mt-0.5">High Threats</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <span className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                      Department Workload
                    </span>
                    
                    {departments.map(dept => {
                      const count = adminInsights.deptWorkload[dept] || 0;
                      const percentage = adminInsights.densityCount > 0 
                        ? (count / adminInsights.densityCount) * 100 
                        : 0;

                      return (
                        <div key={dept} className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-600 font-semibold">
                            <span className="truncate pr-4">{dept.replace('Department', 'Dept')}</span>
                            <span className="font-mono">{count} tickets</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${percentage}%` }}
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recently Reported visible issues list */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-md font-display font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-1.5">
                    <Clock className="text-gray-400" size={17} />
                    <span>Recently Reported Nearby</span>
                  </h3>

                  {adminInsights.recentIssues.length === 0 ? (
                    <p className="text-xs text-gray-405 italic">No visible issues within map bounds.</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {adminInsights.recentIssues.map(issue => (
                        <div 
                          key={issue.id}
                          onClick={() => {
                            setSelectedIssue(issue);
                          }}
                          className={`py-3 first:pt-0 last:pb-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                            selectedIssue?.id === issue.id ? 'bg-blue-50/10' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-bold text-gray-800 truncate">{issue.title}</h4>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border shrink-0 ${
                              issue.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-150' :
                              issue.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-150' :
                              'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5 font-mono">{issue.location}</p>
                          <div className="flex items-center space-x-2 mt-1.5">
                            <span className="text-[9px] text-gray-500 font-mono">
                              {new Date(issue.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // CITIZEN GUIDE & QUICK ADVICE PANEL
              <div className="space-y-6" id="citizen-map-tools">
                {/* Quick Advice Panel */}
                <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
                  <div className="relative z-10 space-y-3">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-blue-200 bg-blue-800/60 px-2 py-0.5 rounded-full border border-blue-600/35">
                      Citizen Partner Dashboard
                    </span>
                    <h3 className="text-lg font-display font-black leading-tight">
                      Collaborative Spatial Awareness
                    </h3>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      By visualizing reports geographically, you can see if an issue in your neighborhood has already been logged.
                    </p>
                    <div className="bg-white/10 border border-white/15 rounded-xl p-3 flex items-start gap-2.5">
                      <Sparkles className="text-amber-300 shrink-0 mt-0.5" size={14} />
                      <p className="text-[11px] text-blue-50 leading-normal font-medium">
                        Prevent duplicates by verifying existences or voting on resolutions to let dispatchers know the status.
                      </p>
                    </div>
                  </div>
                  <div className="absolute -right-16 -bottom-16 w-36 h-36 rounded-full bg-blue-600/20 blur-xl"></div>
                </div>

                {/* Nearby Hotspot / Density tracker */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-mono font-black text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
                    City Center Heatmap Summary
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-gray-600">Total Active Complaints</span>
                      <span className="text-gray-900 font-mono font-bold">{filteredIssues.length}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-gray-600">Under Review / Scheduled</span>
                      <span className="text-gray-900 font-mono font-bold">
                        {filteredIssues.filter(i => i.status === 'under_review' || i.status === 'in_progress').length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-gray-600">Resolved Today</span>
                      <span className="text-gray-900 font-mono font-bold">
                        {filteredIssues.filter(i => i.status === 'resolved').length}
                      </span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex gap-2">
                    <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                    <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                      Your spatial validation helps speed up civic crew dispatch schedules by over 35%!
                    </p>
                  </div>
                </div>
              </div>
            )}
            
          </div>

        </div>

      </div>
    </div>
  );
};
